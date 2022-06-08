pragma solidity ^0.5.2;

interface IMonitorStorage {
    struct MonitorItem {
        string ext;
        bool exist;
    }

    function newMonitor(address monitorAddress, string calldata ext) external;
    function deleteMonitor(address monitorAddress) external;
    function exist(address monitorAddress) external view returns (bool);
    function getMonitor(address monitorAddress) external view returns (string memory, bool);

    function getExt(address monitorAddress) external view returns (string memory);
    function setExt(address monitorAddress, string calldata ext) external;

    function addOnlineMonitor(address monitorAddress) external;
    function deleteOnlineMonitor(address monitorAddress) external;

    function getAllMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
    function getAllOnlineMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
}
