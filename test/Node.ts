import { expect } from "chai";
import {
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  NodeStorageTotal,
  NodeExt,
  nodeStorage,
  users,
  Duration,
  FileExt,
  Cid,
  FileSize,
  registerNodes,
  nodeAddresses,
  nodes,
  accountAddresses,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Node", function () {
  before(async () => {
    await prepareContext(2, 1, 1);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should exist after register", async function () {
    expect(await nodeStorage.exist(nodeAddresses[0])).to.equal(true);
  });

  it("should not exist after deRegister", async function () {
    await chainStorage.connect(nodes[0]).nodeDeRegister();
    expect(await nodeStorage.exist(nodeAddresses[0])).to.equal(false);
  });

  it("ext should empty before register", async function () {
    expect(await nodeStorage.getExt(accountAddresses[0])).to.equal("");
  });

  it("ext should right after register", async function () {
    expect(await nodeStorage.getExt(nodeAddresses[0])).to.equal(NodeExt);
  });

  it("ext should empty after deRegister", async function () {
    await chainStorage.connect(nodes[0]).nodeDeRegister();
    expect(await nodeStorage.getExt(nodeAddresses[0])).to.equal("");
  });

  it("ext should right after setExt", async function () {
    const newExt = "newExt";
    await chainStorage.connect(nodes[0]).nodeSetExt(newExt);
    expect(await nodeStorage.getExt(nodeAddresses[0])).to.equal(newExt);
  });

  it("storageTotal should be 0 before register", async function () {
    expect(await nodeStorage.getStorageTotal(accountAddresses[0])).to.equal(0);
  });

  it("storageTotal should right after register", async function () {
    expect(await nodeStorage.getStorageTotal(nodeAddresses[0])).to.equal(
      NodeStorageTotal
    );
  });

  it("storageTotal should be 0 be after deRegister", async function () {
    await chainStorage.connect(nodes[0]).nodeDeRegister();
    expect(await nodeStorage.getStorageTotal(nodeAddresses[0])).to.equal(0);
  });

  it("storageTotal should right after setStorageTotal", async function () {
    const newStorageTotal = NodeStorageTotal * 2;
    await chainStorage.connect(nodes[0]).nodeSetStorageTotal(newStorageTotal);
    expect(await nodeStorage.getStorageTotal(nodeAddresses[0])).to.equal(
      newStorageTotal
    );
  });

  it("should fail setStorageTotal for newStorageTotal little than used", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await expect(
      chainStorage.connect(nodes[0]).nodeSetStorageTotal(FileSize - 1)
    ).to.revertedWith("N:too small");
  });

  it("storageUsed should be 0 before register", async function () {
    expect(await nodeStorage.getStorageUsed(accountAddresses[0])).to.equal(0);
  });

  it("storageUsed should be 0 after register", async function () {
    expect(await nodeStorage.getStorageUsed(nodeAddresses[0])).to.equal(0);
  });

  it("storageUsed should right after addFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await nodeStorage.getStorageUsed(nodeAddresses[0])).to.equal(
      FileSize
    );
  });

  it("storageUsed should be 0 after deleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await nodeStorage.getStorageUsed(nodeAddresses[0])).to.equal(0);
  });

  it("available space should be 0", async function () {
    expect(await nodeStorage.availableSpace(accountAddresses[0])).to.equal(0);
  });

  it("available space should be equal to register value", async function () {
    expect(await nodeStorage.availableSpace(nodeAddresses[0])).to.equal(
      NodeStorageTotal
    );
  });

  it("available space should be right after add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await nodeStorage.availableSpace(nodeAddresses[0])).to.equal(
      NodeStorageTotal - FileSize
    );
  });

  it("available space should be right after delete file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await nodeStorage.availableSpace(nodeAddresses[0])).to.equal(
      NodeStorageTotal
    );
  });

  it("should add file failed for available space not enough", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage
      .connect(nodes[0])
      .nodeCanAddFile(Cid, NodeStorageTotal + FileSize);
    await expect(
      chainStorage.connect(nodes[0]).nodeAddFile(Cid)
    ).to.revertedWith("SSM:useSpace space not enough");
  });

  it("node count should be 1", async function () {
    expect(await nodeStorage.getNodeCount()).to.equal(1);
  });

  it("node count should be updated when node register/deRegister", async function () {
    expect(await nodeStorage.getNodeCount()).to.equal(1);
    await registerNodes(3);
    expect(await nodeStorage.getNodeCount()).to.equal(4);
  });

  it("node count should be 0 after node deRegister", async function () {
    await chainStorage.connect(nodes[0]).nodeDeRegister();
    expect(await nodeStorage.getNodeCount()).to.equal(0);
  });

  it("file should not exist", async function () {
    expect(await nodeStorage.fileExist(nodeAddresses[0], Cid)).to.equal(false);
  });

  it("file should exist after node add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await nodeStorage.fileExist(nodeAddresses[0], Cid)).to.equal(true);
  });

  it("file should not exist after node delete file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await nodeStorage.fileExist(nodeAddresses[0], Cid)).to.equal(false);
  });
});
