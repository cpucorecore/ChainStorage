import { expect } from "chai";
import {
  Cid,
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
  nodeAddresses,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Event", function () {
  before(async () => {
    await prepareContext(2, 2, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should emit UserAction/TryRequestAddFile event when user addFile", async function () {
    await expect(
      chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt)
    )
      .to.emit(userManager, "UserAction")
      .withArgs(userAddresses[0], 0, Cid)
      .to.emit(nodeManager, "TryRequestAddFile")
      .withArgs(Cid);
  });

  it("should emit RequestAddFile event when nodeCanAddFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await expect(chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize))
      .to.emit(nodeManager, "RequestAddFile")
      .withArgs(Cid, [nodeAddresses[0], nodeAddresses[1]]);
  });

  it("should emit NodeAction event when node addFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);

    await expect(chainStorage.connect(nodes[0]).nodeAddFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[0], 0, Cid);

    await expect(chainStorage.connect(nodes[1]).nodeAddFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[1], 0, Cid)
      .to.emit(userManager, "AddFileFinished")
      .withArgs(userAddresses[0], Cid);
  });

  it("should emit UserAction/TryRequestDeleteFile event when user deleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await expect(chainStorage.connect(users[0]).userDeleteFile(Cid))
      .to.emit(userManager, "UserAction")
      .withArgs(userAddresses[0], 1, Cid)
      .to.emit(nodeManager, "TryRequestDeleteFile")
      .withArgs(Cid, [nodeAddresses[0], nodeAddresses[1]]);
  });

  it("should emit RequestDeleteFile event when nodeCanDeleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await expect(chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid))
      .to.emit(nodeManager, "RequestDeleteFile")
      .withArgs(Cid, [nodeAddresses[0], nodeAddresses[1]]);
  });

  it("should emit DeleteFileFinished event when nodeDeleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await expect(chainStorage.connect(nodes[0]).nodeDeleteFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[0], 1, Cid);

    await expect(chainStorage.connect(nodes[1]).nodeDeleteFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[1], 1, Cid)
      .to.emit(userManager, "DeleteFileFinished")
      .withArgs(userAddresses[0], Cid);
  });

  it("complex test", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);

    await expect(chainStorage.connect(users[0]).userDeleteFile(Cid))
      .to.emit(userManager, "DeleteFileFinished")
      .withArgs(userAddresses[0], Cid);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await expect(chainStorage.connect(nodes[1]).nodeDeleteFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[1], 1, Cid);

    await expect(chainStorage.connect(nodes[0]).nodeDeleteFile(Cid))
      .to.emit(nodeManager, "NodeAction")
      .withArgs(nodeAddresses[0], 1, Cid)
      .to.emit(userManager, "DeleteFileFinished")
      .withArgs(userAddresses[1], Cid);
  });
});
