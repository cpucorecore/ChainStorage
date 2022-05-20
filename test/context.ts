import { ethers } from "hardhat";
import { Signer } from "ethers";
// const Web3Utils = require("web3-utils");
import { fromAscii, padRight } from "web3-utils";
// eslint-disable-next-line node/no-missing-import
import { ChainStorage, NodeSelectorForTest, NodeStorage } from "../typechain";

export const NodeStorageTotal = 1024 * 1024 * 1024 * 100;
export const UserStorageTotal = 1024 * 1024 * 1024 * 5;
export const MaxLength = 1024;
export let Replica: any = 2;
export const Duration = 3600;
export const NodeExt = "nodeExt";
export const UserExt = "userExt";
export const MonitorExt = "monitorExt";
export const FileSize = 1111;
export const Cid = "QmeN6JUjRSZJgdQFjFMX9PHwAFueWbRecLKBZgcqYLboir";

export const TaskAcceptTimeout = 3600;
export const AddFileTaskTimeout = 3600 * 24;
export const DeleteFileTaskTimeout = 60 * 10;
export const AddFileProgressTimeout = 60 * 10;

export let accounts: Signer[];

export let nodeSelectorForTest: NodeSelectorForTest;

export let chainStorage: ChainStorage;
export let nodeStorage: NodeStorage;
export const users: Signer[] = [];
export const nodes: Signer[] = [];
export const monitors: Signer[] = [];
export const userAddresses: string[] = [];
export const nodeAddresses: string[] = [];
export const monitorAddresses: string[] = [];

function string2bytes32(value: string) {
  return padRight(fromAscii(value), 64);
}

