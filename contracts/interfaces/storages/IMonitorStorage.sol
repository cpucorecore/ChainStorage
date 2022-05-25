pragma solidity ^0.5.2;

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

    function newMonitor(address monitorAddress, string calldata ext) external;
    function deleteMonitor(address monitorAddress) external;
    function exist(address monitorAddress) external view returns (bool);
    // (status, firstOnlineTid, currentTid, ext)
    function getMonitor(address monitorAddress) external view returns (uint256, uint256, uint256, string memory);

    function getExt(address monitorAddress) external view returns (string memory);
    function setExt(address monitorAddress, string calldata ext) external;

    function getCurrentTid(address monitorAddress) external view returns (uint256);
    function setCurrentTid(address monitorAddress, uint256 tid) external;

    function getFirstOnlineTid(address monitorAddress) external view returns (uint256);
    function setFirstOnlineTid(address monitorAddress, uint256 tid) external;

    function getStatus(address monitorAddress) external view returns (uint256);
    function setStatus(address monitorAddress, uint256 status) external;

    function addOnlineMonitor(address monitorAddress) external;
    function deleteOnlineMonitor(address monitorAddress) external;

    function getAllMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
    function getAllOnlineMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function addReport(address monitorAddress, uint256 tid, uint256 reportType, uint256 timestamp) external;
    function getReportNumber(address monitorAddress) external view returns (uint256);
    function getReport(address monitorAddress, uint256 index) external view returns (uint256, uint256, uint256); // (tid, reportType, timestamp)
}
