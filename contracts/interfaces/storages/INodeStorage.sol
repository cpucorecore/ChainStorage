pragma solidity ^0.5.2;

interface INodeStorage {
    // write functions
    function newNode(address nodeAddress, uint256 storageTotal, string calldata ext) external;
    function deleteNode(address nodeAddress) external;
    function setStorageTotal(address nodeAddress, uint256 value) external;
    function setExt(address nodeAddress, string calldata ext) external;
    function useStorage(address nodeAddress, uint256 value) external;
    function freeStorage(address nodeAddress, uint256 value) external;
    function addOnlineNode(address nodeAddress) external;
    function deleteOnlineNode(address nodeAddress) external;
    function setStatus(address nodeAddress, uint256 status) external;
    function resetAddFileFailedCount(string calldata cid) external;
    function upAddFileFailedCount(string calldata cid) external returns (uint256);
    function addTid(address nodeAddress, uint256 tid) external;
    function removeTid(address nodeAddress, uint256 tid) external;

    // read functions
    function exist(address nodeAddress) external view returns (bool);
    function getExt(address nodeAddress) external view returns (string memory);
    function getStorageTotal(address nodeAddress) external view returns (uint256);
    function getStorageUsed(address nodeAddress) external view returns (uint256);
    function getStatus(address nodeAddress) external view returns (uint256);
    function getTotalNodeNumber() external view returns (uint256);
    function getTotalOnlineNodeNumber() external view returns (uint256);
    function getAllNodeAddresses() external view returns (address[] memory);
    function getAllNodeAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
    function getAllOnlineNodeAddresses() external view returns (address[] memory);
    function getAllOnlineNodeAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
    function getAddFileFailedCount(string calldata cid) external view returns (uint256);
    function getTids(address nodeAddress) external view returns (uint256[] memory);
}
