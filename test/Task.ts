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
  registerMoreNodesAndOnline,
  revertNodes,
  monitors,
  increaseTime,
  TaskAcceptTimeout,
  AddFileTaskTimeout,
  DeleteFileTaskTimeout,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe.skip("Task", function () {
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

  it("should exist after user addFile", async function () {
    expect(await taskStorage.exist(1)).to.equal(false);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await taskStorage.exist(1)).to.equal(true);
    expect(await taskStorage.exist(2)).to.equal(true);
  });

  it("should exist after user deleteFile", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cid);
    expect(await taskStorage.exist(3)).to.equal(true);
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
    ).to.revertedWith("dq:empty");
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

  it("add file task should isOver after finish task", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    expect(await taskStorage.isOver(1)).to.equal(false);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    expect(await taskStorage.isOver(1)).to.equal(true);
  });

  it("add file task should isOver after fail task", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await registerMoreNodesAndOnline(1);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    expect(await taskStorage.isOver(1)).to.equal(false);
    await chainStorage.connect(nodes[0]).nodeFailTask(1);
    expect(await taskStorage.isOver(1)).to.equal(true);
    await revertNodes();
  });

  it("add file task should isOver after accept task timeout", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await registerMoreNodesAndOnline(1);
    expect(await taskStorage.isOver(1)).to.equal(false);
    await increaseTime(TaskAcceptTimeout);
    await chainStorage.connect(monitors[0]).monitorReportTaskAcceptTimeout(1);
    expect(await taskStorage.isOver(1)).to.equal(true);
    await revertNodes();
  });

  it("add file task should isOver after task timeout", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await registerMoreNodesAndOnline(1);
    expect(await taskStorage.isOver(1)).to.equal(false);
    await increaseTime(AddFileTaskTimeout);
    await chainStorage.connect(monitors[0]).monitorReportTaskTimeout(1);
    expect(await taskStorage.isOver(1)).to.equal(true);
    await revertNodes();
  });

  it("delete file task should isOver after finish task", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cid);
    expect(await taskStorage.isOver(3)).to.equal(false);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[0]).nodeFinishTask(3, FileSize);
    expect(await taskStorage.isOver(1)).to.equal(true);
  });

  it("delete file task should not isOver after accept task timeout", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await registerMoreNodesAndOnline(1);
    await increaseTime(TaskAcceptTimeout);
    await chainStorage.connect(monitors[0]).monitorReportTaskAcceptTimeout(3);
    expect(await taskStorage.isOver(3)).to.equal(false);
    await revertNodes();
  });

  it("delete file task should not isOver after task timeout", async function () {
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(user).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await registerMoreNodesAndOnline(1);
    await increaseTime(DeleteFileTaskTimeout);
    await chainStorage.connect(monitors[0]).monitorReportTaskTimeout(3);
    expect(await taskStorage.isOver(3)).to.equal(false);
    await revertNodes();
  });
});
