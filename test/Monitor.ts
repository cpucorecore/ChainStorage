import { expect } from "chai";
import {
  Cid,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  nodes,
  takeSnapshot,
  revertToSnapshot,
  accountAddresses,
  accounts,
  users,
  monitorStorage,
  MonitorExt,
  increaseTime,
  TaskAcceptTimeout,
  AddFileTaskTimeout,
  monitors,
  AddFileProgressTimeout,
  FileSize,
  NodeStorageTotal,
  NodeExt,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe.skip("Monitor", function () {
  before(async () => {
    await prepareContext(1, 3, 3, 2, 2, 3);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  async function prepareNode4() {
    const node5 = accounts[10];
    await chainStorage.connect(node5).nodeRegister(NodeStorageTotal, NodeExt);
    await chainStorage.connect(node5).nodeOnline();
  }

  it("exist", async function () {
    const monitor = accounts[10];
    const monitorAddress = accountAddresses[10];

    expect(await monitorStorage.exist(monitorAddress)).to.equal(false);

    await chainStorage.connect(monitor).monitorRegister(MonitorExt);
    expect(await monitorStorage.exist(monitorAddress)).to.equal(true);

    await chainStorage.connect(monitor).monitorDeRegister();
    expect(await monitorStorage.exist(monitorAddress)).to.equal(false);
  });

  it("ext", async function () {
    const monitor = accounts[10];
    const monitorAddress = accountAddresses[10];
    const newExt = "newExt";

    await chainStorage.connect(monitor).monitorRegister(MonitorExt);
    expect(await monitorStorage.getExt(monitorAddress)).to.equal(MonitorExt);

    await chainStorage.connect(monitor).monitorSetExt(newExt);
    expect(await monitorStorage.getExt(monitorAddress)).to.equal(newExt);

    await chainStorage.connect(monitor).monitorDeRegister();
    expect(await monitorStorage.getExt(monitorAddress)).to.equal("");
  });

  /*
export const TaskAcceptTimeout = 3600;
export const AddFileTaskTimeout = 3600 * 24;
export const DeleteFileTaskTimeout = 60 * 10;
export const AddFileProgressTimeout = 60 * 10;
*/
  it("monitor should fail to reportTaskAcceptTimeout for timeout not reached", async function () {
    const user = users[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);

    await expect(
      chainStorage.connect(monitor).monitorReportTaskAcceptTimeout(1)
    ).to.revertedWith("M:task not acceptTimeout");
  });

  it("monitor should fail to reportTaskAcceptTimeout for node report first", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await increaseTime(TaskAcceptTimeout);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await expect(
      chainStorage.connect(monitor).monitorReportTaskAcceptTimeout(1)
    ).to.revertedWith("M:task not acceptTimeout");
  });

  it("monitor should reportTaskAcceptTimeout", async function () {
    const user = users[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await increaseTime(TaskAcceptTimeout);

    await prepareNode4();
    await chainStorage.connect(monitor).monitorReportTaskAcceptTimeout(1);
  });

  it("monitor should fail to reportTaskAcceptTimeout for status is not Created", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await increaseTime(TaskAcceptTimeout);
    await expect(
      chainStorage.connect(monitor).monitorReportTaskAcceptTimeout(1)
    ).to.revertedWith("M:task not acceptTimeout");
  });

  it("monitor should fail reportTaskTimeout for timeout not reached", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await expect(
      chainStorage.connect(monitor).monitorReportTaskTimeout(1)
    ).to.revertedWith("M:task not timeout");
  });

  it("monitor should reportTaskTimeout", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await increaseTime(AddFileTaskTimeout);

    await prepareNode4();
    await chainStorage.connect(monitor).monitorReportTaskTimeout(1);
  });

  it("monitor should fail to reportTaskTimeout for the node report task first", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[1];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);

    await increaseTime(AddFileProgressTimeout);
    await chainStorage
      .connect(node1)
      .nodeReportAddFileProgressBySize(1, Math.ceil(FileSize / 10));
    await expect(
      chainStorage.connect(monitor).monitorReportTaskTimeout(1)
    ).to.revertedWith("M:task not timeout");

    await increaseTime(TaskAcceptTimeout);
  });
});
