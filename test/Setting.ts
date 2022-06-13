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
  MaxNodeCanAddFileCount,
  MaxNodeCanDeleteFileCount,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Setting", function () {
  before(async () => {
    await prepareContext(10, 2, 2);
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

    await expect(setting.connect(users[8]).setMaxCidLength(4)).to.revertedWith(
      revertMsg
    );
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

  it("MaxCanAddFileCount get/set test", async function () {
    const newValue = MaxNodeCanAddFileCount * 2;
    expect(await setting.getMaxNodeCanAddFileCount()).to.equal(
      MaxNodeCanAddFileCount
    );
    await setting.connect(deployer).setMaxNodeCanAddFileCount(newValue);
    expect(await setting.getMaxNodeCanAddFileCount()).to.equal(newValue);
  });

  it("MaxCanDeleteFileCount get/set test", async function () {
    const newValue = MaxNodeCanDeleteFileCount * 2;
    expect(await setting.getMaxNodeCanDeleteFileCount()).to.equal(
      MaxNodeCanDeleteFileCount
    );
    await setting.connect(deployer).setMaxNodeCanDeleteFileCount(newValue);
    expect(await setting.getMaxNodeCanDeleteFileCount()).to.equal(newValue);
  });
});
