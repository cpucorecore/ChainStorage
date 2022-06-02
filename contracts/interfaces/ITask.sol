pragma solidity ^0.5.2;

interface ITask {
    function issueAddFileTask(address userAddress, string calldata cid, uint256 size, address nodeAddress, uint256 replica) external returns (uint256 tid);
    function issueDeleteFileTask(address userAddress, string calldata cid, uint256 size, address nodeAddress, uint256 replica, bool noCallback) external returns (uint256 tid);
    function acceptTask(address nodeAddress, uint256 tid) external;
    function finishTask(address nodeAddress, uint256 tid) external;
    function failTask(address nodeAddress, uint256 tid, uint256 reason) external;
    function acceptTaskTimeout(uint256 tid) external;
    function taskTimeout(uint256 tid) external;
    function reportAddFileProgressBySize(address nodeAddress, uint256 tid, uint256 size) external;
    function reportAddFileProgressByPercentage(address nodeAddress, uint256 tid, uint256 percentage) external;

    function exist(uint256 tid) external view returns (bool);
    function getCurrentTid() external view returns (uint256);
    function isOver(uint256 tid) external view returns (bool);
    function isNodeAddFileCidDuplicated(address nodeAddress, string calldata cid) external view returns (bool);
    function getTask(uint256 tid) external view returns (address, uint256, address, string memory, uint256, bool);
    function getAddFileTaskProgress(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256);
    function getStatusAndTime(uint256 tid) external view returns (uint256, uint256);

    function getReplica(uint256 tid) external view returns (uint256);
}
