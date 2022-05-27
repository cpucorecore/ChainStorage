pragma solidity ^0.5.2;

interface ITaskStorage {
    function newTask(address userAddress, uint256 action, string calldata cid, address nodeAddress, bool noCallback) external returns (uint256);
    function setStatusAndTime(uint256 tid, uint256 status, uint256 time) external;

    function exist(uint256 tid) external view returns (bool);
    function getCurrentTid() external view returns (uint256);
    function isOver(uint256 tid) external view returns (bool);
    function isNodeAddFileCidDuplicated(address nodeAddress, string calldata cid) external view returns (bool);
    function getAddFileNodes(string calldata cid) external view returns (address[] memory nodeAddresses);
    function getAddFileCidHashes(address nodeAddress) external view returns (bytes32[] memory cidHashes);
    function getTask(uint256 tid) external view returns (address, uint256, address, bool, string memory);
    function getTaskState(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256);
    function getStatusAndTime(uint256 tid) external view returns (uint256 status, uint256 time);

    function setAddFileTaskProgressBySize(uint256 tid, uint256 time, uint256 size) external;
    function setAddFileTaskProgressByPercentage(uint256 tid, uint256 time, uint256 percentage) external;
    function getAddFileTaskProgress(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
}
