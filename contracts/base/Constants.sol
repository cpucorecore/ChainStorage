pragma solidity ^0.5.2;

contract Constants {
    bytes32 internal constant CONTRACT_RESOLVER = 'Resolver';
    bytes32 internal constant CONTRACT_SETTING = 'Setting';
    bytes32 internal constant CONTRACT_CHAIN_STORAGE = 'ChainStorage';

    bytes32 internal constant CONTRACT_FILE = 'File';
    bytes32 internal constant CONTRACT_USER = 'User';
    bytes32 internal constant CONTRACT_NODE = 'Node';
    bytes32 internal constant CONTRACT_TASK = 'Task';
    bytes32 internal constant CONTRACT_MONITOR = 'Monitor';

    bytes32 internal constant ACCOUNT_ADMIN = 'Admin';

    // user action
    uint256 constant Add = 0;
    uint256 constant Delete = 1;

    // monitor report type
    uint256 constant ReportTimeout = 0;
    uint256 constant ReportAcceptTimeout = 1;

    // default status
    uint256 constant DefaultStatus = 0;

    // task status
    uint256 constant TaskCreated = 1;
    uint256 constant TaskAccepted = 2;
    uint256 constant TaskAcceptTimeout = 3;
    uint256 constant TaskFinished = 4;
    uint256 constant TaskFailed = 5;
    uint256 constant TaskTimeout = 6;

    // node status
    uint256 constant NodeRegistered = 1;
    uint256 constant NodeOnline = 2;
    uint256 constant NodeMaintain = 3;
    uint256 constant NodeOffline = 4;

    // monitor status
    uint256 constant MonitorRegistered = 1;
    uint256 constant MonitorOnline = 2;
    uint256 constant MonitorMaintain = 3;
}
