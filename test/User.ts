import { assert, expect } from "chai";
import {
  Cids,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  nodes,
  takeSnapshot,
  revertToSnapshot,
  userStorage,
  accountAddresses,
  accounts,
  UserExt,
  UserStorageTotal,
  deployer,
  Cid,
  FileSize,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("User", function () {
  let user: Signer;
  let userAddress: string;

  before(async () => {
    await prepareContext(0, 1, 1);
    user = accounts[0];
    userAddress = await user.getAddress();
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should not exist before register", async function () {
    expect(await userStorage.exist(userAddress)).to.equal(false);
  });

  it("should exist after register", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.exist(userAddress)).to.equal(true);
  });

  it("should not exist after deRegister", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.exist(userAddress)).to.equal(false);
  });

  it("should not duplicated register", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await expect(
      chainStorage.connect(user).userRegister(UserExt)
    ).to.revertedWith("U:user exist");
  });

  it("should not duplicated deRegister", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userDeRegister();
    await expect(chainStorage.connect(user).userDeRegister()).to.revertedWith(
      "U:user not exist"
    );
  });

  it("ext should be empty", async function () {
    expect(await userStorage.getExt(userAddress)).to.equal("");
  });

  it("ext should equal to user register ext", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getExt(userAddress)).to.equal(UserExt);
  });

  it("ext should equal to user set ext", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    const newExt = "newExt";
    await chainStorage.connect(user).userSetExt(newExt);
    expect(await userStorage.getExt(userAddress)).to.equal(newExt);
  });

  it("ext should be empty after user deRegister", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getExt(userAddress)).to.equal("");
  });

  it("storageTotal should be 0", async function () {
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);
  });

  it("storageTotal should equal to user initSpace ", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );
  });

  it("storageTotal should equal to set", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    const newUserStorageTotal = UserStorageTotal * 2;
    await chainStorage
      .connect(deployer)
      .userSetStorageTotal(userAddress, newUserStorageTotal);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      newUserStorageTotal
    );
  });

  it("storageTotal should be 0 after user deRegister", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);
  });

  it("available space should equal to InitSpace after user register", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.availableSpace(userAddress)).to.equal(
      UserStorageTotal
    );
  });

  it("available space test1", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.availableSpace(userAddress)).to.equal(
      UserStorageTotal
    );
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await userStorage.availableSpace(userAddress)).to.equal(
      UserStorageTotal - FileSize
    );
  });

  it("available space test2", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await userStorage.availableSpace(userAddress)).to.equal(
      UserStorageTotal
    );
  });

  it("storage used test1", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(FileSize);
  });

  it("storage used test2", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
  });

  it("userCount should be 0", async function () {
    expect(await userStorage.getUserCount()).to.equal(0);
  });

  it("userCount should > 0 after user register", async function () {
    await chainStorage.connect(accounts[0]).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(1);
    await chainStorage.connect(accounts[1]).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(2);
  });

  it("userCount should be 0 after user deRegister", async function () {
    await chainStorage.connect(accounts[0]).userRegister(UserExt);
    await chainStorage.connect(accounts[0]).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(0);
  });

  it("file should not exist", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.fileExist(userAddress, Cid)).to.equal(false);
  });

  it("file should exist after user add file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.fileExist(userAddress, Cid)).to.equal(true);
  });

  it("file should not exist after user delete file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(user).userDeleteFile(Cid);
    expect(await userStorage.fileExist(userAddress, Cid)).to.equal(true);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await userStorage.fileExist(userAddress, Cid)).to.equal(false);
  });

  it("file ext should empty", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getFileExt(userAddress, Cid)).to.equal("");
  });

  it("file ext should equal to user file ext", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.getFileExt(userAddress, Cid)).to.equal(FileExt);
  });

  it("file ext should empty after user delete file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await userStorage.getFileExt(userAddress, Cid)).to.equal("");
  });

  it("file duration should be 0", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getFileDuration(userAddress, Cid)).to.equal(0);
  });

  it("file duration should equal to user file duration", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await userStorage.getFileDuration(userAddress, Cid)).to.equal(
      Duration
    );
  });

  it("file duration should be 0 after user delete file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await userStorage.getFileDuration(userAddress, Cid)).to.equal(0);
  });

  it("file ext test", async function () {
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user1Address = accountAddresses[0];
    const user2Address = accountAddresses[1];

    await chainStorage.connect(user1).userRegister(UserExt);
    await chainStorage.connect(user2).userRegister(UserExt);

    const user1CidExt = "user1CidExt";
    const user2CidExt = "user2CidExt";
    const user1NewCidExt = "user1NewCidExt";
    const user2NewCidExt = "user2NewCidExt";

    await chainStorage.connect(user1).userAddFile(Cid, Duration, user1CidExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await userStorage.getFileExt(user1Address, Cid)).to.equal(
      user1CidExt
    );

    await chainStorage.connect(user2).userAddFile(Cid, Duration, user2CidExt);
    expect(await userStorage.getFileExt(user1Address, Cid)).to.equal(
      user1CidExt
    );
    expect(await userStorage.getFileExt(user2Address, Cid)).to.equal(
      user2CidExt
    );

    await chainStorage.connect(user1).userSetFileExt(Cid, user1NewCidExt);
    expect(await userStorage.getFileExt(user1Address, Cid)).to.equal(
      user1NewCidExt
    );
    expect(await userStorage.getFileExt(user2Address, Cid)).to.equal(
      user2CidExt
    );

    await chainStorage.connect(user2).userSetFileExt(Cid, user2NewCidExt);
    expect(await userStorage.getFileExt(user1Address, Cid)).to.equal(
      user1NewCidExt
    );
    expect(await userStorage.getFileExt(user2Address, Cid)).to.equal(
      user2NewCidExt
    );
  });

  it("file duration test", async function () {
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user1Address = accountAddresses[0];
    const user2Address = accountAddresses[1];

    await chainStorage.connect(user1).userRegister(UserExt);
    await chainStorage.connect(user2).userRegister(UserExt);

    const user1Duration = 100;
    const user2Duration = 200;
    const user1NewDuration = 300;
    const user2NewDuration = 400;

    await chainStorage.connect(user1).userAddFile(Cid, user1Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await userStorage.getFileDuration(user1Address, Cid)).to.equal(
      user1Duration
    );

    await chainStorage.connect(user2).userAddFile(Cid, user2Duration, FileExt);
    expect(await userStorage.getFileDuration(user1Address, Cid)).to.equal(
      user1Duration
    );
    expect(await userStorage.getFileDuration(user2Address, Cid)).to.equal(
      user2Duration
    );

    await chainStorage
      .connect(user1)
      .userSetFileDuration(Cid, user1NewDuration);
    expect(await userStorage.getFileDuration(user1Address, Cid)).to.equal(
      user1NewDuration
    );
    expect(await userStorage.getFileDuration(user2Address, Cid)).to.equal(
      user2Duration
    );

    await chainStorage
      .connect(user2)
      .userSetFileDuration(Cid, user2NewDuration);
    expect(await userStorage.getFileDuration(user1Address, Cid)).to.equal(
      user1NewDuration
    );
    expect(await userStorage.getFileDuration(user2Address, Cid)).to.equal(
      user2NewDuration
    );
  });

  it("user can't deRegister for having files", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await expect(chainStorage.connect(user).userDeRegister()).to.revertedWith(
      "U:files not empty"
    );
  });

  it("storage total test", async function () {
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    const newUserStorageTotal = UserStorageTotal * 2;
    await chainStorage
      .connect(deployer)
      .userSetStorageTotal(userAddress, newUserStorageTotal);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      newUserStorageTotal
    );

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);
  });

  it("user count test", async function () {
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user3 = accounts[2];
    const user4 = accounts[3];

    expect(await userStorage.getUserCount()).to.equal(0);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(1);

    await chainStorage.connect(user1).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(0);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(1);

    await chainStorage.connect(user2).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(2);

    await chainStorage.connect(user3).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(3);

    await chainStorage.connect(user1).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(2);

    await chainStorage.connect(user2).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(1);

    await chainStorage.connect(user2).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(2);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(3);

    await chainStorage.connect(user4).userRegister(UserExt);
    expect(await userStorage.getUserCount()).to.equal(4);

    await chainStorage.connect(user2).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(3);

    await chainStorage.connect(user3).userDeRegister();
    expect(await userStorage.getUserCount()).to.equal(2);
  });

  it("user storage space test", async function () {
    const cid1 = Cids[0];
    const cid2 = Cids[1];
    const cid1size = 10001;
    const cid2size = 10002;
    const user = accounts[0];
    const userAddress = accountAddresses[0];

    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userAddFile(cid1, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(cid1, cid1size);
    await chainStorage.connect(nodes[0]).nodeAddFile(cid1);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(cid1size);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userAddFile(cid2, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(cid2, cid2size);
    await chainStorage.connect(nodes[0]).nodeAddFile(cid2);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      cid1size + cid2size
    );
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userDeleteFile(cid1);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(cid1);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(cid1);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(cid2size);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userDeleteFile(cid2);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(cid2);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(cid2);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );
  });

  it("user can add file when user space not enough", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[3], Duration, FileExt);
    await chainStorage
      .connect(nodes[0])
      .nodeCanAddFile(Cids[3], UserStorageTotal * 2);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[3]);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      UserStorageTotal * 2
    );
  });

  it("user should fail to addFile when used space > total space", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[3], Duration, FileExt);

    await chainStorage
      .connect(nodes[0])
      .nodeCanAddFile(Cids[3], UserStorageTotal * 2);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[3]);

    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      UserStorageTotal * 2
    );

    await expect(
      chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt)
    ).to.revertedWith("U:no available storage space");
  });

  it("user fileCount should be 0", async function () {
    expect(await userStorage.getFileCount(userAddress)).to.equal(0);
  });

  it("user fileCount should > 0 after add file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    expect(await userStorage.getFileCount(userAddress)).to.equal(1);
  });

  it("user fileCount should be 0 after delete file", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(user).userDeleteFile(Cids[0]);
    expect(await userStorage.getFileCount(userAddress)).to.equal(1);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    expect(await userStorage.getFileCount(userAddress)).to.equal(0);
  });

  it("getAllUserAddresses test", async function () {
    await chainStorage.connect(accounts[0]).userRegister(UserExt);
    let result = await userStorage.getAllUserAddresses(50, 1);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(accountAddresses[0]);

    await chainStorage.connect(accounts[1]).userRegister(UserExt);
    result = await userStorage.getAllUserAddresses(50, 1);
    expect(result[0]).to.lengthOf(2);
    expect(result[0]).to.contains(accountAddresses[0]);
    expect(result[0]).to.contains(accountAddresses[1]);

    await chainStorage.connect(accounts[2]).userRegister(UserExt);
    result = await userStorage.getAllUserAddresses(50, 1);
    expect(result[0]).to.lengthOf(3);
    expect(result[0]).to.contains(accountAddresses[0]);
    expect(result[0]).to.contains(accountAddresses[1]);
    expect(result[0]).to.contains(accountAddresses[2]);
    assert(result[1]);

    result = await userStorage.getAllUserAddresses(1, 2);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(accountAddresses[1]);
    assert(!result[1]);

    result = await userStorage.getAllUserAddresses(1, 3);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(accountAddresses[2]);
    assert(result[1]);
  });

  it("getFiles test", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    let result = await userStorage.getFiles(userAddress, 50, 1);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(Cids[0]);

    await chainStorage.connect(user).userAddFile(Cids[1], Duration, FileExt);
    result = await userStorage.getFiles(userAddress, 50, 1);
    expect(result[0]).to.lengthOf(2);
    expect(result[0]).to.contains(Cids[0]);
    expect(result[0]).to.contains(Cids[1]);

    await chainStorage.connect(user).userAddFile(Cids[2], Duration, FileExt);
    result = await userStorage.getFiles(userAddress, 50, 1);
    expect(result[0]).to.lengthOf(3);
    expect(result[0]).to.contains(Cids[0]);
    expect(result[0]).to.contains(Cids[1]);
    expect(result[0]).to.contains(Cids[2]);
    assert(result[1]);

    result = await userStorage.getFiles(userAddress, 1, 2);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(Cids[1]);
    assert(!result[1]);

    result = await userStorage.getFiles(userAddress, 1, 3);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(Cids[2]);
    assert(result[1]);
  });
});
