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
  task,
  nodeAddresses,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("Event", function () {
  before(async () => {
    await prepareContext(2, 2, 2, 0, 0, 2);
  });

  beforeEach(async function () {
    await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot();
  });

  it("should emit UserAction/TaskIssued/TaskStatusChanged event when user addFile", async function () {
    const user1 = users[0];
    const user1Address = userAddresses[0];
    const node1Address = nodeAddresses[0];
    const node2Address = nodeAddresses[1];

    await expect(
      chainStorage.connect(user1).userAddFile(Cid, Duration, FileExt)
    )
      .to.emit(user, "UserAction")
      .withArgs(user1Address, 0, Cid)
      .to.emit(task, "TaskIssued")
      .withArgs(node1Address, 1)
      .to.emit(task, "TaskIssued")
      .withArgs(node2Address, 2)
      .to.emit(task, "TaskStatusChanged")
      .withArgs(1, node1Address, 0, 0, 1)
      .to.emit(task, "TaskStatusChanged")
      .withArgs(2, node2Address, 0, 0, 1);
  });
});
