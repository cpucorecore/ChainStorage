import { expect } from "chai";
import {
  Cid,
  Duration,
  FileExt,
  chainStorage,
  prepareContext,
  takeSnapshot,
  revertToSnapshot,
  users,
  user,
  userAddresses,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("User", function () {
  before(async () => {
    await prepareContext(2, 2, 2, 0, 0, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should emit UserAction event when user addFile", async function () {
    const user1 = users[0];
    const user1Address = userAddresses[0];

    await expect(
      chainStorage.connect(user1).userAddFile(Cid, Duration, FileExt)
    )
      .to.emit(user, "UserAction")
      .withArgs(user1Address, 0, Cid);
  });
});
