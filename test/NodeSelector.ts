import { assert } from "chai";
import {
  chainStorage,
  nodeStorage,
  nodeSelectorForTest,
  prepareContext,
  nodes,
  nodeAddresses,
  increaseTime,
  // eslint-disable-next-line node/no-missing-import
} from "./context";

describe("NodeSelector", function () {
  before(async () => {
    await prepareContext(0, 10, 2, 0, 0, 2);
  });

  it("test", async function () {
    let result = await nodeSelectorForTest.selectNodes(nodeStorage.address, 1);
    assert.lengthOf(result[0], 1);
    assert.equal(result[1], true);

    result = await nodeSelectorForTest.selectNodes(nodeStorage.address, 2);
    assert.lengthOf(result[0], 2);
    assert.equal(result[1], true);

    result = await nodeSelectorForTest.selectNodes(nodeStorage.address, 3);
    assert.lengthOf(result[0], 2);
    assert.equal(result[1], false);

    await chainStorage.connect(nodes[2]).nodeOnline();

    result = await nodeSelectorForTest.selectNodes(nodeStorage.address, 3);
    assert.lengthOf(result[0], 3);
    assert.equal(result[1], true);

    await chainStorage.connect(nodes[3]).nodeOnline();
    await chainStorage.connect(nodes[4]).nodeOnline();
    await chainStorage.connect(nodes[5]).nodeOnline();
    await chainStorage.connect(nodes[6]).nodeOnline();
    await chainStorage.connect(nodes[7]).nodeOnline();
    await chainStorage.connect(nodes[8]).nodeOnline();
    await chainStorage.connect(nodes[9]).nodeOnline();

    console.log(nodeAddresses);

    const oneMinute = 60;
    for (let i = 1; i <= 5; i++) {
      await increaseTime(oneMinute * i);
      result = await nodeSelectorForTest.selectNodes(nodeStorage.address, 3);
      assert.lengthOf(result[0], 3);
      assert.equal(result[1], true);
      console.log(result[0]);
    }
  });
});
