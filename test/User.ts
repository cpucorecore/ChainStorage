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

  it("exist", async function () {
    expect(await userStorage.exist(userAddress)).to.equal(false);

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.exist(userAddress)).to.equal(true);

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.exist(userAddress)).to.equal(false);
  });

  it("ext", async function () {
    const newExt = "newExt";

    expect(await userStorage.getExt(userAddress)).to.equal("");

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getExt(userAddress)).to.equal(UserExt);

    await chainStorage.connect(user).userSetExt(newExt);
    expect(await userStorage.getExt(userAddress)).to.equal(newExt);

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getExt(userAddress)).to.equal("");
  });

  it("storage", async function () {
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);

    await chainStorage.connect(user).userRegister(UserExt);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      UserStorageTotal
    );

    const newUserStorageTotal = UserStorageTotal * 2;
    await chainStorage
      .connect(deployer)
      .userSetStorageTotal(userAddress, newUserStorageTotal);
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(
      newUserStorageTotal
    );

    await chainStorage.connect(user).userDeRegister();
    expect(await userStorage.getStorageUsed(userAddress)).to.equal(0);
    expect(await userStorage.getStorageTotal(userAddress)).to.equal(0);
  });

  it("total user number", async function () {
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

  it("user storage space", async function () {
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
});
