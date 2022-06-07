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
        uint256 status;
        StorageSpaceManager.StorageSpace storageSpace;
        string ext;
    }

    mapping(address => Node) private nodes;
    EnumerableSet.AddressSet private nodeAddresses;
    EnumerableSet.AddressSet private onlineNodeAddresses;

    constructor(address _manager) public ExternalStorage(_manager) {}

    // write functions
    function newNode(address nodeAddress, uint256 storageTotal, string calldata ext) external {
        mustManager(managerName);
        nodes[nodeAddress] = Node(NodeRegistered, StorageSpaceManager.StorageSpace(0, storageTotal), ext);
        nodeAddresses.add(nodeAddress);
    }

    function deleteNode(address nodeAddress) external {
        mustManager(managerName);
        delete nodes[nodeAddress];
        nodeAddresses.remove(nodeAddress);
        onlineNodeAddresses.remove(nodeAddress);
    }

    function setStorageTotal(address nodeAddress, uint256 value) external {
        mustManager(managerName);
        nodes[nodeAddress].storageSpace.total = value;
    }

    function setExt(address nodeAddress, string calldata ext) external {
        mustManager(managerName);
        nodes[nodeAddress].ext = ext;
    }

    function useStorage(address nodeAddress, uint256 size) external {
        nodes[nodeAddress].storageSpace.useSpace(size, true);
    }

    function freeStorage(address nodeAddress, uint256 size) external {
        nodes[nodeAddress].storageSpace.freeSpace(size);
    }

    function addOnlineNode(address nodeAddress) external {
        mustManager(managerName);
        onlineNodeAddresses.add(nodeAddress);
    }

    function deleteOnlineNode(address nodeAddress) external {
        mustManager(managerName);
        onlineNodeAddresses.remove(nodeAddress);
    }

    function setStatus(address nodeAddress, uint256 status) external {
        mustManager(managerName);
        nodes[nodeAddress].status = status;
    }

    // read functions
    function exist(address nodeAddress) public view returns (bool) {
        return DefaultStatus != nodes[nodeAddress].status;
    }

    function getExt(address nodeAddress) external view returns (string memory) {
        return nodes[nodeAddress].ext;
    }

    function getStorageTotal(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].storageSpace.total;
    }

    function getStorageUsed(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].storageSpace.used;
    }

    function getStatus(address nodeAddress) external view returns (uint256) {
        return nodes[nodeAddress].status;
    }

    function getTotalNodeNumber() external view returns (uint256) {
        return nodeAddresses.length();
    }

    function getTotalOnlineNodeNumber() external view returns (uint256) {
        return onlineNodeAddresses.length();
    }

    function getAllNodeAddresses() public view returns (address[] memory) {
        return nodeAddresses.values();
    }

    function getAllNodeAddresses(uint256 pageSize, uint256 pageNumber) public view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(nodeAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = nodeAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function getAllOnlineNodeAddresses() public view returns (address[] memory) {
        return onlineNodeAddresses.values();
    }

    function getAllOnlineNodeAddresses(uint256 pageSize, uint256 pageNumber) public view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(onlineNodeAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = onlineNodeAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }






    struct CidState {
        uint256 size;
        bool isAddFileFinished;
        bool isDeleteFileFinished;
    }

    mapping(address => mapping(string => CidState)) private node2cidState;
    mapping(string => EnumerableSet.AddressSet) private cid2nodeAddresses;
    mapping(address => EnumerableSet.Bytes32Set) private node2cidHashes;

    // for addFile
    mapping(string => EnumerableSet.AddressSet) private cid2canAddFileNodeAddresses;

    // for deleteFile
    mapping(string => EnumerableSet.AddressSet) private cid2canDeleteFileNodeAddresses;


    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external returns (uint256) {
        mustManager(managerName);

        if (!cid2canAddFileNodeAddresses[cid].contains(nodeAddress)) {
            cid2canAddFileNodeAddresses[cid].add(nodeAddress);
            node2cidState[nodeAddress][cid] = CidState(size, false, false);
        }
        return cid2canAddFileNodeAddresses[cid].length();
    }

    function isSizeConsistent(string calldata cid) external view returns (bool, uint256) {
        uint256 size = node2cidState[cid2canAddFileNodeAddresses[cid].at(0)][cid].size;

        for(uint256 i=1; i<cid2canAddFileNodeAddresses[cid].length(); i++) {
            if (size != node2cidState[cid2canAddFileNodeAddresses[cid].at(i)][cid].size) {
                return (false, 0);
            }
        }

        return (true, size);
    }

    function getCanAddCidNodeAddresses(string calldata cid) external view returns (address[] memory) {
        return cid2canAddFileNodeAddresses[cid].values();
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external returns (bool) {
        node2cidState[nodeAddress][cid].isAddFileFinished = true;
        if (!cid2nodeAddresses[cid].contains(nodeAddress)) {
            cid2nodeAddresses[cid].add(nodeAddress);
        }

        bytes32 cidHash = keccak256(bytes(cid));
        if (!node2cidHashes[nodeAddress].contains(cidHash)) {
            node2cidHashes[nodeAddress].add(cidHash);
        }

        bool allNodeFinishAddFile = true;
        for(uint i=0; i<cid2canAddFileNodeAddresses[cid].length(); i++) {
            if (false == node2cidState[cid2canAddFileNodeAddresses[cid].at(i)][cid].isAddFileFinished) {
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

    function nodeDeleteFile(address nodeAddress, string calldata cid) external returns (bool) {
        node2cidState[nodeAddress][cid].isDeleteFileFinished = true;
        if (cid2nodeAddresses[cid].contains(nodeAddress)) {
            cid2nodeAddresses[cid].remove(nodeAddress);
        }

        bytes32 cidHash = keccak256(bytes(cid));
        if (node2cidHashes[nodeAddress].contains(cidHash)) {
            node2cidHashes[nodeAddress].remove(cidHash);
        }

        bool allNodeFinishDeleteFile = true;
        for(uint i=0; i<cid2canDeleteFileNodeAddresses[cid].length(); i++) {
            if (false == node2cidState[cid2canDeleteFileNodeAddresses[cid].at(i)][cid].isDeleteFileFinished) {
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
