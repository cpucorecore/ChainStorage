pragma solidity ^0.5.2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract FileStorage is ExternalStorage, IFileStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct File {
        uint256 status;
        uint256 size;
        EnumerableSet.AddressSet users;
        EnumerableSet.AddressSet nodes;
    }

    mapping(string => File) private cid2file;
    uint256 private totalSize;
    uint256 private totalFileNumber;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function newFile(string calldata cid) external {
        mustManager(managerName);

        EnumerableSet.AddressSet memory users;
        EnumerableSet.AddressSet memory nodes;
        cid2file[cid] = File(DefaultStatus, 0, users, nodes);
    }

    function deleteFile(string calldata cid) external {
        mustManager(managerName);
        totalFileNumber = totalFileNumber.sub(1);
        delete cid2file[cid];
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return cid2file[cid].size;
    }

    function setSize(string calldata cid, uint256 size) external {
        mustManager(managerName);
    }

    function getStatus(string calldata cid) external view returns (uint256) {
        return cid2file[cid].status;
    }

    function setStatus(string calldata cid, uint256 status) external {
        cid2file[cid].status = status;
    }

    function userExist(string calldata cid, address userAddress) external view returns (bool) {
        return cid2file[cid].users.contains(userAddress);
    }

    function userEmpty(string calldata cid) external view returns (bool) {
        return 0 == cid2file[cid].users.length();
    }

    function addUser(string calldata cid, address userAddress) external {
        mustManager(managerName);
        cid2file[cid].users.add(userAddress);
    }

    function deleteUser(string calldata cid, address userAddress) external {
        mustManager(managerName);
        cid2file[cid].users.remove(userAddress);
    }

    function getUsers(string calldata cid) external view returns (address[] memory) {
        EnumerableSet.AddressSet storage users = cid2file[cid].users;
        uint256 count = users.length();
        address[] memory result = new address[](count);
        for(uint256 i=0; i<count; i++) {
            result[i] = users.at(i);
        }
        return result;
    }

    function getUsers(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        EnumerableSet.AddressSet storage users = cid2file[cid].users;
        Paging.Page memory page = Paging.getPage(users.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = users.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function nodeExist(string calldata cid, address nodeAddress) external view returns (bool) {
        return cid2file[cid].nodes.contains(nodeAddress);
    }

    function nodeEmpty(string calldata cid) external view returns (bool) {
        return 0 == cid2file[cid].nodes.length();
    }

    function addNode(string calldata cid, address nodeAddress) external {
        mustManager(managerName);
        cid2file[cid].nodes.add(nodeAddress);
    }

    function addNodes(string calldata cid, address[] calldata nodeAddresses) external {
        for(uint i=0; i<nodeAddresses.length; i++) {
            cid2file[cid].nodes.add(nodeAddresses[i]);
        }
    }

    function deleteNode(string calldata cid, address nodeAddress) external {
        mustManager(managerName);
        cid2file[cid].nodes.remove(nodeAddress);
    }

    function getNodes(string calldata cid) external view returns (address[] memory) {
        EnumerableSet.AddressSet storage nodes = cid2file[cid].nodes;
        uint256 count = nodes.length();
        address[] memory result = new address[](count);
        for(uint256 i=0; i<count; i++) {
            result[i] = nodes.at(i);
        }
        return result;
    }

    function getNodes(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        EnumerableSet.AddressSet storage nodes = cid2file[cid].nodes;
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
