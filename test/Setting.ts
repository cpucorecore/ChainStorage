import { expect } from "chai";
import {
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  UserStorageTotal,
  deployer,
  setting,
  users,
  userAddresses,
  deployerAddress,
  MaxLength,
  TaskAcceptTimeout,
  AddFileTaskTimeout,
  DeleteFileTaskTimeout,
  AddFileProgressTimeout,
  MaxAddFileFailedCount,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Setting", function () {
  before(async () => {
    await prepareContext(10, 2, 2, 0, 0, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should fail to set value for not auth", async function () {
    const revertMsg = "caller is not the owner";

    await expect(setting.connect(users[8]).setReplica(4)).to.revertedWith(
      revertMsg
    );

    await expect(setting.connect(users[8]).setInitSpace(4)).to.revertedWith(
      revertMsg
    );

    await expect(
      setting.connect(users[8]).setAdmin(userAddresses[7])
    ).to.revertedWith("S:no auth");

    await expect(
      setting.connect(users[8]).setMaxUserExtLength(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setMaxNodeExtLength(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setMaxMonitorExtLength(4)
    ).to.revertedWith(revertMsg);

    await expect(setting.connect(users[8]).setMaxCidLength(4)).to.revertedWith(
      revertMsg
    );

    await expect(
      setting.connect(users[8]).setTaskAcceptTimeout(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setAddFileTaskTimeout(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setDeleteFileTaskTimeout(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setAddFileProgressTimeout(4)
    ).to.revertedWith(revertMsg);

    await expect(
      setting.connect(users[8]).setMaxAddFileFailedCount(4)
    ).to.revertedWith(revertMsg);
  });

  it("replica get/set test", async function () {
    const newValue = 4;
    expect(await setting.getReplica()).to.equal(2);
    await setting.connect(deployer).setReplica(newValue);
    expect(await setting.getReplica()).to.equal(4);
  });

  it("initSpace get/set test", async function () {
    const newValue = UserStorageTotal * 2;
    expect(await setting.getInitSpace()).to.equal(UserStorageTotal);
    await setting.connect(deployer).setInitSpace(newValue);
    expect(await setting.getInitSpace()).to.equal(newValue);
  });

  it("admin get/set test", async function () {
    const newValue = userAddresses[7];
    expect(await setting.getAdmin()).to.equal(deployerAddress);
    await setting.connect(deployer).setAdmin(newValue);
    expect(await setting.getAdmin()).to.equal(newValue);
  });

  it("maxUserExtLength get/set test", async function () {
    const newValue = MaxLength * 2;
    expect(await setting.getMaxUserExtLength()).to.equal(MaxLength);
    await setting.connect(deployer).setMaxUserExtLength(newValue);
    expect(await setting.getMaxUserExtLength()).to.equal(newValue);
  });

  it("maxNodeExtLength get/set test", async function () {
    const newValue = MaxLength * 2;
    expect(await setting.getMaxNodeExtLength()).to.equal(MaxLength);
    await setting.connect(deployer).setMaxNodeExtLength(newValue);
    expect(await setting.getMaxNodeExtLength()).to.equal(newValue);
  });

  it("maxMonitorExtLength get/set test", async function () {
    const newValue = MaxLength * 2;
    expect(await setting.getMaxMonitorExtLength()).to.equal(MaxLength);
    await setting.connect(deployer).setMaxMonitorExtLength(newValue);
    expect(await setting.getMaxMonitorExtLength()).to.equal(newValue);
  });

  it("maxFileExtLength get/set test", async function () {
    const newValue = MaxLength * 2;
    expect(await setting.getMaxFileExtLength()).to.equal(MaxLength);
    await setting.connect(deployer).setMaxFileExtLength(newValue);
    expect(await setting.getMaxFileExtLength()).to.equal(newValue);
  });

  it("maxCidLength get/set test", async function () {
    const newValue = MaxLength * 2;
    expect(await setting.getMaxCidLength()).to.equal(MaxLength);
    await setting.connect(deployer).setMaxCidLength(newValue);
    expect(await setting.getMaxCidLength()).to.equal(newValue);
  });

  it("taskAcceptTimeout get/set test", async function () {
    const newValue = TaskAcceptTimeout * 2;
    expect(await setting.getTaskAcceptTimeout()).to.equal(TaskAcceptTimeout);
    await setting.connect(deployer).setTaskAcceptTimeout(newValue);
    expect(await setting.getTaskAcceptTimeout()).to.equal(newValue);
  });

  it("addFileTaskTimeout get/set test", async function () {
    const newValue = AddFileTaskTimeout * 2;
    expect(await setting.getAddFileTaskTimeout()).to.equal(AddFileTaskTimeout);
    await setting.connect(deployer).setAddFileTaskTimeout(newValue);
    expect(await setting.getAddFileTaskTimeout()).to.equal(newValue);
  });

  it("deleteFileTaskTimeout get/set test", async function () {
    const newValue = DeleteFileTaskTimeout * 2;
    expect(await setting.getDeleteFileTaskTimeout()).to.equal(
      DeleteFileTaskTimeout
    );
    await setting.connect(deployer).setDeleteFileTaskTimeout(newValue);
    expect(await setting.getDeleteFileTaskTimeout()).to.equal(newValue);
  });

  it("addFileProgressTimeout get/set test", async function () {
    const newValue = AddFileProgressTimeout * 2;
    expect(await setting.getAddFileProgressTimeout()).to.equal(
      AddFileProgressTimeout
    );
    await setting.connect(deployer).setAddFileProgressTimeout(newValue);
    expect(await setting.getAddFileProgressTimeout()).to.equal(newValue);
  });

  it("maxAddFileFailedCount get/set test", async function () {
    const newValue = MaxAddFileFailedCount * 2;
    expect(await setting.getMaxAddFileFailedCount()).to.equal(
      MaxAddFileFailedCount
    );
    await setting.connect(deployer).setMaxAddFileFailedCount(newValue);
    expect(await setting.getMaxAddFileFailedCount()).to.equal(newValue);
  });
});
