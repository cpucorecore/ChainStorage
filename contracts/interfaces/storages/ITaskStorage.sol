pragma solidity ^0.5.2;

interface ITaskStorage {
    function getCurrentTid() external view returns (uint256);

    function newTask(address userAddress, uint256 action, string calldata cid, address nodeAddress, bool noCallback) external returns (uint256);
    function setStatusAndTime(uint256 tid, uint256 status, uint256 time) external;

    function exist(uint256 tid) external view returns (bool);

    function getNodeMaxTid(address nodeAddress) external view returns (uint256);
    function isOver(uint256 tid) external view returns (bool);
    function getTask(uint256 tid) external view returns (address, uint256, address, bool, string memory);
    function getTaskState(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256);
    function getStatusAndTime(uint256 tid) external view returns (uint256, uint256);

    function setAddFileTaskProgressBySize(uint256 tid, uint256 time, uint256 size) external;
    function setAddFileTaskProgressByPercentage(uint256 tid, uint256 time, uint256 percentage) external;
    function getAddFileTaskProgress(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
}
