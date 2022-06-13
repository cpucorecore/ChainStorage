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

    function getMaxFileExtLength() external view returns (uint256);
    function setMaxFileExtLength(uint256 length) external;

    function getMaxCidLength() external view returns (uint256);
    function setMaxCidLength(uint256 length) external;

    function getMaxNodeCanAddFileCount() external view returns (uint256);
    function setMaxNodeCanAddFileCount(uint256 value) external;

    function getMaxNodeCanDeleteFileCount() external view returns (uint256);
    function setMaxNodeCanDeleteFileCount(uint256 value) external;

    event SettingChanged(bytes32 indexed name, bytes32 indexed field, uint256 previousValue, uint256 newValue);
}
