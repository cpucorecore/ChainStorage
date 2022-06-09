pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IUserStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";
import "./lib/StorageSpaceManager.sol";

contract UserStorage is ExternalStorage, IUserStorage {
    using StorageSpaceManager for StorageSpaceManager.StorageSpace;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct File {
        string cid;
        uint256 createTime;
        uint256 duration;
        string ext;
    }

    struct User {
        StorageSpaceManager.StorageSpace storageSpace;
        EnumerableSet.Bytes32Set cidHashes;
        string ext;
    }

    mapping(address => User) private users;
    EnumerableSet.AddressSet private userAddresses;
    mapping(address => mapping(bytes32 => File)) private files;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function exist(address userAddress) public view returns (bool) {
        return users[userAddress].storageSpace.total > 0;
    }

    function newUser(address userAddress, uint256 storageTotal, string calldata ext) external {
        mustManager(managerName);
        EnumerableSet.Bytes32Set memory cidHashes;
        users[userAddress] = User(StorageSpaceManager.StorageSpace(0, storageTotal), cidHashes, ext);
        userAddresses.add(userAddress);
    }

    function deleteUser(address userAddress) external {
        mustManager(managerName);
        delete users[userAddress];
        userAddresses.remove(userAddress);
    }

    function setExt(address userAddress, string calldata ext) external {
        mustManager(managerName);
        users[userAddress].ext = ext;
    }

    function getExt(address userAddress) external view returns (string memory) {
        return users[userAddress].ext;
    }

    function setStorageTotal(address userAddress, uint256 size) external {
        mustManager(managerName);
        users[userAddress].storageSpace.total = size;
    }

    function getStorageTotal(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.total;
    }

    function useStorage(address userAddress, uint256 size, bool checkSpaceEnough) external {
        mustManager(managerName);
        users[userAddress].storageSpace.useSpace(size, checkSpaceEnough);
    }

    function freeStorage(address userAddress, uint256 size) external {
        mustManager(managerName);
        users[userAddress].storageSpace.freeSpace(size);
    }

    function availableSpace(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.availableSpace();
    }

    function getStorageUsed(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.used;
    }

    function getUserCount() external view returns (uint256) {
        return userAddresses.length();
    }

    function getAllUserAddresses() external view returns (address[] memory) {
        return userAddresses.values();
    }

    function getAllUserAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(userAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = userAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function fileExist(address userAddress, string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return users[userAddress].cidHashes.contains(cidHash);
    }

    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash] = File(cid, now, duration, ext);
        users[userAddress].cidHashes.add(cidHash);
    }

    function deleteFile(address userAddress, string calldata cid) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        delete files[userAddress][cidHash];
        users[userAddress].cidHashes.remove(cidHash);
    }

    function setFileExt(address userAddress, string calldata cid, string calldata ext) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash].ext = ext;
    }

    function getFileExt(address userAddress, string calldata cid) external view returns (string memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        return files[userAddress][cidHash].ext;
    }

    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash].duration = duration;
    }

    function getFileDuration(address userAddress, string calldata cid) external view returns (uint256) {
        bytes32 cidHash = keccak256(bytes(cid));
        return files[userAddress][cidHash].duration;
    }

    function getFileInfo(address userAddress, string calldata cid) external view returns (uint256, uint256, string memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        File storage file = files[userAddress][cidHash];
        return (file.createTime, file.duration, file.ext);
    }

    function getFileCount(address userAddress) external view returns (uint256) {
        return users[userAddress].cidHashes.length();
    }

    function getFiles(address userAddress, uint256 pageSize, uint256 pageNumber) public view returns (string[] memory, bool) {
        EnumerableSet.Bytes32Set storage cidHashes = users[userAddress].cidHashes;
        Paging.Page memory page = Paging.getPage(cidHashes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        string[] memory result = new string[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = files[userAddress][cidHashes.at(start+i)].cid;
        }
        return (result, page.totalPages == page.pageNumber);
    }
}
