import { ethers } from "hardhat";
import { Signer } from "ethers";
// const Web3Utils = require("web3-utils");
import { fromAscii, padRight } from "web3-utils";
// eslint-disable-next-line node/no-missing-import
import {
  Setting,
  ChainStorage,
  FileStorage,
  NodeStorage,
  UserManager,
  UserStorage,
  Blacklist,
  NodeManager,
  // eslint-disable-next-line node/no-missing-import
} from "../typechain";

export const NodeStorageTotal = 1024 * 1024 * 1024 * 100;
export const UserStorageTotal = 1024 * 1024 * 1024 * 5;
export const MaxNodeCanAddFileCount = 4;
export const MaxNodeCanDeleteFileCount = 4;
export const MaxLength = 1024;
export let Replica: any = 2;
export const Duration = 3600;
export const NodeExt = "nodeExt";
export const UserExt = "userExt";
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
export const CidHashes = [
  "0xdda4e1efafe56f53f4025cd0708f6bdff673e1aa3995eea9f023c6eec2a7eb4a",
  "0xf8af37dd2f20cebb5f9720a4c63a7ceaa036a5042a30b87a19832e0fa530c84c",
  "0xd4a832f0884972948d6eee2c2daa0e91def2d4bd5f4f899c9eda1d78a28a9b44",
  "0x68fc51c0de0c0e6be1067b90862da21f2e796b933851e5aaecf9d1d6f6ff332b",
  "0x5ef8d464eb9a1baaf9c52ccfef2262fda94bd65cc559526f90e9ea37e73b2068",
];

export let setting: Setting;
export let blacklist: Blacklist;
export let chainStorage: ChainStorage;
export let nodeManager: NodeManager;
export let nodeStorage: NodeStorage;
export let fileStorage: FileStorage;
export let userManager: UserManager;
export let userStorage: UserStorage;

export const users: Signer[] = [];
export const nodes: Signer[] = [];

export const userAddresses: string[] = [];
export const nodeAddresses: string[] = [];
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
  // deploy Blacklist
  const Blacklist = await ethers.getContractFactory("Blacklist");
  blacklist = await Blacklist.deploy(resolver.address);
  await blacklist.deployed();
  // deploy Setting
  const Setting = await ethers.getContractFactory("Setting");
  setting = await Setting.deploy();
  await setting.deployed();
  // deploy SettingStorage
  const SettingStorage = await ethers.getContractFactory("SettingStorage");
  const settingStorage = await SettingStorage.deploy(setting.address);
  await settingStorage.deployed();
  // setting setStorage
  await setting.setStorage(settingStorage.address);
  // deploy File
  const FileManager = await ethers.getContractFactory("FileManager");
  const fileManager = await FileManager.deploy(resolver.address);
  await fileManager.deployed();
  // deploy FileStorage
  const FileStorage = await ethers.getContractFactory("FileStorage");
  fileStorage = await FileStorage.deploy(fileManager.address);
  await fileStorage.deployed();
  // fileManager setStorage
  await fileManager.setStorage(fileStorage.address);
  // deploy User
  const UserManager = await ethers.getContractFactory("UserManager");
  userManager = await UserManager.deploy(resolver.address);
  await userManager.deployed();
  // deploy UserStorage
  const UserStorage = await ethers.getContractFactory("UserStorage");
  userStorage = await UserStorage.deploy(userManager.address);
  await userStorage.deployed();
  // user setStorage
  await userManager.setStorage(userStorage.address);
  // deploy Node
  const NodeManager = await ethers.getContractFactory("NodeManager");
  nodeManager = await NodeManager.deploy(resolver.address);
  await nodeManager.deployed();
  // deploy NodeStorage
  const NodeStorage = await ethers.getContractFactory("NodeStorage");
  nodeStorage = await NodeStorage.deploy(nodeManager.address);
  await nodeStorage.deployed();
  // nodeManager setStorage
  await nodeManager.setStorage(nodeStorage.address);
  // deploy ChainStorage
  const ChainStorage = await ethers.getContractFactory("ChainStorage");
  chainStorage = await ChainStorage.deploy();
  await chainStorage.deployed();
  // chainStorage initialize
  await chainStorage.initialize(resolver.address);
  // resolver set addresses
  deployer = accounts[0];
  deployerAddress = await deployer.getAddress();
  await resolver.setAddress(string2bytes32("Admin"), deployerAddress);
  await resolver.setAddress(string2bytes32("Setting"), setting.address);
  await resolver.setAddress(string2bytes32("Blacklist"), blacklist.address);
  await resolver.setAddress(string2bytes32("FileManager"), fileManager.address);
  await resolver.setAddress(string2bytes32("UserManager"), userManager.address);
  await resolver.setAddress(string2bytes32("NodeManager"), nodeManager.address);
  await resolver.setAddress(
    string2bytes32("ChainStorage"),
    chainStorage.address
  );
  // refreshCache
  await fileManager.refreshCache();
  await userManager.refreshCache();
  await nodeManager.refreshCache();
  await chainStorage.refreshCache();
  await blacklist.refreshCache();

  // setup setting
  await setting.setReplica(replica);
  await setting.setMaxUserExtLength(MaxLength);
  await setting.setMaxNodeExtLength(MaxLength);
  await setting.setMaxFileExtLength(MaxLength);
  await setting.setInitSpace(UserStorageTotal);
  await setting.setMaxCidLength(MaxLength);
  await setting.setAdmin(deployerAddress);
  await setting.setMaxNodeCanAddFileCount(MaxNodeCanAddFileCount);
  await setting.setMaxNodeCanDeleteFileCount(MaxNodeCanDeleteFileCount);

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
}

let _nodeNumber: any = 0;
export async function registerNodes(nodeNumber: any) {
  if (nodes.length + nodeNumber > accounts.length) {
    nodeNumber = accounts.length - nodes.length;
  }
  if (nodeNumber === 0) return;
  if (_nodeNumber === 0) {
    _nodeNumber = nodeNumber;
  } else {
    _nodeNumber += nodeNumber;
  }

  const from = accounts.length - nodes.length - 1; // from > to
  const to = from - nodeNumber + 1;

  for (let i = from; i >= to; i--) {
    const node = accounts[i];
    const nodeAddress = await node.getAddress();
    nodes.push(node);
    nodeAddresses.push(nodeAddress);
    await chainStorage.connect(node).nodeRegister(NodeStorageTotal, NodeExt);
  }
}

export async function revertNodes() {
  for (let i = 0; i < _nodeNumber; i++) {
    nodes.pop();
    nodeAddresses.pop();
  }
  _nodeNumber = 0;
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

export async function dumpFile(cid: string) {
  console.log("fileCount: " + (await fileStorage.getFileCount()));
  console.log("totalFileSize: " + (await fileStorage.getTotalSize()));
  console.log("status: " + (await fileStorage.getStatus(cid)));
  console.log("replica: " + (await fileStorage.getReplica(cid)));
  console.log(
    "cid[" + cid + "] users: " + (await fileStorage["getUsers(string)"](cid))
  );
  console.log(
    "cid[" + cid + "] nodes: " + (await fileStorage["getNodes(string)"](cid))
  );
}

export async function dumpNode(cid: string) {
  console.log(
    "canAddFileNodeAddresses: ",
    await nodeStorage.getCanAddFileNodeAddresses(cid)
  );
}
