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
  nodeAddresses,
  fileStorage,
  userAddresses,
  nodeStorage,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("UserAction", function () {
  let user1: Signer;
  let user2: Signer;
  let user1Address: string;
  let user2Address: string;
  let node1: Signer;
  let node2: Signer;
  let node3: Signer;
  let node4: Signer;
  let node1Address: string;
  let node2Address: string;
  let node3Address: string;
  let node4Address: string;
  let cid: string;

  before(async () => {
    await prepareContext(2, 4, 4);
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

  it("user random operations 1", async function () {
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

    await chainStorage.connect(user1).userAddFile(cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node2).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node3).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node4).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node1).nodeAddFile(cid);
    await chainStorage.connect(node2).nodeAddFile(cid);
    await chainStorage.connect(node3).nodeAddFile(cid);
    await chainStorage.connect(node4).nodeAddFile(cid);

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
    expect(await fileStorage.getFileCount()).to.equal(1);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
    // file check
    expect(await userStorage.getFileExt(user1Address, cid)).to.equal(FileExt);
    expect(await userStorage.getFileDuration(user1Address, cid)).to.equal(
      Duration
    );
    // node check
    expect(await nodeStorage.getNodeCount()).to.equal(4);

    await chainStorage.connect(user1).userDeleteFile(cid);
    await chainStorage.connect(node1).nodeCanDeleteFile(cid);
    await chainStorage.connect(node2).nodeCanDeleteFile(cid);
    await chainStorage.connect(node3).nodeCanDeleteFile(cid);
    await chainStorage.connect(node4).nodeCanDeleteFile(cid);
    await chainStorage.connect(node1).nodeDeleteFile(cid);
    await chainStorage.connect(node2).nodeDeleteFile(cid);
    await chainStorage.connect(node3).nodeDeleteFile(cid);
    await chainStorage.connect(node4).nodeDeleteFile(cid);
    expect(await fileStorage.exist(cid)).to.equal(false);
    expect(await fileStorage.getSize(cid)).to.equal(0);
    expect(await fileStorage.userExist(cid, user1Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node1Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node2Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node3Address)).to.equal(false);
    expect(await fileStorage.nodeExist(cid, node4Address)).to.equal(false);
    _users = await fileStorage["getUsers(string)"](cid);
    assert.lengthOf(_users, 0);
    _nodes = await fileStorage["getNodes(string)"](cid);
    assert.lengthOf(_nodes, 0);
    expect(await fileStorage.getFileCount()).to.equal(0);
    expect(await fileStorage.getTotalSize()).to.equal(0);
    // file check
    expect(await userStorage.getFileExt(user1Address, cid)).to.equal("");
    expect(await userStorage.getFileDuration(user1Address, cid)).to.equal(0);
    // node check
    expect(await nodeStorage.getNodeCount()).to.equal(4);

    await chainStorage.connect(user2).userAddFile(cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node2).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node3).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node4).nodeCanAddFile(cid, FileSize);
    await chainStorage.connect(node1).nodeAddFile(cid);
    await chainStorage.connect(node2).nodeAddFile(cid);
    await chainStorage.connect(node3).nodeAddFile(cid);
    await chainStorage.connect(node4).nodeAddFile(cid);
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
    expect(await fileStorage.getFileCount()).to.equal(1);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
    // file check
    expect(await userStorage.getFileExt(user2Address, cid)).to.equal(FileExt);
    expect(await userStorage.getFileDuration(user2Address, cid)).to.equal(
      Duration
    );
    // node check
    expect(await nodeStorage.getNodeCount()).to.equal(4);
  });
});
