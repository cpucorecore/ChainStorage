pragma solidity ^0.5.2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract FileStorage is ExternalStorage, IFileStorage {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct File {
        uint256 status;
        uint256 statusTime;
        uint256 size;
        uint256 replica;
        EnumerableSet.AddressSet users;
        EnumerableSet.AddressSet nodes;
    }

    mapping(string => File) private cid2file;
    mapping(bytes32 => string) private cidHash2cid;
    EnumerableSet.Bytes32Set private cidHashes;
    uint256 private totalSize;
    mapping(string => address) private cid2lastUser;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function exist(string calldata cid) external view returns (bool) {
        return DefaultStatus != cid2file[cid].status;
    }

    function newFile(string calldata cid, uint256 replica) external {
        mustManager(managerName);

        EnumerableSet.AddressSet memory users;
        EnumerableSet.AddressSet memory nodes;
        cid2file[cid] = File(FileTryAdd, now, 0, replica, users, nodes);

        bytes32 cidHash = keccak256(bytes(cid));
        cidHash2cid[cidHash] = cid;
        if (!cidHashes.contains(cidHash)) {
            cidHashes.add(cidHash);
        }
    }

    function deleteFile(string calldata cid) external {
        mustManager(managerName);

        bytes32 cidHash = keccak256(bytes(cid));
        if (cidHashes.contains(cidHash)) {
            cidHashes.remove(cidHash);
        }
        delete cidHash2cid[cidHash];
        delete cid2file[cid];
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return cid2file[cid].size;
    }

    function setSize(string calldata cid, uint256 size) external {
        mustManager(managerName);
        cid2file[cid].size = size;
    }

    function getReplica(string calldata cid) external view returns (uint256) {
        return cid2file[cid].replica;
    }

    function getStatus(string calldata cid) external view returns (uint256) {
        return cid2file[cid].status;
    }

    function getStatusTime(string calldata cid) external view returns (uint256) {
        return cid2file[cid].statusTime;
    }

    function setStatus(string calldata cid, uint256 status) external {
        cid2file[cid].status = status;
        cid2file[cid].statusTime = now;
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

    function addTotalSize(uint256 size) external {
        totalSize = totalSize.add(size);
    }

    function subTotalSize(uint256 size) external {
        totalSize = totalSize.sub(size);
    }

    function getTotalSize() external view returns (uint256) {
        return totalSize;
    }

    function getFileCount() external view returns (uint256) {
        return cidHashes.length();
    }

    function getCid(bytes32 cidHash) external view returns (string memory) {
        return cidHash2cid[cidHash];
    }

    function setLastUser(string calldata cid, address lastUser) external {
        cid2lastUser[cid] = lastUser;
    }

    function getLastUser(string calldata cid) external view returns (address) {
        return cid2lastUser[cid];
    }
}