export async function prepareContext(
  userNumber: any,
  nodeNumber: any,
  onlineNodeNumber: any,
  monitorNumber: any,
  onlineMonitorNumber: any,
  replica: any
) {
  Replica = replica;
  accounts = await ethers.getSigners();
  // deploy Resolver
  const Resolver = await ethers.getContractFactory("Resolver");
  const resolver = await Resolver.deploy();
  await resolver.deployed();
  // deploy Setting
  const Setting = await ethers.getContractFactory("Setting");
  const setting = await Setting.deploy();
  await setting.deployed();
  // deploy SettingStorage
  const SettingStorage = await ethers.getContractFactory("SettingStorage");
  const settingStorage = await SettingStorage.deploy(setting.address);
  await settingStorage.deployed();
  // setting setStorage
  await setting.setStorage(settingStorage.address);
  // deploy File
  const File = await ethers.getContractFactory("File");
  const file = await File.deploy(resolver.address);
  await file.deployed();
  // deploy FileStorage
  const FileStorage = await ethers.getContractFactory("FileStorage");
  const fileStorage = await FileStorage.deploy(file.address);
  await fileStorage.deployed();
  // file setStorage
  await file.setStorage(fileStorage.address);
  // deploy Monitor
  const Monitor = await ethers.getContractFactory("Monitor");
  const monitor = await Monitor.deploy(resolver.address);
  await monitor.deployed();
  // deploy MonitorStorage
  const MonitorStorage = await ethers.getContractFactory("MonitorStorage");
  const monitorStorage = await MonitorStorage.deploy(monitor.address);
  await monitorStorage.deployed();
  // monitor setStorage
  await monitor.setStorage(monitorStorage.address);
  // deploy User
  const User = await ethers.getContractFactory("User");
  const user = await User.deploy(resolver.address);
  await user.deployed();
  // deploy UserStorage
  const UserStorage = await ethers.getContractFactory("UserStorage");
  const userStorage = await UserStorage.deploy(user.address);
  await userStorage.deployed();
  // user setStorage
  await user.setStorage(userStorage.address);
  // deploy Node
  const Node = await ethers.getContractFactory("Node");
  const node = await Node.deploy(resolver.address);
  await node.deployed();
  // deploy NodeStorage
  const NodeStorage = await ethers.getContractFactory("NodeStorage");
  nodeStorage = await NodeStorage.deploy(node.address);
  await nodeStorage.deployed();
  // node setStorage
  await node.setStorage(nodeStorage.address);
  // deploy Task
  const Task = await ethers.getContractFactory("Task");
  const task = await Task.deploy(resolver.address);
  await task.deployed();
  // deploy TaskStorage
  const TaskStorage = await ethers.getContractFactory("TaskStorage");
  const taskStorage = await TaskStorage.deploy(task.address);
  await taskStorage.deployed();
  // task setStorage
  await task.setStorage(taskStorage.address);
  // deploy ChainStorage
  const ChainStorage = await ethers.getContractFactory("ChainStorage");
  chainStorage = await ChainStorage.deploy();
  await chainStorage.deployed();
  // chainStorage initialize
  await chainStorage.initialize(resolver.address);
  // deploy NodeSelectorForTest
  const NodeSelectorForTest = await ethers.getContractFactory(
    "NodeSelectorForTest"
  );
  nodeSelectorForTest = await NodeSelectorForTest.deploy();
  await nodeSelectorForTest.deployed();
  // resolver set addresses
  const deployerAddress = await accounts[0].getAddress();
  await resolver.setAddress(string2bytes32("Admin"), deployerAddress);
  await resolver.setAddress(string2bytes32("Setting"), setting.address);
  await resolver.setAddress(string2bytes32("File"), file.address);
  await resolver.setAddress(string2bytes32("Monitor"), monitor.address);
  await resolver.setAddress(string2bytes32("User"), user.address);
  await resolver.setAddress(string2bytes32("Node"), node.address);
  await resolver.setAddress(string2bytes32("Task"), task.address);
  await resolver.setAddress(
    string2bytes32("ChainStorage"),
    chainStorage.address
  );
  // refreshCache
  await file.refreshCache();
  await user.refreshCache();
  await node.refreshCache();
  await task.refreshCache();
  await monitor.refreshCache();
  await chainStorage.refreshCache();

  // setup setting
  await setting.setReplica(replica);
  await setting.setMaxUserExtLength(MaxLength);
  await setting.setMaxNodeExtLength(MaxLength);
  await setting.setMaxMonitorExtLength(MaxLength);
  await setting.setMaxFileExtLength(MaxLength);
  await setting.setInitSpace(UserStorageTotal);
  await setting.setMaxCidLength(MaxLength);
  await setting.setAdmin(deployerAddress);
  await setting.setTaskAcceptTimeout(TaskAcceptTimeout);
  await setting.setAddFileTaskTimeout(AddFileTaskTimeout);
  await setting.setDeleteFileTaskTimeout(DeleteFileTaskTimeout);
  await setting.setAddFileProgressTimeout(AddFileProgressTimeout);

  let address;
  // create users
  for (let i = 0; i < userNumber; i++) {
    users.push(accounts[i]);
    address = await accounts[i].getAddress();
    userAddresses.push(address);
    await chainStorage.connect(accounts[i]).userRegister(UserExt);
  }

  // create nodes
  const accountNumber = accounts.length;
  for (let i = accountNumber - 1; i > accountNumber - 1 - nodeNumber; i--) {
    nodes.push(accounts[i]);
    address = await accounts[i].getAddress();
    nodeAddresses.push(address);
    await chainStorage
      .connect(accounts[i])
      .nodeRegister(NodeStorageTotal, NodeExt);
  }
  // node online
  for (
    let i = accountNumber - 1;
    i > accountNumber - 1 - onlineNodeNumber;
    i--
  ) {
    await chainStorage.connect(accounts[i]).nodeOnline();
  }

  // create monitors
  for (let i = 0; i < monitorNumber; i++) {
    monitors.push(accounts[i]);
    address = await accounts[i].getAddress();
    monitorAddresses.push(address);
    await chainStorage.connect(accounts[i]).monitorRegister(MonitorExt);
  }
  // monitor online
  for (let i = 0; i < onlineMonitorNumber; i++) {
    await chainStorage.connect(accounts[i]).monitorOnline();
  }
}

export async function dumpTask(ctx: any, from: any, to: any) {
  console.log("================task[" + from + ", " + to + "]================");
  let task;
  for (let i = from; i <= to; i++) {
    task = await ctx.taskStorage.getTask(i);
    console.log(
      "task[" +
        i +
        "]:" +
        task[0] +
        "," +
        task[1] +
        "," +
        task[2] +
        "," +
        task[3] +
        "," +
        task[4]
    );
  }
  console.log("\n");
}

export async function dumpTaskState(ctx: any, from: any, to: any) {
  console.log(
    "================taskState[" + from + ", " + to + "]================"
  );

  console.log(
    "status, createBlockNumber, createTime, acceptTime, acceptTimeoutTime, finishTime, failTime, timeoutTime"
  );

  let taskState;
  for (let i = from; i <= to; i++) {
    taskState = await ctx.taskStorage.getTaskState(i);
    console.log(
      "taskState[" +
        i +
        "]:(" +
        taskState[0] +
        ", " +
        taskState[1] +
        ", " +
        taskState[2] +
        ", " +
        taskState[3] +
        ", " +
        taskState[4] +
        ", " +
        taskState[5] +
        ", " +
        taskState[6] +
        ", " +
        taskState[7] +
        ")"
    );
  }
  console.log("\n");
}
