pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IMonitorStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract MonitorStorage is ExternalStorage, IMonitorStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address=>MonitorItem) monitors;
    EnumerableSet.AddressSet monitorAddresses;
    EnumerableSet.AddressSet onlineMonitorAddresses;

    mapping(address=>uint256) monitor2rid; // rid=0: no report;
    mapping(address=>Report[]) monitor2reports;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function newMonitor(address monitorAddress, string calldata ext) external {
        mustManager(managerName);
        monitors[monitorAddress] = MonitorItem(MonitorRegistered, 0, 0, ext, true);
        monitorAddresses.add(monitorAddress);
    }

    function deleteMonitor(address monitorAddress) external {
        mustManager(managerName);
        delete monitors[monitorAddress];
        monitorAddresses.remove(monitorAddress);
    }

    function exist(address monitorAddress) external view returns (bool) {
        return monitors[monitorAddress].exist;
    }

    function getMonitor(address monitorAddress) external view returns (uint256, uint256, uint256, string memory) {
        MonitorItem storage monitor = monitors[monitorAddress];
        return (monitor.status, monitor.firstOnlineTid, monitor.currentTid, monitor.ext);
    }

    function getExt(address monitorAddress) external view returns (string memory) {
        return monitors[monitorAddress].ext;
    }

    function setExt(address monitorAddress, string calldata ext) external {
        monitors[monitorAddress].ext = ext;
    }

    function getCurrentTid(address monitorAddress) external view returns (uint256) {
        return monitors[monitorAddress].currentTid;
    }

    function setCurrentTid(address monitorAddress, uint256 tid) external {
        mustManager(managerName);
        monitors[monitorAddress].currentTid = tid;
    }

    function getFirstOnlineTid(address monitorAddress) external view returns (uint256) {
        return monitors[monitorAddress].firstOnlineTid;
    }

    function setFirstOnlineTid(address monitorAddress, uint256 tid) external {
        mustManager(managerName);
        monitors[monitorAddress].firstOnlineTid = tid;
    }

    function getStatus(address monitorAddress) external view returns (uint256) {
        return monitors[monitorAddress].status;
    }

    function setStatus(address monitorAddress, uint256 status) external {
        mustManager(managerName);
        monitors[monitorAddress].status = status;
    }

    function addOnlineMonitor(address monitorAddress) external {
        mustManager(managerName);
        onlineMonitorAddresses.add(monitorAddress);
    }

    function deleteOnlineMonitor(address monitorAddress) external {
        mustManager(managerName);
        onlineMonitorAddresses.remove(monitorAddress);
    }

    function getAllMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(monitorAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = monitorAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function getAllOnlineMonitorAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(onlineMonitorAddresses.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = onlineMonitorAddresses.at(start+i);
        }
        return (result, page.pageNumber == page.totalPages);
    }

    function addReport(address monitorAddress, uint256 tid, uint256 reportType, uint256 timestamp) external {
        mustManager(managerName);
        uint256 index = monitor2reports[monitorAddress].push(Report(tid, reportType, timestamp));
        monitor2rid[monitorAddress] = index;
    }

    function getReportNumber(address monitorAddress) external view returns (uint256) {
        return monitor2rid[monitorAddress];
    }

    function getReport(address monitorAddress, uint256 index) external view returns (uint256, uint256, uint256) {
        Report storage report = monitor2reports[monitorAddress][index];
        return (report.tid, report.reportType, report.timestamp);
    }
}
