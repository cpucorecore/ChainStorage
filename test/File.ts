import { expect } from "chai";
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
  nodeAddresses,
  Cids,
  CidHashes,
  Replica,
  deployer,
  setting,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("File", function () {
  before(async () => {
    await prepareContext(2, 2, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should not exist before add file", async function () {
    expect(await fileStorage.exist(Cid)).to.equal(false);
  });

  it("should exist after add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);
  });

  it("should not exist after delete file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(true);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(true);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(false);
  });

  it("file status should be 0(DefaultStatus) before add this file", async function () {
    expect(await fileStorage.getStatus(Cid)).to.equal(0);
  });

  it("file status should be 1(TryAdd) after user add this file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.getStatus(Cid)).to.equal(1);
  });

  it("file status should be 1(FileTryAdd) before all node send canAddFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    expect(await fileStorage.getStatus(Cid)).to.equal(1);
  });

  it("file status should be 2(FileAdding) after all node send canAddFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    expect(await fileStorage.getStatus(Cid)).to.equal(2);
  });

  it("file status should be 3(FilePartialAdded) before all node send addFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(3);
  });

  it("file status should be 4(FileAdded) after all node send addFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(4);
  });

  it("file status should be 5(FileTryDelete) after user delete this file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(5);
  });

  it("file status should be 5(FileTryDelete) before all node send canDeleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(5);
  });

  it("file status should be 6(FileDeleting) after all node send canDeleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(6);
  });

  it("file status should be 7(FilePartialDeleted) before all node send deleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(7);
  });

  it("file status should be 0(FilePartialDeleted) after all node send deleteFile", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.getStatus(Cid)).to.equal(0);
  });

  it("should fail to delete file before file added", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await expect(
      chainStorage.connect(users[0]).userDeleteFile(Cid)
    ).revertedWith("F:wrong status");
    expect(await fileStorage.exist(Cid)).to.equal(true);
  });

  it("should not userExist before user add file", async function () {
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
  });

  it("should userExist after user add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
  });

  it("should not nodeExist before user add file", async function () {
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
  });

  it("should not nodeExist after user add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
  });

  it("should nodeExist after node finish addFile task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(true);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(true);
  });

  it("should nodeExist before node finish deleteFile task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(true);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(true);
  });

  it("should not nodeExist after node finish deleteFile task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);

    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(false);
  });

  it("should userEmpty before add file", async function () {
    expect(await fileStorage.userEmpty(Cid)).to.equal(true);
  });

  it("should not userEmpty after add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userEmpty(Cid)).to.equal(false);
  });

  it("should nodeEmpty before add file", async function () {
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(true);
  });

  it("should not nodeEmpty after node add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(false);
  });

  it("should not nodeEmpty after node add file then user delete this file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(false);
  });

  it("should nodeEmpty after node add file then user delete this file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);

    expect(await fileStorage.nodeEmpty(Cid)).to.equal(true);
  });

  it("fileCount should be 0 before add file", async function () {
    expect(await fileStorage.getFileCount()).to.equal(0);
  });

  it("fileCount should be > 0 after add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.getFileCount()).to.equal(1);
  });

  it("fileCount should be 0 after add file then delete this file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);

    expect(await fileStorage.getFileCount()).to.equal(0);
  });

  it("totalSize should be 0 before add file", async function () {
    expect(await fileStorage.getTotalSize()).to.equal(0);
  });

  it("totalSize should be 0 after user add file before node finish the task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.getTotalSize()).to.equal(0);
  });

  it("totalSize should update after node finish addFile task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
  });

  it("totalSize should update according the first node to finish the task", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    expect(await fileStorage.getTotalSize()).to.equal(FileSize);
  });

  it("getSize complex test", async function () {
    const mockCid1 = "mockCid1";
    const mockCid2 = "mockCid2";
    const mockCid3 = "mockCid3";
    const mockCid1Size = 1111;
    const mockCid2Size = 2222;
    const mockCid3Size = 3333;

    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid1, Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid2, Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid3, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid1, mockCid1Size);
    expect(await fileStorage.getSize(mockCid1)).to.equal(0);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid1, mockCid1Size);
    expect(await fileStorage.getSize(mockCid1)).to.equal(mockCid1Size);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid2, mockCid2Size);
    expect(await fileStorage.getSize(mockCid2)).to.equal(0);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid2, mockCid2Size);
    expect(await fileStorage.getSize(mockCid2)).to.equal(mockCid2Size);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid3, mockCid3Size);
    expect(await fileStorage.getSize(mockCid3)).to.equal(0);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid3, mockCid3Size);
    expect(await fileStorage.getSize(mockCid3)).to.equal(mockCid3Size);
  });

  it("totalSize complex test", async function () {
    const mockCid1 = "mockCid1";
    const mockCid2 = "mockCid2";
    const mockCid3 = "mockCid3";
    const mockCid1Size = 1111;
    const mockCid2Size = 2222;
    const mockCid3Size = 3333;

    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid1, Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid2, Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(mockCid3, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid1, mockCid1Size);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid1, mockCid1Size);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid2, mockCid2Size);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid2, mockCid2Size);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(mockCid3, mockCid3Size);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(mockCid3, mockCid3Size);

    expect(await fileStorage.getTotalSize()).to.equal(0);
    await chainStorage.connect(nodes[0]).nodeAddFile(mockCid1);
    expect(await fileStorage.getTotalSize()).to.equal(mockCid1Size);
    await chainStorage.connect(nodes[1]).nodeAddFile(mockCid1);
    expect(await fileStorage.getTotalSize()).to.equal(mockCid1Size);

    await chainStorage.connect(nodes[0]).nodeAddFile(mockCid2);
    expect(await fileStorage.getTotalSize()).to.equal(
      mockCid1Size + mockCid2Size
    );
    await chainStorage.connect(nodes[1]).nodeAddFile(mockCid2);
    expect(await fileStorage.getTotalSize()).to.equal(
      mockCid1Size + mockCid2Size
    );

    await chainStorage.connect(nodes[0]).nodeAddFile(mockCid3);
    expect(await fileStorage.getTotalSize()).to.equal(
      mockCid1Size + mockCid2Size + mockCid3Size
    );
    await chainStorage.connect(nodes[1]).nodeAddFile(mockCid3);
    expect(await fileStorage.getTotalSize()).to.equal(
      mockCid1Size + mockCid2Size + mockCid3Size
    );
    expect(await fileStorage.getFileCount()).to.equal(3);

    await chainStorage.connect(users[0]).userDeleteFile(mockCid1);
    await chainStorage.connect(users[0]).userDeleteFile(mockCid2);
    await chainStorage.connect(users[0]).userDeleteFile(mockCid3);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(mockCid1);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(mockCid2);
    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(mockCid3);

    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(mockCid1);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(mockCid2);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(mockCid3);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(mockCid1);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(mockCid1);
    expect(await fileStorage.getTotalSize()).to.equal(
      mockCid2Size + mockCid3Size
    );
    expect(await fileStorage.getFileCount()).to.equal(2);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(mockCid2);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(mockCid2);
    expect(await fileStorage.getTotalSize()).to.equal(mockCid3Size);
    expect(await fileStorage.getFileCount()).to.equal(1);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(mockCid3);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(mockCid3);
    expect(await fileStorage.getTotalSize()).to.equal(0);
    expect(await fileStorage.getFileCount()).to.equal(0);

    expect(await fileStorage.getSize(mockCid1)).to.equal(0);
    expect(await fileStorage.getSize(mockCid2)).to.equal(0);
    expect(await fileStorage.getSize(mockCid3)).to.equal(0);
  });

  it("exist complex test", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);

    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);

    expect(await fileStorage.exist(Cid)).to.equal(false);
  });

  it("users complex test", async function () {
    expect(await fileStorage.userEmpty(Cid)).to.equal(true);

    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userEmpty(Cid)).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userEmpty(Cid)).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);
    let addresses = await fileStorage["getUsers(string)"](Cid);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(userAddresses[0]);
    expect(addresses).to.contains(userAddresses[1]);

    let result = await fileStorage["getUsers(string,uint256,uint256)"](
      Cid,
      50,
      1
    );
    expect(result[1]).to.equal(true);
    expect(result[0]).to.lengthOf(2);
    expect(result[0]).to.contains(userAddresses[0]);
    expect(result[0]).to.contains(userAddresses[1]);

    result = await fileStorage["getUsers(string,uint256,uint256)"](Cid, 1, 1);
    expect(result[1]).to.equal(false);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(userAddresses[0]);

    result = await fileStorage["getUsers(string,uint256,uint256)"](Cid, 1, 2);
    expect(result[1]).to.equal(true);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(userAddresses[1]);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.userEmpty(Cid)).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);
    addresses = await fileStorage["getUsers(string)"](Cid);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(userAddresses[1]);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    expect(await fileStorage.userEmpty(Cid)).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);
    addresses = await fileStorage["getUsers(string)"](Cid);
    expect(addresses).to.lengthOf(0);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);
  });

  it("nodes complex test", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    expect(await fileStorage.nodeEmpty(Cid)).to.equal(true);
    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(true);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(false);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(false);

    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);

    let addresses = await fileStorage["getNodes(string)"](Cid);
    expect(addresses).to.lengthOf(2);
    expect(addresses).to.contains(nodeAddresses[0]);
    expect(addresses).to.contains(nodeAddresses[1]);

    let result = await fileStorage["getNodes(string,uint256,uint256)"](
      Cid,
      50,
      1
    );
    expect(result[1]).to.equal(true);
    expect(result[0]).to.lengthOf(2);
    expect(result[0]).to.contains(nodeAddresses[0]);
    expect(result[0]).to.contains(nodeAddresses[1]);

    result = await fileStorage["getNodes(string,uint256,uint256)"](Cid, 1, 1);
    expect(result[1]).to.equal(false);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(nodeAddresses[0]);

    result = await fileStorage["getNodes(string,uint256,uint256)"](Cid, 1, 2);
    expect(result[1]).to.equal(true);
    expect(result[0]).to.lengthOf(1);
    expect(result[0]).to.contains(nodeAddresses[1]);

    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(true);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(true);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(true);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(true);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(true);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(true);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(true);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(false);
    addresses = await fileStorage["getNodes(string)"](Cid);
    expect(addresses).to.lengthOf(1);
    expect(addresses).to.contains(nodeAddresses[1]);

    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(false);
    expect(await fileStorage.nodeEmpty(Cid)).to.equal(true);
    addresses = await fileStorage["getNodes(string)"](Cid);
    expect(addresses).to.lengthOf(0);
  });

  it("getCid test", async function () {
    expect(await fileStorage.getCid(CidHashes[0])).to.equal("");
    expect(await fileStorage.getCid(CidHashes[1])).to.equal("");
    expect(await fileStorage.getCid(CidHashes[2])).to.equal("");

    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    expect(await fileStorage.getCid(CidHashes[0])).to.equal(Cids[0]);
    expect(await fileStorage.getCid(CidHashes[1])).to.equal(Cids[1]);
    expect(await fileStorage.getCid(CidHashes[2])).to.equal(Cids[2]);
  });

  it("replica should be 0", async function () {
    expect(await fileStorage.getReplica(Cids[0])).to.equal(0);
  });

  it("replica should be equal to setting.replica", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    expect(await fileStorage.getReplica(Cids[0])).to.equal(Replica);
  });

  it("replica should be equal to setting.replica after set setting.replica", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    expect(await fileStorage.getReplica(Cids[0])).to.equal(Replica);

    const newReplica = 10;
    await setting.connect(deployer).setReplica(newReplica);

    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    expect(await fileStorage.getReplica(Cids[0])).to.equal(Replica);
    expect(await fileStorage.getReplica(Cids[1])).to.equal(newReplica);
  });

  it("replica should be 0 after file deleted", async function () {
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    expect(await fileStorage.getReplica(Cids[0])).to.equal(Replica);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cids[0], FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cids[0], FileSize);

    await chainStorage.connect(nodes[0]).nodeAddFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cids[0]);

    await chainStorage.connect(users[0]).userDeleteFile(Cids[0]);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cids[0]);

    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cids[0]);
    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cids[0]);

    expect(await fileStorage.getReplica(Cids[0])).to.equal(0);
  });
});
