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
  revertNodes,
  nodeAddresses,
  nodes,
  accountAddresses, Cids
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
});
