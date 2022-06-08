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
  nodeAddresses,
  Cids,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("File", function () {
  before(async () => {
    await prepareContext(2, 2, 0, 0, 2);
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

  it("should fail to delete the file after add file", async function () {
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

  it("totalFileNumber should be 0 before add file", async function () {
    expect(await fileStorage.getFileNumber()).to.equal(0);
  });

  it("totalFileNumber should be > 0 after add file", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.getFileNumber()).to.equal(1);
  });

  it("totalFileNumber should be > 0 after add file then delete this file", async function () {
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

    expect(await fileStorage.getFileNumber()).to.equal(0);
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

  it("totalSize", async function () {
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
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(5);
    // expect(await fileStorage.getSize(mockCid1)).to.equal(0);
    // expect(await fileStorage.getSize(mockCid2)).to.equal(0);
    // expect(await fileStorage.getSize(mockCid3)).to.equal(0);
    //
    // await chainStorage.connect(nodes[0]).nodeFinishTask(1, mockCid1Size);
    // expect(await fileStorage.getTotalSize()).to.equal(mockCid1Size);
    // await chainStorage.connect(nodes[0]).nodeFinishTask(3, mockCid2Size);
    // expect(await fileStorage.getTotalSize()).to.equal(
    //   mockCid1Size + mockCid2Size
    // );
    // await chainStorage.connect(nodes[0]).nodeFinishTask(5, mockCid3Size);
    // expect(await fileStorage.getTotalSize()).to.equal(
    //   mockCid1Size + mockCid2Size + mockCid3Size
    // );
    // expect(await fileStorage.getTotalFileNumber()).to.equal(3);
    // expect(await fileStorage.getSize(mockCid1)).to.equal(mockCid1Size);
    // expect(await fileStorage.getSize(mockCid2)).to.equal(mockCid2Size);
    // expect(await fileStorage.getSize(mockCid3)).to.equal(mockCid3Size);
    //
    // await chainStorage.connect(users[0]).userDeleteFile(mockCid1);
    // await chainStorage.connect(users[0]).userDeleteFile(mockCid2);
    // await chainStorage.connect(users[0]).userDeleteFile(mockCid3);
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(7);
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(8);
    // await chainStorage.connect(nodes[0]).nodeAcceptTask(9);
    //
    // await chainStorage.connect(nodes[0]).nodeFinishTask(7, 0);
    // expect(await fileStorage.getTotalSize()).to.equal(
    //   mockCid2Size + mockCid3Size
    // );
    // expect(await fileStorage.getTotalFileNumber()).to.equal(2);
    //
    // await chainStorage.connect(nodes[0]).nodeFinishTask(8, 0);
    // expect(await fileStorage.getTotalSize()).to.equal(mockCid3Size);
    // expect(await fileStorage.getTotalFileNumber()).to.equal(1);
    //
    // await chainStorage.connect(nodes[0]).nodeFinishTask(9, 0);
    // expect(await fileStorage.getTotalSize()).to.equal(0);
    // expect(await fileStorage.getTotalFileNumber()).to.equal(0);
    //
    // expect(await fileStorage.getSize(mockCid1)).to.equal(mockCid1Size);
    // expect(await fileStorage.getSize(mockCid2)).to.equal(mockCid2Size);
    // expect(await fileStorage.getSize(mockCid3)).to.equal(mockCid3Size);
  });

  it("exist", async function () {
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

  it("owners", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[0]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[1]).nodeCanDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);
  });

  it("nodes", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);

    await chainStorage.connect(nodes[0]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[1]).nodeCanAddFile(Cid, FileSize);
    await chainStorage.connect(nodes[0]).nodeAddFile(Cid);
    await chainStorage.connect(nodes[1]).nodeAddFile(Cid);

    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);

    const _nodes = await fileStorage["getNodes(string)"](Cid);
    assert.lengthOf(_nodes, 2);
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

    await chainStorage.connect(nodes[1]).nodeDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(false);
  });

  /*
  export const Cids = [
  "QmWAJk3wmp8jqTWp2dQ3NRdoBjnmvupdL2GiBqt69FFk2H", // hash: 0xdda4e1efafe56f53f4025cd0708f6bdff673e1aa3995eea9f023c6eec2a7eb4a
  "QmUgU1m8wtsiyfXnKJn6yMP66zph5X716GZqjqYrZWsLjf", // hash: 0xf8af37dd2f20cebb5f9720a4c63a7ceaa036a5042a30b87a19832e0fa530c84c
  "QmRnCyTbu47hdg173ja4j8xUoEZ5MjRHT6yqDMSqtqXHhF", // hash: 0xd4a832f0884972948d6eee2c2daa0e91def2d4bd5f4f899c9eda1d78a28a9b44
  "QmbZU93HjXLn5wseFjCLyw1tM5BDoitSiZfR5o3Jo6C6tN", // hash: 0x68fc51c0de0c0e6be1067b90862da21f2e796b933851e5aaecf9d1d6f6ff332b
  "QmeN6JUjRSZJgdQFjFMX9PHwAFueWbRecLKBZgcqYLboir", // hash: 0x5ef8d464eb9a1baaf9c52ccfef2262fda94bd65cc559526f90e9ea37e73b2068
];
   */
  it("getCid", async function () {
    expect(
      await fileStorage.getCid(
        "0xdda4e1efafe56f53f4025cd0708f6bdff673e1aa3995eea9f023c6eec2a7eb4a"
      )
    ).to.equal("");
    expect(
      await fileStorage.getCid(
        "0xf8af37dd2f20cebb5f9720a4c63a7ceaa036a5042a30b87a19832e0fa530c84c"
      )
    ).to.equal("");
    expect(
      await fileStorage.getCid(
        "0xd4a832f0884972948d6eee2c2daa0e91def2d4bd5f4f899c9eda1d78a28a9b44"
      )
    ).to.equal("");

    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[0], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[1], Duration, FileExt);
    await chainStorage
      .connect(users[0])
      .userAddFile(Cids[2], Duration, FileExt);

    expect(
      await fileStorage.getCid(
        "0xdda4e1efafe56f53f4025cd0708f6bdff673e1aa3995eea9f023c6eec2a7eb4a"
      )
    ).to.equal(Cids[0]);
    expect(
      await fileStorage.getCid(
        "0xf8af37dd2f20cebb5f9720a4c63a7ceaa036a5042a30b87a19832e0fa530c84c"
      )
    ).to.equal(Cids[1]);
    expect(
      await fileStorage.getCid(
        "0xd4a832f0884972948d6eee2c2daa0e91def2d4bd5f4f899c9eda1d78a28a9b44"
      )
    ).to.equal(Cids[2]);
  });
});
