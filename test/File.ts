import { expect } from "chai";
import {
  Cid,
  Duration,
  FileExt,
  chainStorage,
  fileStorage,
  prepareContext,
  nodes,
  users,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("File", function () {
  before(async () => {
    await prepareContext(2, 2, 2, 0, 0, 2);
  });

  it("test", async function () {
    await chainStorage.connect(users[0]).userAddFile(Cid, Duration, FileExt);
    expect(await fileStorage.exist(Cid)).to.equal(true);
  });
});
