pragma solidity ^0.5.2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/IMonitorStorage.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract MonitorStorage is ExternalStorage, IMonitorStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    mapping(address => MonitorItem) monitors;
    EnumerableSet.AddressSet monitorAddresses;
    EnumerableSet.AddressSet onlineMonitorAddresses;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function newMonitor(address monitorAddress, string calldata ext) external {
        mustManager(managerName);
        monitors[monitorAddress] = MonitorItem(ext, true);
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

    function getMonitor(address monitorAddress) external view returns (string memory, bool) {
        MonitorItem storage monitor = monitors[monitorAddress];
        return (monitor.ext, monitor.exist);
    }

    function getExt(address monitorAddress) external view returns (string memory) {
        return monitors[monitorAddress].ext;
    }

    function setExt(address monitorAddress, string calldata ext) external {
        monitors[monitorAddress].ext = ext;
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
}
