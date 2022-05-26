import { expect } from "chai";
import {
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  taskStorage,
  users,
  Cid,
  nodes,
  FileSize,
  Cids,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("Task", function () {
  let user: Signer;

  before(async () => {
    await prepareContext(2, 2, 2, 1, 1, 2);
    user = users[0];
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("exist", async function () {
    expect(await taskStorage.exist(1)).to.equal(false);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await taskStorage.exist(1)).to.equal(true);
    expect(await taskStorage.exist(2)).to.equal(true);
  });

  it("currentTid should be 0", async function () {
    expect(await taskStorage.getCurrentTid()).to.equal(0);
  });

  it("currentTid should be update after user addFile/deleteFile", async function () {
    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    expect(await taskStorage.getCurrentTid()).to.equal(2);
    await chainStorage.connect(user).userDeleteFile(Cids[0]);
    expect(await taskStorage.getCurrentTid()).to.equal(2);
    await chainStorage.connect(user).userAddFile(Cids[1], Duration, FileExt);
    expect(await taskStorage.getCurrentTid()).to.equal(4);
  });

  it("currentTid should be update after user deleteFile", async function () {
    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cids[0]);
    expect(await taskStorage.getCurrentTid()).to.equal(3);
  });

  it("should fail to finishTask for not acceptTask first", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await expect(
      chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize)
    ).to.revertedWith("T:task status is not Accepted");
  });

  it("should fail to accept task twice", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await expect(
      chainStorage.connect(nodes[0]).nodeAcceptTask(1)
    ).to.revertedWith("T:wrong status must[C]");
  });

  it("should fail to finish task twice", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await expect(
      chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize)
    ).to.revertedWith("T:task status is not Accepted");
  });

  it("deleteFile task should not fail", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await expect(
      chainStorage.connect(nodes[0]).nodeFailTask(3)
    ).to.revertedWith("T:only add file task can fail");
  });
});
