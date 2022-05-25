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
  users,
  FileSize,
  taskStorage,
  nodeAddresses,
  userAddresses,
  accounts,
  NodeStorageTotal,
  NodeExt,
  fileStorage,
  dumpFile,
  dumpTask,
  dumpTaskState,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("UserAction2", function () {
  let user1: Signer;
  let user2: Signer;
  let user1Address: string;
  let user2Address: string;
  let node1: Signer;
  let node2: Signer;
  let node3: Signer;
  let node4: Signer;
  let node5: Signer;
  let node1Address: string;
  let node2Address: string;
  let node3Address: string;
  let node4Address: string;
  let node5Address: string;
  let cid: string;

  before(async () => {
    await prepareContext(2, 4, 4, 0, 0, 4);
    user1 = users[0];
    user2 = users[1];
    user1Address = userAddresses[0];
    user2Address = userAddresses[1];
    node1 = nodes[0];
    node2 = nodes[1];
    node3 = nodes[2];
    node4 = nodes[3];
    node1Address = nodeAddresses[0];
    node2Address = nodeAddresses[1];
    node3Address = nodeAddresses[2];
    node4Address = nodeAddresses[3];
    cid = Cids[0];
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  async function node5RegisterAndOnline() {
    node5 = accounts[10];
    node5Address = await node5.getAddress();
    await chainStorage.connect(node5).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node5).nodeOnline();
  }

  it("user random operations 3", async function () {
    // user1.addFile(cid)
    await chainStorage.connect(user1).userAddFile(cid, Duration, FileExt);
    await node5RegisterAndOnline();
    // node1 finish task
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await chainStorage.connect(node1).nodeFinishTask(1, FileSize);
    // node2 fail task
    await chainStorage.connect(node2).nodeAcceptTask(2);
    await chainStorage.connect(node2).nodeFailTask(2);
    await dumpTask(1, 5);
    await dumpTaskState(1, 5);
    // node3 finish task
    expect(await taskStorage.getCurrentTid()).to.equal(5);
    await chainStorage.connect(node3).nodeAcceptTask(3);
    await chainStorage.connect(node3).nodeFinishTask(3, FileSize);
    // node5 finish task
    await chainStorage.connect(node5).nodeAcceptTask(5);
    await chainStorage.connect(node5).nodeFinishTask(5, FileSize);
    // user2.addFile(cid)
    await chainStorage.connect(user2).userAddFile(cid, Duration, FileExt);
    // node4 finish task
    await chainStorage.connect(node4).nodeAcceptTask(4);
    await chainStorage.connect(node4).nodeFinishTask(4, FileSize);
    // user2.deleteFile(cid)
    await chainStorage.connect(user2).userDeleteFile(cid);

    expect(await fileStorage.userExist(cid, user1Address)).to.equal(true);
    expect(await fileStorage.userExist(cid, user2Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node1Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node2Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node3Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node4Address)).to.equal(true);
    expect(await fileStorage.nodeExist(cid, node5Address)).to.equal(true);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
    expect(await fileStorage.getTotalFileNumber()).to.equal(1);
    expect(await taskStorage.getCurrentTid()).to.equal(5);

    await dumpFile(cid);
  });

  it("user random operations 4", async function () {
    // user1.addFile
    await chainStorage.connect(user1).userAddFile(cid, Duration, FileExt);
    // node5 online
    await node5RegisterAndOnline();
    // node1 finish task
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await chainStorage.connect(node1).nodeFinishTask(1, FileSize);
    // node2 finish task
    await chainStorage.connect(node2).nodeAcceptTask(2);
    await chainStorage.connect(node2).nodeFinishTask(2, FileSize);
    // node3 fail task
    await chainStorage.connect(node3).nodeAcceptTask(3);
    await chainStorage.connect(node3).nodeFailTask(3);
    // user1.deleteFile
    await chainStorage.connect(user1).userDeleteFile(cid);
    // node4 finish task
    await chainStorage.connect(node4).nodeAcceptTask(4);
    await chainStorage.connect(node4).nodeFinishTask(4, FileSize);
    // node1 finish delete task
    await chainStorage.connect(node1).nodeAcceptTask(6);
    await chainStorage.connect(node1).nodeFinishTask(6, FileSize);
    // node2 finish delete task
    await chainStorage.connect(node2).nodeAcceptTask(7);
    await chainStorage.connect(node2).nodeFinishTask(7, FileSize);
    // user2.addFile
    await chainStorage.connect(user2).userAddFile(cid, Duration, FileExt);
    // node5 finish add file
    await chainStorage.connect(node5).nodeAcceptTask(5);
    await chainStorage.connect(node5).nodeFinishTask(5, FileSize);
  });
});
