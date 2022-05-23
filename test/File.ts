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
  dumpTaskState,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("File", function () {
  before(async () => {
    await prepareContext(2, 2, 2, 0, 0, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("exist", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[0]).nodeFinishTask(3, FileSize);
    expect(await fileStorage.exist(Cid)).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeAcceptTask(2);
    await chainStorage.connect(nodes[1]).nodeFinishTask(2, FileSize);
    expect(await fileStorage.exist(Cid)).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeAcceptTask(4);
    await chainStorage.connect(nodes[1]).nodeFinishTask(4, FileSize);
    expect(await fileStorage.exist(Cid)).to.equal(false);
  });

  it("owners", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(users[1]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(true);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);

    await chainStorage.connect(users[0]).userDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(true);

    await chainStorage.connect(users[1]).userDeleteFile(Cid);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[0]).nodeFinishTask(3, FileSize);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeAcceptTask(2);
    await chainStorage.connect(nodes[1]).nodeFinishTask(2, FileSize);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);

    await chainStorage.connect(nodes[1]).nodeAcceptTask(4);
    await chainStorage.connect(nodes[1]).nodeFinishTask(4, FileSize);
    expect(await fileStorage.userExist(Cid, userAddresses[0])).to.equal(false);
    expect(await fileStorage.userExist(Cid, userAddresses[1])).to.equal(false);
  });

  it("owners", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await taskStorage.getCurrentTid()).to.equal(2);

    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[0]).nodeFinishTask(1, FileSize);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(2);
    await chainStorage.connect(nodes[1]).nodeFinishTask(2, FileSize);

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

    await chainStorage.connect(nodes[0]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[0]).nodeFinishTask(3, FileSize);
    expect(await fileStorage.exist(Cid)).to.equal(true);

    await chainStorage.connect(nodes[1]).nodeAcceptTask(4);
    await chainStorage.connect(nodes[1]).nodeFinishTask(4, FileSize);
    expect(await fileStorage.exist(Cid)).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[0])).to.equal(false);
    expect(await fileStorage.nodeExist(Cid, nodeAddresses[1])).to.equal(false);
    await dumpTask(1, 4);
    await dumpTaskState(1, 4);
  });
});
