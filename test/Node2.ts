import { expect } from "chai";
import {
  Cids,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  nodes,
  takeSnapshot,
  revertToSnapshot,
  users,
  FileSize,
  nodeStorage,
  registerMoreNodesAndOnline,
  revertNodes,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Node2", function () {
  before(async () => {
    await prepareContext(1, 5, 5, 0, 0, 5);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("AddFileFailedCount", async function () {
    const user = users[0];

    await chainStorage.connect(user).userAddFile(Cids[0], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(1);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(2);
    await chainStorage.connect(nodes[2]).nodeAcceptTask(3);
    await chainStorage.connect(nodes[3]).nodeAcceptTask(4);
    await chainStorage.connect(nodes[4]).nodeAcceptTask(5);

    await chainStorage.connect(user).userAddFile(Cids[1], Duration, FileExt);
    await chainStorage.connect(nodes[0]).nodeAcceptTask(6);
    await chainStorage.connect(nodes[1]).nodeAcceptTask(7);
    await chainStorage.connect(nodes[2]).nodeAcceptTask(8);
    await chainStorage.connect(nodes[3]).nodeAcceptTask(9);
    await chainStorage.connect(nodes[4]).nodeAcceptTask(10);

    await registerMoreNodesAndOnline(4);

    await chainStorage.connect(nodes[0]).nodeFailTask(1);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(1);

    await chainStorage.connect(nodes[1]).nodeFailTask(2);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(2);

    await chainStorage.connect(nodes[2]).nodeFailTask(3);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(3);

    await chainStorage.connect(nodes[4]).nodeFailTask(5);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(4);

    await chainStorage.connect(nodes[3]).nodeFinishTask(4, FileSize);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(0);

    await chainStorage.connect(nodes[4]).nodeFailTask(10);
    expect(await nodeStorage.getAddFileFailedCount(Cids[0])).to.equal(0);
    expect(await nodeStorage.getAddFileFailedCount(Cids[1])).to.equal(1);

    await revertNodes();
  });
});
