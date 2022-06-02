import { expect } from "chai";
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
    await prepareContext(0, 2, 2, 0, 0, 2);
    user = accounts[10];
    userAddress = await user.getAddress();
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("user exist test", async function () {
    expect(await userStorage.exist(userAddress)).to.equal(false);

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.exist(userAddress)).to.equal(true);

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.exist(userAddress)).to.equal(false);
  });

  it("user ext test", async function () {
    const newExt = "newExt";

    expect(await userStorage.getExt(userAddress)).to.equal("");

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getExt(userAddress)).to.equal(UserExt);

    await chainStorage.connect(user).userSetExt(newExt);
    expect(await userStorage.getExt(userAddress)).to.equal(newExt);

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getExt(userAddress)).to.equal("");
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
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
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
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
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

  it("total user number test", async function () {
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user3 = accounts[2];
    const user4 = accounts[3];

    expect(await userStorage.getTotalUserNumber()).to.equal(0);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(1);

    await chainStorage.connect(user1).userDeRegister();
    expect(await userStorage.getTotalUserNumber()).to.equal(0);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(1);

    await chainStorage.connect(user2).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(2);

    await chainStorage.connect(user3).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(3);

    await chainStorage.connect(user1).userDeRegister();
    expect(await userStorage.getTotalUserNumber()).to.equal(2);

    await chainStorage.connect(user2).userDeRegister();
    expect(await userStorage.getTotalUserNumber()).to.equal(1);

    await chainStorage.connect(user2).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(2);

    await chainStorage.connect(user1).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(3);

    await chainStorage.connect(user4).userRegister(UserExt);
    expect(await userStorage.getTotalUserNumber()).to.equal(4);

    await chainStorage.connect(user2).userDeRegister();
    expect(await userStorage.getTotalUserNumber()).to.equal(3);

    await chainStorage.connect(user3).userDeRegister();
    expect(await userStorage.getTotalUserNumber()).to.equal(2);
  });

  it("user storage test", async function () {
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
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(2);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, cid1size);
    await chainStorage.connect(nodes[1]).nodeFinishTask(2, cid1size);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(cid1size);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userAddFile(cid2, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(4);
    await chainStorage.connect(nodes[0]).nodeFinishTask(3, cid2size);
    await chainStorage.connect(nodes[1]).nodeFinishTask(4, cid2size);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      cid1size + cid2size
    );
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userDeleteFile(cid1);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(5);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(6);
    await chainStorage.connect(nodes[0]).nodeFinishTask(5, cid1size);
    await chainStorage.connect(nodes[1]).nodeFinishTask(6, cid1size);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(cid2size);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    await chainStorage.connect(user).userDeleteFile(cid2);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(7);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(8);
    await chainStorage.connect(nodes[0]).nodeFinishTask(7, cid1size);
    await chainStorage.connect(nodes[1]).nodeFinishTask(8, cid1size);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );
  });

  it("task should finish when user space not enough", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[3], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage
      .connect(nodes[0])
      .nodeFinishTask(1, UserStorageTotal * 2);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      UserStorageTotal * 2
    );
  });

  it("user should fail to addFile when used space > total space", async function () {
    await chainStorage.connect(user).userRegister(UserExt);
    await chainStorage.connect(user).userAddFile(Cids[3], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage
      .connect(nodes[0])
      .nodeFinishTask(1, UserStorageTotal * 2);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(
      UserStorageTotal * 2
    );

    await expect(
      chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt)
    ).to.revertedWith("U:storage space not enough");
  });
});
