pragma solidity ^0.5.2;

interface INodeManager {
    function register(address nodeAddress, uint256 storageTotal, string calldata ext) external;
    function setExt(address nodeAddress, string calldata ext) external;
    function setStorageTotal(address nodeAddress, uint256 storageTotal) external;
    function deRegister(address nodeAddress) external;

    function addFile(string calldata cid) external;
    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external;
    function nodeCancelCanAddFile(address nodeAddress, string calldata cid) external;
    function nodeAddFile(address nodeAddress, string calldata cid) external;

    function deleteFile(string calldata cid) external;
    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external;
    function nodeDeleteFile(address nodeAddress, string calldata cid) external;
}
