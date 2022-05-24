import { expect } from "chai";
import {
  Cid,
  Cids,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  nodes,
  takeSnapshot,
  revertToSnapshot,
  userStorage,
  accountAddresses,
  accounts,
  users,
  UserExt,
  UserStorageTotal,
  deployer,
  monitorStorage,
  MonitorExt,
  FileSize,
  increaseTime,
  MaxLength,
  TaskAcceptTimeout,
  AddFileTaskTimeout,
  monitors
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("Monitor", function () {
  before(async () => {
    await prepareContext(1, 3, 3, 2, 2, 3);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

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

  it.skip("monitor should reportTaskAcceptTimeout", async function () {
    const user = users[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await increaseTime(TaskAcceptTimeout);

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

  it.skip("monitor should fail reportTaskTimeout for timeout not reached", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    // await increaseTime(AddFileTaskTimeout - 1000);
    await chainStorage.connect(monitor).monitorReportTaskTimeout(1);
    // await expect(
    //   chainStorage.connect(monitor).monitorReportTaskTimeout(1)
    // ).to.revertedWith("xx");
  });

  it("monitor should reportTaskTimeout", async function () {
    const user = users[0];
    const node1 = nodes[0];
    const monitor = monitors[0];

    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    await chainStorage.connect(node1).nodeAcceptTask(1);
    await increaseTime(AddFileTaskTimeout);
    await chainStorage.connect(monitor).monitorReportTaskTimeout(1);
  });

  // it("report taskTimeout", async function () {
  //   const user = users[0];
  //   const node1 = nodes[0];
  //
  //   await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
  //   await chainStorage.connect(node1).nodeAcceptTask(1);
  //
  //   await expect(
  //     chainStorage.monitorReportTaskAcceptTimeout(1)
  //   ).to.revertedWith("M:task not acceptTimeout");
  //
  //   await increaseTime(TaskAcceptTimeout);
  //   await chainStorage.monitorReportTaskAcceptTimeout(1);
  // });
});
