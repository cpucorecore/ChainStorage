import { expect } from "chai";
import {
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  nodeStorage,
  users,
  Duration,
  FileExt,
  FileSize,
  nodeAddresses,
  nodes,
  Cids, CidHashes
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Node2", function () {
  before(async () => {
    await prepareContext(2, 4, 3);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("getNodeCanAddFileCount should be 0", async function () {
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[0])).to.equal(
      0
    );
  });

  it("getNodeCanAddFileCount should be update", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[0])).to.equal(
      1
    );
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[1])).to.equal(
      1
    );

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[1], FileSize);
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[0])).to.equal(
      2
    );
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[1])).to.equal(
      2
    );

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[0])).to.equal(
      1
    );
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[1])).to.equal(
      2
    );

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[1]);
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[0])).to.equal(
      0
    );
    expect(await nodeStorage.getNodeCanAddFileCount(nodeAddresses[1])).to.equal(
      2
    );
  });

  it("getNodeCanAddFileCidHashes test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    let cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(0);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(1);
    expect(cidHashes).to.contains(CidHashes[0]);

    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[1], FileSize);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(2);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);

    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[2], FileSize);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(3);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);

    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[2], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(2);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[1]);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(1);
    expect(cidHashes).to.contains(CidHashes[2]);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[2]);
    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[0]);
    expect(cidHashes).to.lengthOf(0);

    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[1]);
    expect(cidHashes).to.lengthOf(3);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);

    cidHashes = await nodeStorage.getNodeCanAddFileCidHashes(nodeAddresses[2]);
    expect(cidHashes).to.lengthOf(3);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);
  });

  it("isSizeConsistent should be true when file not exist", async function () {
    expect(await nodeStorage.isSizeConsistent(Cids[0])).to.equal(true);
  });

  it("isSizeConsistent should be true", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.isSizeConsistent(Cids[0])).to.equal(true);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.isSizeConsistent(Cids[0])).to.equal(true);
  });

  it("isSizeConsistent should be false", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize + 1);
    expect(await nodeStorage.isSizeConsistent(Cids[0])).to.equal(false);
  });

  it("nodeCanAddFile should failed", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    await expect(
      chainStorage.connect(nodes[3]).nodeCanAddFile(Cids[0], FileSize)
    ).to.revertedWith("N:can addFile node enough");
  });

  it("nodeCanAddFile should failed for file not exist", async function () {
    await expect(
      chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize)
    ).to.revertedWith("N:file not exist");
  });

  it("nodeCanAddFile should failed for", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await expect(
      chainStorage.connect(nodes[3]).nodeCanAddFile(Cids[0], FileSize)
    ).to.revertedWith("F:wrong status");
  });

  it("nodeCanDeleteFile should failed for node have not this file", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);
    await expect(
      chainStorage.connect(nodes[3]).nodeCanDeleteFile(Cids[0])
    ).to.revertedWith("N:node have not the file");
  });

  it("getCanAddFileNodeCount test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(0);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(1);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(2);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(3);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(2);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(1);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.getCanAddFileNodeCount(Cids[0])).to.equal(0);
  });

  it("getCanAddFileNodeAddresses test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    let addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(0);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(nodeAddresses[0]);

    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(nodeAddresses[0]);
    expect(addresses).to.contains(nodeAddresses[1]);

    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(3);
    expect(addresses).to.contains(nodeAddresses[0]);
    expect(addresses).to.contains(nodeAddresses[1]);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(nodeAddresses[1]);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    addresses = await nodeStorage.getCanAddFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(0);
  });

  it("isCanAddFile test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    expect(await nodeStorage.isCanAddFile(nodeAddresses[0], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isCanAddFile(nodeAddresses[1], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isCanAddFile(nodeAddresses[2], Cids[0])).to.equal(
      false
    );

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    expect(await nodeStorage.isCanAddFile(nodeAddresses[0], Cids[0])).to.equal(
      true
    );
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);

    expect(await nodeStorage.isCanAddFile(nodeAddresses[0], Cids[0])).to.equal(
      true
    );
    expect(await nodeStorage.isCanAddFile(nodeAddresses[1], Cids[0])).to.equal(
      true
    );
    expect(await nodeStorage.isCanAddFile(nodeAddresses[2], Cids[0])).to.equal(
      true
    );

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.isCanAddFile(nodeAddresses[0], Cids[0])).to.equal(
      false
    );

    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.isCanAddFile(nodeAddresses[1], Cids[0])).to.equal(
      false
    );

    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.isCanAddFile(nodeAddresses[2], Cids[0])).to.equal(
      false
    );
  });

  it("isFileAdded test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    expect(await nodeStorage.isFileAdded(nodeAddresses[0], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[1], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[2], Cids[0])).to.equal(
      false
    );

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);

    expect(await nodeStorage.isFileAdded(nodeAddresses[0], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[1], Cids[0])).to.equal(
      false
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[2], Cids[0])).to.equal(
      false
    );

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);

    expect(await nodeStorage.isFileAdded(nodeAddresses[0], Cids[0])).to.equal(
      true
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[1], Cids[0])).to.equal(
      true
    );
    expect(await nodeStorage.isFileAdded(nodeAddresses[2], Cids[0])).to.equal(
      true
    );
  });

  it("getNodeCanDeleteFileCount test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[2], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[2]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[2]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[2]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[1]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[2]);

    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(0);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(1);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[1]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(2);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[2]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(3);

    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(2);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[1]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(1);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[2]);
    expect(
      await nodeStorage.getNodeCanDeleteFileCount(nodeAddresses[0])
    ).to.equal(0);
  });

  it("getNodeCanDeleteFileCidHashes test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[2], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[2]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[2]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[2]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[1]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[2]);

    expect(
      await nodeStorage.getNodeCanDeleteFileCidHashes(nodeAddresses[0])
    ).to.lengthOf(0);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    let cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(1);
    expect(cidHashes).to.contains(CidHashes[0]);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[1]);
    cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(2);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[2]);
    cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(3);
    expect(cidHashes).to.contains(CidHashes[0]);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);

    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(2);
    expect(cidHashes).to.contains(CidHashes[1]);
    expect(cidHashes).to.contains(CidHashes[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[1]);
    cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(1);
    expect(cidHashes).to.contains(CidHashes[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[2]);
    cidHashes = await nodeStorage.getNodeCanDeleteFileCidHashes(
      nodeAddresses[0]
    );
    expect(cidHashes).to.lengthOf(0);
  });

  it("getCidCount test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[1], FileSize);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[2], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[2], FileSize);

    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(0);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(1);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[1]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(2);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[1]);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[2]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(3);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[2]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[2]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[1]);
    await chainStorage.connect(users[0]).userDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[2]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[2]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[1]);
    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(2);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[1]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(1);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[2]);
    expect(await nodeStorage.getCidCount(nodeAddresses[0])).to.equal(0);

    expect(await nodeStorage.getCidCount(nodeAddresses[1])).to.equal(3);
    expect(await nodeStorage.getCidCount(nodeAddresses[2])).to.equal(3);
  });

  it("getCanDeleteFileNodeAddresses test", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[2]).nodeCanAddFile(Cids[0], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[2]).nodeAddFile(Cids[0]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);

    let addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(0);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(nodeAddresses[0]);

    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(nodeAddresses[0]);
    expect(addresses).to.contains(nodeAddresses[1]);

    await chainStorage.connect(nodes[2]).nodeCanDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(3);
    expect(addresses).to.contains(nodeAddresses[0]);
    expect(addresses).to.contains(nodeAddresses[1]);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(nodeAddresses[1]);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(nodeAddresses[2]);

    await chainStorage.connect(nodes[2]).nodeDeleteFile(Cids[0]);
    addresses = await nodeStorage.getCanDeleteFileNodeAddresses(Cids[0]);
    expect(addresses).to.lengthOf(0);
  });
});
