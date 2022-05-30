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

    struct FileItem {
        string cid;
        uint256 createTime;
        uint256 duration;
        string ext;
    }

    struct UserItem {
        StorageSpaceManager.StorageSpace storageSpace;
        EnumerableSet.Bytes32Set cidHashes;
        uint256 invalidAddFileCount;
        string ext;
    }

    mapping(address=>UserItem) private users;
    mapping(address=>mapping(bytes32=>FileItem)) files;
    uint256 private totalUserNumber;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function newUser(address userAddress, uint256 storageTotal, string calldata ext) external {
        mustManager(managerName);
        EnumerableSet.Bytes32Set memory cidHashes;
        users[userAddress] = UserItem(StorageSpaceManager.StorageSpace(0, storageTotal), cidHashes, 0, ext);
        totalUserNumber = totalUserNumber.add(1);
    }

    function deleteUser(address userAddress) external {
        mustManager(managerName);
        delete users[userAddress];
        totalUserNumber = totalUserNumber.sub(1);
    }

    function setExt(address userAddress, string calldata ext) external {
        mustManager(managerName);
        users[userAddress].ext = ext;
    }

    function setStorageTotal(address userAddress, uint256 size) external {
        mustManager(managerName);
        users[userAddress].storageSpace.total = size;
    }

    function useStorage(address userAddress, uint256 size, bool checkSpaceEnough) external {
        mustManager(managerName);
        users[userAddress].storageSpace.useSpace(size, checkSpaceEnough);
    }

    function freeStorage(address userAddress, uint256 size) external {
        mustManager(managerName);
        users[userAddress].storageSpace.unUseSpace(size);
    }

    function exist(address userAddress) public view returns (bool) {
        return users[userAddress].storageSpace.total > 0;
    }

    function getExt(address userAddress) external view returns (string memory) {
        return users[userAddress].ext;
    }

    function availableSpace(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.availableSpace();
    }

    function getStorageTotal(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.total;
    }

    function getStorageUsed(address userAddress) external view returns (uint256) {
        return users[userAddress].storageSpace.used;
    }

    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash] = FileItem(cid, now, duration, ext);
        users[userAddress].cidHashes.add(cidHash);
    }

    function deleteFile(address userAddress, string calldata cid) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        users[userAddress].cidHashes.remove(cidHash);
        delete files[userAddress][cidHash];
    }

    function setFileExt(address userAddress, string calldata cid, string calldata ext) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash].ext = ext;
    }

    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[userAddress][cidHash].duration = duration;
    }

    function upInvalidAddFileCount(address userAddress) external returns (uint256) {
        mustManager(managerName);
        users[userAddress].invalidAddFileCount = users[userAddress].invalidAddFileCount.add(1);
        return users[userAddress].invalidAddFileCount;
    }

    function fileExist(address userAddress, string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return users[userAddress].cidHashes.contains(cidHash);
    }

    function getFileExt(address userAddress, string calldata cid) external view returns (string memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        return files[userAddress][cidHash].ext;
    }

    function getFileDuration(address userAddress, string calldata cid) external view returns (uint256) {
        bytes32 cidHash = keccak256(bytes(cid));
        return files[userAddress][cidHash].duration;
    }

    function getFileNumber(address userAddress) external view returns (uint256) {
        return users[userAddress].cidHashes.length();
    }

    function getCids(address userAddress, uint256 pageSize, uint256 pageNumber) public view returns (string[] memory, bool) {
        EnumerableSet.Bytes32Set storage userCidHashes = users[userAddress].cidHashes;
        Paging.Page memory page = Paging.getPage(userCidHashes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        string[] memory result = new string[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = files[userAddress][userCidHashes.at(start+i)].cid;
        }
        return (result, page.totalPages == page.pageNumber);
    }

    function getFileItem(address userAddress, string calldata cid) external view returns (string memory, uint256, uint256, string memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        FileItem storage file = files[userAddress][cidHash];
        return (file.cid, file.createTime, file.duration, file.ext);
    }

    function getInvalidAddFileCount(address userAddress) external view returns (uint256) {
        return users[userAddress].invalidAddFileCount;
    }

    function getTotalUserNumber() external view returns (uint256) {
        return totalUserNumber;
    }
}
