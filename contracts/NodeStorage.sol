pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";
import "./lib/StorageSpaceManager.sol";

contract NodeStorage is ExternalStorage, INodeStorage {
    using StorageSpaceManager for StorageSpaceManager.StorageSpace;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct File {
        uint256 size;
        bool isAdded;
        bool isDeleted;
    }

    struct Node {
        StorageSpaceManager.StorageSpace storageSpace;
        EnumerableSet.Bytes32Set cidHashes;
        string ext;
    }

    mapping(address => Node) private nodes;
    EnumerableSet.AddressSet private nodeAddresses;
    mapping(address => mapping(bytes32 => File)) private files;

    mapping(string => EnumerableSet.AddressSet) private cid2nodeAddresses;
    mapping(address => EnumerableSet.Bytes32Set) private node2cidHashes;

    // for addFile
    mapping(string => EnumerableSet.AddressSet) private cid2canAddFileNodeAddresses;

    // for deleteFile
    mapping(string => EnumerableSet.AddressSet) private cid2canDeleteFileNodeAddresses;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function exist(address nodeAddress) public view returns (bool) {
        return nodes[nodeAddress].storageSpace.total > 0;
    }

    function newNode(address nodeAddress, uint256 storageTotal, string calldata ext) external {
        mustManager(managerName);
        EnumerableSet.Bytes32Set memory cidHashes;
        nodes[nodeAddress] = Node(StorageSpaceManager.StorageSpace(0, storageTotal), cidHashes, ext);
        nodeAddresses.add(nodeAddress);
    }

    function deleteNode(address nodeAddress) external {
        mustManager(managerName);
        delete nodes[nodeAddress];
        nodeAddresses.remove(nodeAddress);
    }

    function setExt(address nodeAddress, string calldata ext) external {
        mustManager(managerName);
        nodes[nodeAddress].ext = ext;
    }

    function getExt(address nodeAddress) external view returns (string memory) {
        return nodes[nodeAddress].ext;
    }

    function setStorageTotal(address nodeAddress, uint256 value) external {
        mustManager(managerName);
        nodes[nodeAddress].storageSpace.total = value;
    }

    function useStorage(address nodeAddress, uint256 size) external {
        nodes[nodeAddress].storageSpace.useSpace(size, true);
    }

    function freeStorage(address nodeAddress, uint256 size) external {
        nodes[nodeAddress].storageSpace.freeSpace(size);
    }

    function availableSpace(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].storageSpace.availableSpace();
    }

    function getStorageTotal(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].storageSpace.total;
    }

    function getStorageUsed(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].storageSpace.used;
    }

    function getNodeCount() external view returns (uint256) {
        return nodeAddresses.length();
    }

    function getAllNodeAddresses() external view returns (address[] memory) {
        return nodeAddresses.values();
    }

    function getAllNodeAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(nodeAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = nodeAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function fileExist(address nodeAddress, string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return nodes[nodeAddress].cidHashes.contains(cidHash);
    }

    function addFile(address nodeAddress, string calldata cid, uint256 size) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        files[nodeAddress][cidHash] = File(size, false, false);
        nodes[nodeAddress].cidHashes.add(cidHash);
    }

    function deleteFile(address nodeAddress, string calldata cid) external {
        mustManager(managerName);
        bytes32 cidHash = keccak256(bytes(cid));
        delete files[nodeAddress][cidHash];
        nodes[nodeAddress].cidHashes.remove(cidHash);
    }

    /////////////////////////// [add,delete] file logic ////////////////////////////
    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external returns (uint256) {
        mustManager(managerName);

        if (!cid2canAddFileNodeAddresses[cid].contains(nodeAddress)) {
            cid2canAddFileNodeAddresses[cid].add(nodeAddress);
            files[nodeAddress][cid] = File(size, false, false);
        }
        return cid2canAddFileNodeAddresses[cid].length();
    }

    function isSizeConsistent(string calldata cid) external view returns (bool, uint256) {
        uint256 size = files[cid2canAddFileNodeAddresses[cid].at(0)][cid].size;

        for(uint256 i=1; i<cid2canAddFileNodeAddresses[cid].length(); i++) {
            if (size != files[cid2canAddFileNodeAddresses[cid].at(i)][cid].size) {
                return (false, 0);
            }
        }

        return (true, size);
    }

    function getCanAddFileNodeAddresses(string calldata cid) external view returns (address[] memory) {
        return cid2canAddFileNodeAddresses[cid].values();
    }

    function isCanAddFile(address nodeAddress, string calldata cid) external view returns (bool) {
        return cid2canAddFileNodeAddresses[cid].contains(nodeAddress);
    }

    function isFileAdded(address nodeAddress, string calldata cid) external view returns (bool) {
        return cid2nodeAddresses[cid].contains(nodeAddress);
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external returns (bool) {
        files[nodeAddress][cid].isAdded = true;
        if (!cid2nodeAddresses[cid].contains(nodeAddress)) {
            cid2nodeAddresses[cid].add(nodeAddress);
        }

        bytes32 cidHash = keccak256(bytes(cid));
        if (!node2cidHashes[nodeAddress].contains(cidHash)) {
            node2cidHashes[nodeAddress].add(cidHash);
        }

        bool allNodeFinishAddFile = true;
        for(uint i=0; i<cid2canAddFileNodeAddresses[cid].length(); i++) {
            if (false == files[cid2canAddFileNodeAddresses[cid].at(i)][cid].isAdded) {
                allNodeFinishAddFile = false;
            }
        }

        return allNodeFinishAddFile;
    }

    function getNodeAddresses(string memory cid) public view returns (address[] memory) {
        return cid2nodeAddresses[cid].values();
    }

    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external returns (bool) {
        mustManager(managerName);

        if (!cid2canDeleteFileNodeAddresses[cid].contains(nodeAddress)) {
            cid2canDeleteFileNodeAddresses[cid].add(nodeAddress);
        }

        address[] memory nodeAddresses = getNodeAddresses(cid);
        bool allNodeCanDeleteFile = true;
        for(uint i=0; i<nodeAddresses.length; i++) {
            if (!cid2canDeleteFileNodeAddresses[cid].contains(nodeAddresses[i])) {
                allNodeCanDeleteFile = false;
                break;
            }
        }

        return allNodeCanDeleteFile;
    }

    function getCanDeleteFileNodeAddresses(string calldata cid) external view returns (address[] memory) {
        return cid2canDeleteFileNodeAddresses[cid].values();
    }

    function nodeDeleteFile(address nodeAddress, string calldata cid) external returns (bool) {
        files[nodeAddress][cid].isDeleted = true;
        if (cid2nodeAddresses[cid].contains(nodeAddress)) {
            cid2nodeAddresses[cid].remove(nodeAddress);
        }

        bytes32 cidHash = keccak256(bytes(cid));
        if (node2cidHashes[nodeAddress].contains(cidHash)) {
            node2cidHashes[nodeAddress].remove(cidHash);
        }

        bool allNodeFinishDeleteFile = true;
        for(uint i=0; i<cid2canDeleteFileNodeAddresses[cid].length(); i++) {
            if (false == files[cid2canDeleteFileNodeAddresses[cid].at(i)][cid].isDeleted) {
                allNodeFinishDeleteFile = false;
            }
        }

        return allNodeFinishDeleteFile;
    }

    function getCidHashes(address nodeAddress) external view returns (bytes32[] memory) {
        return node2cidHashes[nodeAddress].values();
    }

    function getCidHashes(address nodeAddress, uint256 pageSize, uint256 pageNumber) external view returns (bytes32[] memory, bool) {
        Paging.Page memory page = Paging.getPage(node2cidHashes[nodeAddress].length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        bytes32[] memory result = new bytes32[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = node2cidHashes[nodeAddress].at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }
}
