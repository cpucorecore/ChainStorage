import { expect, assert } from "chai";
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
  users,
  FileSize,
  taskStorage,
  nodeAddresses,
  dumpTask,
  dumpTaskState,
  fileStorage,
  userAddresses,
  nodeStorage,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("User", function () {
  before(async () => {
    await prepareContext(2, 4, 4, 0, 0, 4);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("user random operation", async function () {
    /* random operations:
    user1.addFile(cid)-->
    node1.finishAddFile-->
    node2.finishAddFile-->
    node3.finishAddFile-->
    node4.finishAddFile-->
    user1.deleteFile(cid)-->
    node1.finishDeleteFile-->
    node2.finishDeleteFile-->
    node3.finishDeleteFile-->
    node4.finishDeleteFile-->
    user2.addFile(cid)-->
    node1.finishAddFile-->
    node2.finishAddFile-->
    node3.finishAddFile-->
    node4.finishAddFile
     */
    const user1 = users[0];
    const user2 = users[1];
    const user1Address = userAddresses[0];
    const user2Address = userAddresses[1];
    const node1 = nodes[0];
    const node2 = nodes[1];
    const node3 = nodes[2];
    const node4 = nodes[3];
    const node1Address = nodeAddresses[0];
    const node2Address = nodeAddresses[1];
    const node3Address = nodeAddresses[2];
    const node4Address = nodeAddresses[3];
    const cid = Cids[0];

    await chainStorage.connect(user1).userAddFile(cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await chainStorage.connect(node2).nodeAcceptTask(2);
    await chainStorage.connect(node3).nodeAcceptTask(3);
    await chainStorage.connect(node4).nodeAcceptTask(4);
    await chainStorage.connect(node1).nodeFinishTask(1, FileSize);
    await chainStorage.connect(node2).nodeFinishTask(2, FileSize);
    await chainStorage.connect(node3).nodeFinishTask(3, FileSize);
    await chainStorage.connect(node4).nodeFinishTask(4, FileSize);
    expect(await taskStorage.getCurrentTid()).to.equal(4);
    expect(await taskStorage.getNodeMaxTid(node1Address)).to.equal(1);
    expect(await taskStorage.getNodeMaxTid(node2Address)).to.equal(2);
    expect(await taskStorage.getNodeMaxTid(node3Address)).to.equal(3);
    expect(await taskStorage.getNodeMaxTid(node4Address)).to.equal(4);
    await dumpTask(1, 4);
    await dumpTaskState(1, 4);
    expect(await fileStorage.exist(cid)).to.equal(true);
    expect(await fileStorage.getSize(cid)).to.equal(FileSize);
    expect(await fileStorage.userExist(cid, user1Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node1Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node2Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node3Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node4Address)).to.equal(true);
    let _users = await fileStorage["getUsers(string)"](cid);
    assert.lengthOf(_users, 1);
    let _nodes = await fileStorage["getNodes(string)"](cid);
    assert.lengthOf(_nodes, 4);
    expect(await fileStorage.getTotalFileNumber()).to.equal(1);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
    // file check
    expect(await userStorage.getFileExt(user1Address, cid)).to.equal(FileExt);
    expect(await userStorage.getFileDuration(user1Address, cid)).to.equal(
      Duration
    );
    // node check
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(4);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(4);

    await chainStorage.connect(user1).userDeleteFile(cid);
    await chainStorage.connect(node1).nodeAcceptTask(5);
    await chainStorage.connect(node2).nodeAcceptTask(6);
    await chainStorage.connect(node3).nodeAcceptTask(7);
    await chainStorage.connect(node4).nodeAcceptTask(8);
    await chainStorage.connect(node1).nodeFinishTask(5, FileSize);
    await chainStorage.connect(node2).nodeFinishTask(6, FileSize);
    await chainStorage.connect(node3).nodeFinishTask(7, FileSize);
    await chainStorage.connect(node4).nodeFinishTask(8, FileSize);
    expect(await taskStorage.getCurrentTid()).to.equal(8);
    expect(await taskStorage.getNodeMaxTid(node1Address)).to.equal(5);
    expect(await taskStorage.getNodeMaxTid(node2Address)).to.equal(6);
    expect(await taskStorage.getNodeMaxTid(node3Address)).to.equal(7);
    expect(await taskStorage.getNodeMaxTid(node4Address)).to.equal(8);
    await dumpTask(5, 8);
    await dumpTaskState(5, 8);
    expect(await fileStorage.exist(cid)).to.equal(false);
    expect(await fileStorage.getSize(cid)).to.equal(FileSize); // file size if stored persis
    expect(await fileStorage.userExist(cid, user1Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node1Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node2Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node3Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node4Address)).to.equal(false);
    _users = await fileStorage["getUsers(string)"](cid);
    assert.lengthOf(_users, 0);
    _nodes = await fileStorage["getNodes(string)"](cid);
    assert.lengthOf(_nodes, 0);
    expect(await fileStorage.getTotalFileNumber()).to.equal(0);
    expect(await fileStorage.getTotalSize()).to.equal(0);
    // file check
    expect(await userStorage.getFileExt(user1Address, cid)).to.equal("");
    expect(await userStorage.getFileDuration(user1Address, cid)).to.equal(0);
    // node check
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(4);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(4);

    await chainStorage.connect(user2).userAddFile(cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(9);
    await chainStorage.connect(node2).nodeAcceptTask(10);
    await chainStorage.connect(node3).nodeAcceptTask(11);
    await chainStorage.connect(node4).nodeAcceptTask(12);
    await chainStorage.connect(node1).nodeFinishTask(9, FileSize);
    await chainStorage.connect(node2).nodeFinishTask(10, FileSize);
    await chainStorage.connect(node3).nodeFinishTask(11, FileSize);
    await chainStorage.connect(node4).nodeFinishTask(12, FileSize);
    expect(await taskStorage.getCurrentTid()).to.equal(12);
    expect(await taskStorage.getNodeMaxTid(node1Address)).to.equal(9);
    expect(await taskStorage.getNodeMaxTid(node2Address)).to.equal(10);
    expect(await taskStorage.getNodeMaxTid(node3Address)).to.equal(11);
    expect(await taskStorage.getNodeMaxTid(node4Address)).to.equal(12);
    await dumpTask(9, 12);
    await dumpTaskState(9, 12);
    expect(await fileStorage.exist(cid)).to.equal(true);
    expect(await fileStorage.getSize(cid)).to.equal(FileSize);
    expect(await fileStorage.userExist(cid, user2Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node1Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node2Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node3Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node4Address)).to.equal(true);
    _users = await fileStorage["getUsers(string)"](cid);
    assert.lengthOf(_users, 1);
    _nodes = await fileStorage["getNodes(string)"](cid);
    assert.lengthOf(_nodes, 4);
    expect(await fileStorage.getTotalFileNumber()).to.equal(1);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
    // file check
    expect(await userStorage.getFileExt(user2Address, cid)).to.equal(FileExt);
    expect(await userStorage.getFileDuration(user2Address, cid)).to.equal(
      Duration
    );
    // node check
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(4);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(4);
  });
});