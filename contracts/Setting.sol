pragma solidity ^0.5.2;

import './base/ExternalStorable.sol';
import './interfaces/ISetting.sol';
import './interfaces/storages/ISettingStorage.sol';

contract Setting is ExternalStorable, ISetting {
    bytes32 private constant REPLICA = 'Replica';
    bytes32 private constant INIT_SPACE = 'InitSpace';
    bytes32 private constant ADMIN_ACCOUNT = 'AdminAccount';
    bytes32 private constant MAX_USER_EXT_LENGTH = 'MaxUserExtLength';
    bytes32 private constant MAX_NODE_EXT_LENGTH = 'MaxNodeExtLength';
    bytes32 private constant MAX_MONITOR_EXT_LENGTH = 'MaxMonitorExtLength';
    bytes32 private constant MAX_FILE_EXT_LENGTH = 'MaxFileExtLength';
    bytes32 private constant MAX_CID_LENGTH = 'MaxCidLength';
    bytes32 private constant MAX_CAN_ADD_FILE_COUNT = 'MaxCanAddFileCount';
    bytes32 private constant MAX_CAN_DELETE_FILE_COUNT = 'MaxCanDeleteFileCount';

    constructor() public {
        setContractName(CONTRACT_SETTING);
    }

    function _Storage() private view returns (ISettingStorage) {
        return ISettingStorage(getStorage());
    }

    function getReplica() external view returns (uint256) {
        return _Storage().getUint(REPLICA);
    }

    function setReplica(uint256 replica) external {
        mustOwner();
        _Storage().setUint(REPLICA, replica);
    }

    function getInitSpace() external view returns (uint256) {
        return _Storage().getUint(INIT_SPACE);
    }

    function setInitSpace(uint256 space) external {
        mustOwner();
        _Storage().setUint(INIT_SPACE, space);
    }

    function getAdmin() public view returns (address) {
        return _Storage().getAddress(ADMIN_ACCOUNT);
    }

    function setAdmin(address adminAddress) external {
        require(adminAddress != address(0), "S:can not set address(0) as admin");
        address oldAdmin = getAdmin();
        require(oldAdmin == address(0) || msg.sender == oldAdmin || msg.sender == owner, "S:no auth");
        _Storage().setAddress(ADMIN_ACCOUNT, adminAddress);
    }

    function getMaxUserExtLength() external view returns (uint256) {
        return _Storage().getUint(MAX_USER_EXT_LENGTH);
    }

    function setMaxUserExtLength(uint256 length) external {
        mustOwner();
        _Storage().setUint(MAX_USER_EXT_LENGTH, length);
    }

    function getMaxNodeExtLength() external view returns (uint256) {
        return _Storage().getUint(MAX_NODE_EXT_LENGTH);
    }

    function setMaxNodeExtLength(uint256 length) external {
        mustOwner();
        _Storage().setUint(MAX_NODE_EXT_LENGTH, length);
    }

    function getMaxMonitorExtLength() external view returns (uint256) {
        return _Storage().getUint(MAX_MONITOR_EXT_LENGTH);
    }

    function setMaxMonitorExtLength(uint256 length) external {
        mustOwner();
        _Storage().setUint(MAX_MONITOR_EXT_LENGTH, length);
    }

    function getMaxFileExtLength() external view returns (uint256) {
        return _Storage().getUint(MAX_FILE_EXT_LENGTH);
    }

    function setMaxFileExtLength(uint256 length) external {
        mustOwner();
        _Storage().setUint(MAX_FILE_EXT_LENGTH, length);
    }

    function getMaxCidLength() external view returns (uint256) {
        return _Storage().getUint(MAX_CID_LENGTH);
    }

    function setMaxCidLength(uint256 length) external {
        mustOwner();
        _Storage().setUint(MAX_CID_LENGTH, length);
    }

    function getMaxCanAddFileCount() external view returns (uint256) {
        return _Storage().getUint(MAX_CAN_ADD_FILE_COUNT);
    }

    function setMaxCanAddFileCount(uint256 value) external {
        mustOwner();
        _Storage().setUint(MAX_CAN_ADD_FILE_COUNT, value);
    }

    function getMaxCanDeleteFileCount() external view returns (uint256) {
        return _Storage().getUint(MAX_CAN_DELETE_FILE_COUNT);
    }

    function setMaxCanDeleteFileCount(uint256 value) external {
        mustOwner();
        _Storage().setUint(MAX_CAN_DELETE_FILE_COUNT, value);
    }
}
