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
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("Node", function () {
  let node: Signer;
  let nodeAddress: string;

  before(async () => {
    await prepareContext(2, 0, 0, 0, 0, 2);

    node = accounts[19];
    nodeAddress = await node.getAddress();
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("exist", async function () {
    expect(await nodeStorage.exist(nodeAddress)).to.equal(false);
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.exist(nodeAddress)).to.equal(true);
    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.exist(nodeAddress)).to.equal(false);
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

  it("ext", async function () {
    const newExt = "newExt";
    expect(await nodeStorage.getExt(nodeAddress)).to.equal("");

    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    expect(await nodeStorage.getExt(nodeAddress)).to.equal(NodeExt);

    await chainStorage.connect(node).nodeSetExt(newExt);
    expect(await nodeStorage.getExt(nodeAddress)).to.equal(newExt);

    await chainStorage.connect(node).nodeDeRegister();
    expect(await nodeStorage.getExt(nodeAddress)).to.equal("");
  });

  it("storage", async function () {
    let storageSpace = await nodeStorage.getStorageSpace(nodeAddress);
    assert.equal(storageSpace[0].toNumber(), 0);
    assert.equal(storageSpace[1].toNumber(), 0);

    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
    storageSpace = await nodeStorage.getStorageSpace(nodeAddress);
    assert.equal(storageSpace[0].toNumber(), 0);
    assert.equal(storageSpace[1].toNumber(), NodeStorageTotal);

    await chainStorage.connect(node).nodeDeRegister();
    storageSpace = await nodeStorage.getStorageSpace(nodeAddress);
    assert.equal(storageSpace[0].toNumber(), 0);
    assert.equal(storageSpace[1].toNumber(), 0);
  });

  it("all [online] node test", async function () {
    const node1: Signer = accounts[19];
    const node2: Signer = accounts[18];
    const node3: Signer = accounts[17];

    let allNodeAddresses: string[] = [];
    let allOnlineNodeAddresses: string[] = [];

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
});
