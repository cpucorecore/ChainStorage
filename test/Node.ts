import { assert, expect } from "chai";
import {
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  accounts,
  NodeStorageTotal,
  NodeExt,
  nodeStorage,
  users,
  Duration,
  FileExt,
  Cid,
  FileSize,
  Cids,
  increaseTime,
  AddFileTaskTimeout,
  registerMoreNodesAndOnline,
  monitors,
  revertNodes,
  nodeAddresses,
  nodes,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("Node", function () {
  let node: Signer;
  let nodeAddress: string;

  before(async () => {
    await prepareContext(2, 0, 0, 1, 1, 1);

    node = accounts[19];
    nodeAddress = await node.getAddress();
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should not exist before register", async function () {
    expect(await nodeStorage.exist(nodeAddress)).to.equal(false);
  });

  it("should exist after register", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.exist(nodeAddress)).to.equal(true);
  });

  it("should not exist after deRegister", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.exist(nodeAddress)).to.equal(false);
  });

  it("ext should empty before register", async function () {
    expect(await nodeStorage.getExt(nodeAddress)).to.equal("");
  });

  it("ext should right after register", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getExt(nodeAddress)).to.equal(NodeExt);
  });

  it("ext should empty after deRegister", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.getExt(nodeAddress)).to.equal("");
  });

  it("ext should right after setExt", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    const newExt = "newExt";
    await chainStorage.connect(node).nodeSetExt(newExt);
    expect(await nodeStorage.getExt(nodeAddress)).to.equal(newExt);
  });

  it("storageTotal should be0 before register", async function () {
    expect(await nodeStorage.getStorageTotal(nodeAddress)).to.equal(0);
  });

  it("storageTotal should right after register", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getStorageTotal(nodeAddress)).to.equal(
      NodeStorageTotal
    );
  });

  it("storageTotal should be 0 be after deRegister", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.getStorageTotal(nodeAddress)).to.equal(0);
  });

  it("ext should right after setExt", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    const newStorageTotal = NodeStorageTotal * 2;
    await chainStorage.connect(node).nodeSetStorageTotal(newStorageTotal);
    expect(await nodeStorage.getStorageTotal(nodeAddress)).to.equal(
      newStorageTotal
    );
  });

  it("should fail setStorageTotal for newStorageTotal little than used", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node).nodeAcceptTask(1);
    await chainStorage.connect(node).nodeFinishTask(1, FileSize);
    await expect(
      chainStorage.connect(node).nodeSetStorageTotal(FileSize - 1)
    ).to.revertedWith("N:too small");
  });

  it("storageUsed should be 0 before register", async function () {
    expect(await nodeStorage.getStorageUsed(nodeAddress)).to.equal(0);
  });

  it("storageUsed should be 0 after register", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    expect(await nodeStorage.getStorageUsed(nodeAddress)).to.equal(0);
  });

  it("storageUsed should right after finish addFile task", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node).nodeAcceptTask(1);
    await chainStorage.connect(node).nodeFinishTask(1, FileSize);
    expect(await nodeStorage.getStorageUsed(nodeAddress)).to.equal(FileSize);
  });

  it("storageUsed should be 0 after finish deleteFile task", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node).nodeAcceptTask(1);
    await chainStorage.connect(node).nodeFinishTask(1, FileSize);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(node).nodeAcceptTask(2);
    await chainStorage.connect(node).nodeFinishTask(2, FileSize);
    expect(await nodeStorage.getStorageUsed(nodeAddress)).to.equal(0);
  });

  it("status", async function () {
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(0);

    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(1);

    await chainStorage.connect(node).nodeOnline();
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(2);

    await chainStorage.connect(node).nodeMaintain();
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(3);

    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(0);
  });

  it("node should fail to maintain for status not online", async function () {
    expect(await nodeStorage.getStatus(nodeAddress)).to.equal(0);

    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await expect(chainStorage.connect(node).nodeMaintain()).to.be.revertedWith(
      "N:wrong status must[O]"
    );
  });

  it("should have no task", async function () {
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(0);
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(0);
  });

  it("should have task after finish task", async function () {
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node).nodeOnline();
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(1);
    // expect(await nodeStorage.getTids(nodeAddress)).to.contains(
    //   BigNumber.from(1)
    // ); // TODO fix
    console.log(await nodeStorage.getTasks(nodeAddress));

    await chainStorage.connect(node).nodeAcceptTask(1);
    await chainStorage.connect(node).nodeFinishTask(1, FileSize);
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(0);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(1);
    // await expect(await nodeStorage.getTids(nodeAddress)).to.contains(
    //   BigNumber.from(2)
    // ); // TODO fix
    console.log(await nodeStorage.getTasks(nodeAddress));
    await chainStorage.connect(node).nodeAcceptTask(2);
    await chainStorage.connect(node).nodeFinishTask(2, FileSize);
    expect(await nodeStorage.getTasks(nodeAddress)).lengthOf(0);
  });

  it("all [online] node test", async function () {
    const node1: Signer = accounts[19];
    const node2: Signer = accounts[18];
    const node3: Signer = accounts[17];

    let allNodeAddresses: string[];
    let allOnlineNodeAddresses: string[];

    expect(await nodeStorage.getTotalNodeNumber()).to.equal(0);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 0);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node1).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(1);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 1);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node2).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(2);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 2);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node3).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node1).nodeOnline();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(1);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 1);

    await chainStorage.connect(node2).nodeOnline();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(2);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 2);

    await chainStorage.connect(node3).nodeOnline();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(3);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 3);

    await chainStorage.connect(node1).nodeMaintain();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(2);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 2);

    await chainStorage.connect(node2).nodeMaintain();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(1);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 1);

    await chainStorage.connect(node3).nodeMaintain();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node2).nodeOnline();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(3);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(1);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 3);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 1);

    await chainStorage.connect(node2).nodeMaintain();
    await chainStorage.connect(node2).nodeDeRegister();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(2);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 2);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);

    await chainStorage.connect(node3).nodeDeRegister();
    await chainStorage.connect(node1).nodeDeRegister();
    expect(await nodeStorage.getTotalNodeNumber()).to.equal(0);
    expect(await nodeStorage.getTotalOnlineNodeNumber()).to.equal(0);
    allNodeAddresses = await nodeStorage["getAllNodeAddresses()"]();
    assert.lengthOf(allNodeAddresses, 0);
    allOnlineNodeAddresses = await nodeStorage["getAllOnlineNodeAddresses()"]();
    assert.lengthOf(allOnlineNodeAddresses, 0);
  });

  it("AddFileFailedCount should be 0", async function () {
    expect(await nodeStorage.getAddFileFailedCount(Cid)).to.equal(0);
  });

  it("node can online after task acceptTimeout", async function () {
    await registerMoreNodesAndOnline(1);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await increaseTime(AddFileTaskTimeout);
    await registerMoreNodesAndOnline(1);
    await chainStorage.connect(monitors[0]).monitorReportTaskAcceptTimeout(1);

    expect(await nodeStorage.getStatus(nodeAddresses[0])).to.equal(4);
    await chainStorage.connect(nodes[0]).nodeOnline();
    await revertNodes();
  });

  it("node can online after task timeout", async function () {
    await registerMoreNodesAndOnline(1);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await increaseTime(AddFileTaskTimeout);
    await registerMoreNodesAndOnline(1);
    await chainStorage.connect(monitors[0]).monitorReportTaskTimeout(1);

    expect(await nodeStorage.getStatus(nodeAddresses[0])).to.equal(4);
    await chainStorage.connect(nodes[0]).nodeOnline();
  });
});
