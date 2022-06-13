import { expect } from "chai";
import {
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  users,
  blacklist,
  deployer,
  Cids,
  userAddresses,
  nodeAddresses, nodes, FileSize
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Blacklist", function () {
  before(async () => {
    await prepareContext(2, 2, 1);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should have no auth to addCid", async function () {
    await expect(blacklist.connect(users[1]).addCid(Cids[0])).to.revertedWith(
      "wrong caller"
    );
  });

  it("should have no auth to addUser", async function () {
    await expect(
      blacklist.connect(users[1]).addUser(userAddresses[0])
    ).to.revertedWith("wrong caller");
  });

  it("should have no auth to addNode", async function () {
    await expect(
      blacklist.connect(users[1]).addNode(nodeAddresses[0])
    ).to.revertedWith("wrong caller");
  });

  it("should have no auth to deleteCid", async function () {
    await blacklist.connect(deployer).addCid(Cids[0]);
    await expect(
      blacklist.connect(users[1]).deleteCid(Cids[0])
    ).to.revertedWith("wrong caller");
  });

  it("should have no auth to deleteUser", async function () {
    await blacklist.connect(deployer).addUser(userAddresses[0]);
    await expect(
      blacklist.connect(users[1]).deleteUser(userAddresses[0])
    ).to.revertedWith("wrong caller");
  });

  it("should have no auth to deleteNode", async function () {
    await blacklist.connect(deployer).addNode(nodeAddresses[0]);
    await expect(
      blacklist.connect(users[1]).deleteNode(nodeAddresses[0])
    ).to.revertedWith("wrong caller");
  });

  it("checkCid should pass", async function () {
    expect(await blacklist.checkCid(Cids[0])).to.equal(true);
  });

  it("checkUser should pass", async function () {
    expect(await blacklist.checkUser(userAddresses[0])).to.equal(true);
  });

  it("checkNode should pass", async function () {
    expect(await blacklist.checkNode(nodeAddresses[0])).to.equal(true);
  });

  it("checkCid should fail", async function () {
    await blacklist.connect(deployer).addCid(Cids[0]);
    expect(await blacklist.checkCid(Cids[0])).to.equal(false);
  });

  it("checkUser should fail", async function () {
    await blacklist.connect(deployer).addUser(userAddresses[0]);
    expect(await blacklist.checkUser(userAddresses[0])).to.equal(false);
  });

  it("checkNode should fail", async function () {
    await blacklist.connect(deployer).addNode(nodeAddresses[0]);
    expect(await blacklist.checkNode(nodeAddresses[0])).to.equal(false);
  });

  it("checkCid should pass after no blacklisted", async function () {
    await blacklist.connect(deployer).addCid(Cids[0]);
    await blacklist.connect(deployer).deleteCid(Cids[0]);
    expect(await blacklist.checkCid(Cids[0])).to.equal(true);
  });

  it("checkUser should pass after no blacklisted", async function () {
    await blacklist.connect(deployer).addUser(userAddresses[0]);
    await blacklist.connect(deployer).deleteUser(userAddresses[0]);
    expect(await blacklist.checkUser(userAddresses[0])).to.equal(true);
  });

  it("checkNode should pass after no blacklisted", async function () {
    await blacklist.connect(deployer).addNode(nodeAddresses[0]);
    await blacklist.connect(deployer).deleteNode(nodeAddresses[0]);
    expect(await blacklist.checkNode(nodeAddresses[0])).to.equal(true);
  });

  it("should addFile failed for cid in blacklist", async function () {
    await blacklist.connect(deployer).addCid(Cids[0]);
    await expect(
      chainStorage.connect(users[0]).userAddFile(Cids[0], Duration, FileExt)
    ).to.revertedWith("CS:cid in blacklist");
  });

  it("should addFile failed for user in blacklist", async function () {
    await blacklist.connect(deployer).addUser(userAddresses[0]);
    await expect(
      chainStorage.connect(users[0]).userAddFile(Cids[0], Duration, FileExt)
    ).to.revertedWith("CS:user in blacklist");
  });

  it("should canAddFile failed for node in blacklist", async function () {
    await blacklist.connect(deployer).addNode(nodeAddresses[0]);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);

    await expect(
      chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize)
    ).to.revertedWith("CS:node in blacklist");
  });
});
