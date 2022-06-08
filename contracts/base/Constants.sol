pragma solidity ^0.5.2;

contract Constants {
    bytes32 internal constant CONTRACT_RESOLVER = 'Resolver';
    bytes32 internal constant CONTRACT_SETTING = 'Setting';
    bytes32 internal constant CONTRACT_CHAIN_STORAGE = 'ChainStorage';

    bytes32 internal constant CONTRACT_FILE_MANAGER = 'FileManager';
    bytes32 internal constant CONTRACT_USER_MANAGER = 'UserManager';
    bytes32 internal constant CONTRACT_NODE_MANAGER = 'NodeManager';
    bytes32 internal constant CONTRACT_MONITOR = 'Monitor';

    bytes32 internal constant ACCOUNT_ADMIN = 'Admin';

    // file action
    uint256 constant Add = 0;
    uint256 constant Delete = 1;

    // default status
    uint256 constant DefaultStatus = 0;

    // file status
    uint256 constant FileTryAdd = 1;
    uint256 constant FileAdding = 2;
    uint256 constant FilePartialAdded = 3;
    uint256 constant FileAdded = 4;
    uint256 constant FileTryDelete = 5;
    uint256 constant FileDeleting = 6;
    uint256 constant FilePartialDeleted = 7;
}
