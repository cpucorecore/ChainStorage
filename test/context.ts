import { ethers } from "hardhat";
import { Signer } from "ethers";
// const Web3Utils = require("web3-utils");
import { fromAscii, padRight } from "web3-utils";
// eslint-disable-next-line node/no-missing-import
import {
  ChainStorage,
  FileStorage,
  MonitorStorage,
  NodeSelectorForTest,
  NodeStorage,
  TaskStorage,
  UserStorage,
  // eslint-disable-next-line node/no-missing-import
} from "../typechain";

export const NodeStorageTotal = 1024 * 1024 * 1024 * 100;
export const UserStorageTotal = 1024 * 1024 * 1024 * 5;
export const MaxLength = 1024;
export let Replica: any = 2;
export const Duration = 3600;
export const NodeExt = "nodeExt";
export const UserExt = "userExt";
export const MonitorExt = "monitorExt";
export const FileExt = "fileExt";
export const FileSize = 1111;
export const Cid = "QmeN6JUjRSZJgdQFjFMX9PHwAFueWbRecLKBZgcqYLboir";
export const Cids = [
  "QmWAJk3wmp8jqTWp2dQ3NRdoBjnmvupdL2GiBqt69FFk2H", // hash: 0xdda4e1efafe56f53f4025cd0708f6bdff673e1aa3995eea9f023c6eec2a7eb4a
  "QmUgU1m8wtsiyfXnKJn6yMP66zph5X716GZqjqYrZWsLjf", // hash: 0xf8af37dd2f20cebb5f9720a4c63a7ceaa036a5042a30b87a19832e0fa530c84c
  "QmRnCyTbu47hdg173ja4j8xUoEZ5MjRHT6yqDMSqtqXHhF", // hash: 0xd4a832f0884972948d6eee2c2daa0e91def2d4bd5f4f899c9eda1d78a28a9b44
  "QmbZU93HjXLn5wseFjCLyw1tM5BDoitSiZfR5o3Jo6C6tN", // hash: 0x68fc51c0de0c0e6be1067b90862da21f2e796b933851e5aaecf9d1d6f6ff332b
  "QmeN6JUjRSZJgdQFjFMX9PHwAFueWbRecLKBZgcqYLboir", // hash: 0x5ef8d464eb9a1baaf9c52ccfef2262fda94bd65cc559526f90e9ea37e73b2068
];

export const TaskAcceptTimeout = 3600;
export const AddFileTaskTimeout = 3600 * 24;
export const DeleteFileTaskTimeout = 60 * 10;
export const AddFileProgressTimeout = 60 * 10;

export let nodeSelectorForTest: NodeSelectorForTest;

export let chainStorage: ChainStorage;
export let nodeStorage: NodeStorage;
export let fileStorage: FileStorage;
export let monitorStorage: MonitorStorage;
export let userStorage: UserStorage;
export let taskStorage: TaskStorage;

export const users: Signer[] = [];
export const nodes: Signer[] = [];
export const monitors: Signer[] = [];

export const userAddresses: string[] = [];
export const nodeAddresses: string[] = [];
export const monitorAddresses: string[] = [];
export let accounts: Signer[] = [];
export const accountAddresses: string[] = [];
export let deployer: Signer;
export let deployerAddress: string;

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
  for (const signer of accounts) {
    accountAddresses.push(await signer.getAddress());
  }
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
  fileStorage = await FileStorage.deploy(file.address);
  await fileStorage.deployed();
  // file setStorage
  await file.setStorage(fileStorage.address);
  // deploy Monitor
  const Monitor = await ethers.getContractFactory("Monitor");
  const monitor = await Monitor.deploy(resolver.address);
  await monitor.deployed();
  // deploy MonitorStorage
  const MonitorStorage = await ethers.getContractFactory("MonitorStorage");
  monitorStorage = await MonitorStorage.deploy(monitor.address);
  await monitorStorage.deployed();
  // monitor setStorage
  await monitor.setStorage(monitorStorage.address);
  // deploy User
  const User = await ethers.getContractFactory("User");
  const user = await User.deploy(resolver.address);
  await user.deployed();
  // deploy UserStorage
  const UserStorage = await ethers.getContractFactory("UserStorage");
  userStorage = await UserStorage.deploy(user.address);
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
  taskStorage = await TaskStorage.deploy(task.address);
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
  deployer = accounts[0];
  deployerAddress = await deployer.getAddress();
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

export const increaseTime = async (seconds: number) => {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
};

let snapshotId: string = "0x1";
export async function takeSnapshot() {
  snapshotId = await ethers.provider.send("evm_snapshot", []);
}

export async function revertToSnapshot() {
  await ethers.provider.send("evm_revert", [snapshotId]);
}

export async function dumpTask(from: any, to: any) {
  console.log("================task[" + from + ", " + to + "]================");

  console.log("\tuser, action, node, noCallback, cid");

  let task;
  for (let i = from; i <= to; i++) {
    task = await taskStorage.getTask(i);
    console.log(
      "task[" +
        i +
        "]:(" +
        task[0] +
        ", " +
        task[1] +
        ", " +
        task[2] +
        ", " +
        task[3] +
        ", " +
        task[4] +
        ")"
    );
  }
  console.log("\n");
}

export async function dumpTaskState(from: any, to: any) {
  console.log(
    "================taskState[" + from + ", " + to + "]================"
  );

  console.log(
    "\tstatus, createBlockNumber, createTime, acceptTime, acceptTimeoutTime, finishTime, failTime, timeoutTime"
  );

  let taskState;
  for (let i = from; i <= to; i++) {
    taskState = await taskStorage.getTaskState(i);
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
