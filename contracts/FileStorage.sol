pragma solidity ^0.5.2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract FileStorage is ExternalStorage, IFileStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct FileItem {
        bool exist;
        EnumerableSet.AddressSet users;
        EnumerableSet.AddressSet nodes;
    }

    mapping(string=>FileItem) private cid2fileItem;
    mapping(bytes32=>string) private cidHash2cid;
    mapping(string=>uint256) private cid2size;
    uint256 private totalSize;
    uint256 private totalFileNumber;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function exist(string memory cid) public view returns (bool) {
        return cid2fileItem[cid].exist;
    }

    function newFile(string calldata cid) external {
        mustManager(managerName);

        EnumerableSet.AddressSet memory users;
        EnumerableSet.AddressSet memory nodes;
        cid2fileItem[cid] = FileItem(true, users, nodes);

        bytes32 cidHash = keccak256(bytes(cid));
        cidHash2cid[cidHash] = cid;
        totalFileNumber = totalFileNumber.add(1);
    }

    function deleteFile(string calldata cid) external {
        mustManager(managerName);
        totalFileNumber = totalFileNumber.sub(1);
        delete cid2fileItem[cid];
    }

    function getCidByHash(bytes32 hash) external view returns (string memory) {
        return cidHash2cid[hash];
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return cid2size[cid];
    }

    function setSize(string calldata cid, uint256 size) external {
        mustManager(managerName);
        cid2size[cid] = size;
    }

    function userExist(string calldata cid, address userAddress) external view returns (bool) {
        return cid2fileItem[cid].users.contains(userAddress);
    }

    function userEmpty(string calldata cid) external view returns (bool) {
        return 0 == cid2fileItem[cid].users.length();
    }

    function addUser(string calldata cid, address userAddress) external {
        mustManager(managerName);
        cid2fileItem[cid].users.add(userAddress);
    }

    function deleteUser(string calldata cid, address userAddress) external {
        mustManager(managerName);
        cid2fileItem[cid].users.remove(userAddress);
    }

    function getUsers(string calldata cid) external view returns (address[] memory) {
        EnumerableSet.AddressSet storage users = cid2fileItem[cid].users;
        uint256 count = users.length();
        address[] memory result = new address[](count);
        for(uint256 i=0; i<count; i++) {
            result[i] = users.at(i);
        }
        return result;
    }

    function getUsers(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        EnumerableSet.AddressSet storage users = cid2fileItem[cid].users;
        Paging.Page memory page = Paging.getPage(users.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = users.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function nodeExist(string calldata cid, address nodeAddress) external view returns (bool) {
        return cid2fileItem[cid].nodes.contains(nodeAddress);
    }

    function nodeEmpty(string calldata cid) external view returns (bool) {
        return 0 == cid2fileItem[cid].nodes.length();
    }

    function addNode(string calldata cid, address nodeAddress) external {
        mustManager(managerName);
        cid2fileItem[cid].nodes.add(nodeAddress);
    }

    function deleteNode(string calldata cid, address nodeAddress) external {
        mustManager(managerName);
        cid2fileItem[cid].nodes.remove(nodeAddress);
    }

    function getNodes(string calldata cid) external view returns (address[] memory) {
        EnumerableSet.AddressSet storage nodes = cid2fileItem[cid].nodes;
        uint256 count = nodes.length();
        address[] memory result = new address[](count);
        for(uint256 i=0; i<count; i++) {
            result[i] = nodes.at(i);
        }
        return result;
    }

    function getNodes(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        EnumerableSet.AddressSet storage nodes = cid2fileItem[cid].nodes;
        Paging.Page memory page = Paging.getPage(nodes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = nodes.at(start+i);
        }
        return (result, page.totalPages == page.pageNumber);
    }

    function getTotalSize() external view returns (uint256) {
        return totalSize;
    }

    function upTotalSize(uint256 size) external returns (uint256) {
        totalSize = totalSize.add(size);
        return totalSize;
    }

    function downTotalSize(uint256 size) external returns (uint256) {
        totalSize = totalSize.sub(size);
        return totalSize;
    }

    function getTotalFileNumber() external view returns (uint256) {
        return totalFileNumber;
    }
}
