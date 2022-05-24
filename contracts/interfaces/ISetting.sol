pragma solidity ^0.5.2;

interface ISetting {
    function getReplica() external view returns (uint256);
    function setReplica(uint256 replica) external;

    function getInitSpace() external view returns (uint256);
    function setInitSpace(uint256 space) external;

    function getAdmin() external view returns (address);
    function setAdmin(address adminAddress) external;

    function getMaxUserExtLength() external view returns (uint256);
    function setMaxUserExtLength(uint256 length) external;

    function getMaxNodeExtLength() external view returns (uint256);
    function setMaxNodeExtLength(uint256 length) external;

    function getMaxMonitorExtLength() external view returns (uint256);
    function setMaxMonitorExtLength(uint256 length) external;

    function getMaxFileExtLength() external view returns (uint256);
    function setMaxFileExtLength(uint256 length) external;

    function getMaxCidLength() external view returns (uint256);
    function setMaxCidLength(uint256 length) external;

    function getTaskAcceptTimeout() external view returns (uint256);
    function setTaskAcceptTimeout(uint256 value) external;

    function getAddFileTaskTimeout() external view returns (uint256);
    function setAddFileTaskTimeout(uint256 value) external;

    function getDeleteFileTaskTimeout() external view returns (uint256);
    function setDeleteFileTaskTimeout(uint256 value) external;

    function getAddFileProgressTimeout() external view returns (uint256);
    function setAddFileProgressTimeout(uint256 value) external;

    function getMaxAddFileFailedCount() external view returns (uint256);
    function setMaxAddFileFailedCount(uint256 value) external;

    event SettingChanged(bytes32 indexed name, bytes32 indexed field, uint256 previousValue, uint256 newValue);
}
