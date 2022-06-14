import { expect } from "chai";
import {
  Cids,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  users,
  userManager,
  userAddresses,
  FileSize,
  nodes,
  nodeManager,
  nodeAddresses, userStorage
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("UserApprove", function () {
  before(async () => {
    await prepareContext(2, 1, 1);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("isApproveAccount should be false", async function () {
    expect(
      await userStorage.isApproveAccount(userAddresses[0], userAddresses[1])
    ).to.equal(false);
  });

  it("isApproveAccount should be true after approve", async function () {
    await chainStorage
      .connect(users[0])
      .userApproveAccount(userAddresses[1], true);

    expect(
      await userStorage.isApproveAccount(userAddresses[0], userAddresses[1])
    ).to.equal(true);
  });

  it("isApproveAccount should be false after cancel approve", async function () {
    await chainStorage
      .connect(users[0])
      .userApproveAccount(userAddresses[1], true);

    await chainStorage
      .connect(users[0])
      .userApproveAccount(userAddresses[1], false);

    expect(
      await userStorage.isApproveAccount(userAddresses[0], userAddresses[1])
    ).to.equal(false);
  });

  it("isApproveFile should be false", async function () {
    expect(
      await userStorage.isApproveFile(
        userAddresses[0],
        userAddresses[1],
        Cids[0]
      )
    ).to.equal(false);
  });

  it("isApproveFile should be true after approve", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage
      .connect(users[0])
      .userApproveFile(userAddresses[1], Cids[0], true);

    expect(
      await userStorage.isApproveFile(
        userAddresses[0],
        userAddresses[1],
        Cids[0]
      )
    ).to.equal(true);
  });

  it("isApproveFile should be false after cancel approve", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage
      .connect(users[0])
      .userApproveFile(userAddresses[1], Cids[0], true);

    await chainStorage
      .connect(users[0])
      .userApproveFile(userAddresses[1], Cids[0], false);

    expect(
      await userStorage.isApproveFile(
        userAddresses[0],
        userAddresses[1],
        Cids[0]
      )
    ).to.equal(false);
  });
});
