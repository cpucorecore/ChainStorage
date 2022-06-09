pragma solidity ^0.5.2;

interface INodeStorage {
    function exist(address nodeAddress) external view returns (bool);
    function newNode(address nodeAddress, uint256 storageTotal, string calldata ext) external;
    function deleteNode(address nodeAddress) external;

    function setExt(address nodeAddress, string calldata ext) external;
    function getExt(address nodeAddress) external view returns (string memory);

    function setStorageTotal(address nodeAddress, uint256 value) external;
    function getStorageTotal(address nodeAddress) external view returns (uint256);

    function useStorage(address nodeAddress, uint256 value) external;
    function freeStorage(address nodeAddress, uint256 value) external;
    function availableSpace(address nodeAddress) external view returns (uint256);
    function getStorageUsed(address nodeAddress) external view returns (uint256);

    function getNodeCount() external view returns (uint256);
    function getAllNodeAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function fileExist(address nodeAddress, string calldata cid) external view returns (bool);
    function addFile(address nodeAddress, string calldata cid, uint256 size) external;
    function deleteFile(address nodeAddress, string calldata cid) external;
    
    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external returns (uint256);
    function getNodeCanAddFileCount(address nodeAddress) external view returns (uint256);
    function getNodeCanAddFileCidHashes(address nodeAddress) external view returns (bytes32[] memory);
    function isSizeConsistent(string calldata cid) external view returns (bool);
    function getCanAddFileNodeCount(string calldata cid) external view returns (uint256);
    function getCanAddFileNodeAddresses(string calldata cid) external view returns (address[] memory);
    function isCanAddFile(address nodeAddress, string calldata cid) external view returns (bool);
    function isFileAdded(address nodeAddress, string calldata cid) external view returns (bool);

    function nodeAddFile(address nodeAddress, string calldata cid) external returns (bool);
    function getNodeAddresses(string calldata cid) external view returns (address[] memory);

    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external returns (bool);
    function getNodeCanDeleteFileCount(address nodeAddress) external view returns (uint256);
    function getNodeCanDeleteFileCidHashes(address nodeAddress) external view returns (bytes32[] memory);
    function getCanDeleteFileNodeAddresses(string calldata cid) external view returns (address[] memory);
    function nodeDeleteFile(address nodeAddress, string calldata cid) external returns (bool);

    function getCidHashes(address nodeAddress, uint256 pageSize, uint256 pageNumber) external view returns (bytes32[] memory, bool);
}
