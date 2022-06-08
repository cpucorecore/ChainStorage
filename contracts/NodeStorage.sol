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

    struct Node {
        StorageSpaceManager.StorageSpace storageSpace;
        EnumerableSet.Bytes32Set canAddFileCidHashes;
        EnumerableSet.Bytes32Set cidHashes;
        EnumerableSet.Bytes32Set canDeleteFileCidHashes;
        string ext;
    }

    mapping(address => Node) private nodes;
    EnumerableSet.AddressSet private nodeAddresses;
    mapping(address => mapping(bytes32 => uint256)) private files;

    mapping(bytes32 => EnumerableSet.AddressSet) private cidHash2canAddFileNodeAddresses;
    mapping(bytes32 => EnumerableSet.AddressSet) private cidHash2nodeAddresses;
    mapping(bytes32 => EnumerableSet.AddressSet) private cidHash2canDeleteFileNodeAddresses;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function exist(address nodeAddress) public view returns (bool) {
        return nodes[nodeAddress].storageSpace.total > 0;
    }

    function newNode(address nodeAddress, uint256 storageTotal, string calldata ext) external {
        mustManager(managerName);
        EnumerableSet.Bytes32Set memory canAddFileCidHashes;
        EnumerableSet.Bytes32Set memory cidHashes;
        EnumerableSet.Bytes32Set memory canDeleteFileCidHashes;
        nodes[nodeAddress] = Node(
            StorageSpaceManager.StorageSpace(0, storageTotal),
            canAddFileCidHashes,
            cidHashes,
            canDeleteFileCidHashes,
            ext
        );
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
        files[nodeAddress][cidHash] = size;
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

        bytes32 cidHash = keccak256(bytes(cid));
        if (!cidHash2canAddFileNodeAddresses[cidHash].contains(nodeAddress)) {
            cidHash2canAddFileNodeAddresses[cidHash].add(nodeAddress);
            files[nodeAddress][cidHash] = size;
        }
        if (!nodes[nodeAddress].canAddFileCidHashes.contains(cidHash)) {
            nodes[nodeAddress].canAddFileCidHashes.add(cidHash);
        }
        return cidHash2canAddFileNodeAddresses[cidHash].length();
    }

    function getCanAddFileCount(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].canAddFileCidHashes.length();
    }

    function getCanAddFileCidHashes(address nodeAddress) external view returns (bytes32[] memory) {
        return nodes[nodeAddress].canAddFileCidHashes.values();
    }

    function isSizeConsistent(string calldata cid) external view returns (bool, uint256) {
        bytes32 cidHash = keccak256(bytes(cid));
        uint256 size = files[cidHash2canAddFileNodeAddresses[cidHash].at(0)][cidHash];

        for(uint i=1; i<cidHash2canAddFileNodeAddresses[cidHash].length(); i++) {
            if (size != files[cidHash2canAddFileNodeAddresses[cidHash].at(i)][cidHash]) {
                return (false, 0);
            }
        }

        return (true, size);
    }

    function getCanAddFileNodeAddresses(string calldata cid) external view returns (address[] memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        return cidHash2canAddFileNodeAddresses[cidHash].values();
    }

    function isCanAddFile(address nodeAddress, string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return cidHash2canAddFileNodeAddresses[cidHash].contains(nodeAddress);
    }

    function isFileAdded(address nodeAddress, string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return cidHash2nodeAddresses[cidHash].contains(nodeAddress);
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external returns (bool) {
        mustManager(managerName);

        bytes32 cidHash = keccak256(bytes(cid));
        if (nodes[nodeAddress].canAddFileCidHashes.contains(cidHash)) {
            nodes[nodeAddress].canAddFileCidHashes.remove(cidHash);
        }

        if (!nodes[nodeAddress].cidHashes.contains(cidHash)) {
            nodes[nodeAddress].cidHashes.add(cidHash);
        }

        if (!cidHash2nodeAddresses[cidHash].contains(nodeAddress)) {
            cidHash2nodeAddresses[cidHash].add(nodeAddress);
        }

        bool allNodeFinishAddFile = true;
        address[] memory nodeAddresses = cidHash2canAddFileNodeAddresses[cidHash].values();
        for(uint i=0; i<nodeAddresses.length; i++) {
            if (!nodes[nodeAddresses[i]].cidHashes.contains(cidHash)) {
                allNodeFinishAddFile = false;
                break;
            }
        }

        return allNodeFinishAddFile;
    }

    function getNodeAddresses(string memory cid) public view returns (address[] memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        return cidHash2nodeAddresses[cidHash].values();
    }

    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external returns (bool) {
        mustManager(managerName);

        bytes32 cidHash = keccak256(bytes(cid));
        if (!cidHash2canDeleteFileNodeAddresses[cidHash].contains(nodeAddress)) {
            cidHash2canDeleteFileNodeAddresses[cidHash].add(nodeAddress);
        }

        if (!nodes[nodeAddress].canDeleteFileCidHashes.contains(cidHash)) {
            nodes[nodeAddress].canDeleteFileCidHashes.add(cidHash);
        }

        address[] memory nodeAddresses = getNodeAddresses(cid);
        bool allNodeCanDeleteFile = true;
        for(uint i=0; i<nodeAddresses.length; i++) {
            if (!cidHash2canDeleteFileNodeAddresses[cidHash].contains(nodeAddresses[i])) {
                allNodeCanDeleteFile = false;
                break;
            }
        }

        return allNodeCanDeleteFile;
    }

    function getCanDeleteFileCount(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].canDeleteFileCidHashes.length();
    }

    function getCanDeleteFileCidHashes(address nodeAddress) external view returns (bytes32[] memory) {
        return nodes[nodeAddress].canDeleteFileCidHashes.values();
    }

    function getCanDeleteFileNodeAddresses(string calldata cid) external view returns (address[] memory) {
        bytes32 cidHash = keccak256(bytes(cid));
        return cidHash2canDeleteFileNodeAddresses[cidHash].values();
    }

    function nodeDeleteFile(address nodeAddress, string calldata cid) external returns (bool) {
        mustManager(managerName);

        bytes32 cidHash = keccak256(bytes(cid));
        if (nodes[nodeAddress].cidHashes.contains(cidHash)) {
            nodes[nodeAddress].cidHashes.remove(cidHash);
        }

        if (cidHash2nodeAddresses[cidHash].contains(nodeAddress)) {
            cidHash2nodeAddresses[cidHash].remove(nodeAddress);
        }

        bool allNodeFinishDeleteFile = true;
        address[] memory nodeAddresses = cidHash2canDeleteFileNodeAddresses[cidHash].values();
        for(uint i=0; i<nodeAddresses.length; i++) {
            if (nodes[nodeAddresses[i]].cidHashes.contains(cidHash)) {
                allNodeFinishDeleteFile = false;
                break;
            }
        }

        return allNodeFinishDeleteFile;
    }

    function getCidHashes(address nodeAddress) external view returns (bytes32[] memory) {
        return nodes[nodeAddress].cidHashes.values();
    }

    function getCidHashes(address nodeAddress, uint256 pageSize, uint256 pageNumber) external view returns (bytes32[] memory, bool) {
        Paging.Page memory page = Paging.getPage(nodes[nodeAddress].cidHashes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        bytes32[] memory result = new bytes32[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = nodes[nodeAddress].cidHashes.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }
}
