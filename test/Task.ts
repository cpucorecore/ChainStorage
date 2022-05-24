import { expect } from "chai";
import {
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  taskStorage,
  users,
  Cid,
  // eslint-disable-next-line node/no-missing-import
} from "./context";
import { Signer } from "ethers";

describe("Task", function () {
  let user: Signer;

  before(async () => {
    await prepareContext(2, 2, 2, 0, 0, 2);
    user = users[0];
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("exist", async function () {
    expect(await taskStorage.exist(1)).to.equal(false);
    await chainStorage.connect(user).userAddFile(Cid, Duration, FileExt);
    expect(await taskStorage.exist(1)).to.equal(true);
    expect(await taskStorage.exist(2)).to.equal(true);
  });
});
