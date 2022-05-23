import { assert, expect } from "chai";
import {
  Cid,
  Duration,
  FileExt,
  FileSize,
  chainStorage,
  fileStorage,
  prepareContext,
  nodes,
  users,
  takeSnapshot,
  revertToSnapshot,
  userAddresses,
  taskStorage,
  nodeAddresses,
  dumpTask,
  dumpTaskState, accountAddresses, accounts, NodeStorageTotal, NodeExt, nodeStorage
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
});
