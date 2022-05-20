pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

interface IMonitorStorage {
    struct MonitorItem {
        uint256 status;
        uint256 firstOnlineTid;
        uint256 currentTid;
        string ext;
        bool exist;
    }

    struct Report {
        uint256 tid;
        uint256 reportType;
        uint256 timestamp;
    }

    function newMonitor(address addr, string calldata ext) external;
    function deleteMonitor(address addr) external;
    function exist(address addr) external view returns (bool);
    // (status, firstOnlineTid, currentTid, ext)
    function getMonitor(address addr) external view returns (uint256, uint256, uint256, string memory);

    function getCurrentTid(address addr) external view returns (uint256);
    function setCurrentTid(address addr, uint256 tid) external;

    function getFirstOnlineTid(address addr) external view returns (uint256);
    function setFirstOnlineTid(address addr, uint256 tid) external;

    function getStatus(address addr) external view returns (uint256);
    function setStatus(address addr, uint256 status) external;

    function addOnlineMonitor(address addr) external;
    function deleteOnlineMonitor(address addr) external;

    function getAllMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
    function getAllOnlineMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function addReport(address addr, uint256 tid, uint256 reportType, uint256 timestamp) external;
    function getReportNumber(address addr) external view returns (uint256);
    function getReport(address addr, uint256 index) external view returns (uint256, uint256, uint256); // (tid, reportType, timestamp)
}
