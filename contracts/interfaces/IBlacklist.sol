pragma solidity ^0.5.2;

interface IBlacklist {
    function addCid(string calldata cid) external;
    function deleteCid(string calldata cid) external;

    function addUser(address userAddress) external;
    function deleteUser(address userAddress) external;

    function addNode(address nodeAddress) external;
    function deleteNode(address nodeAddress) external;

    function checkCid(string calldata cid) external view returns (bool);
    function getCidCount() external view returns (uint256);
    function getCidHashes(uint256 pageSize, uint256 pageNumber) external view returns (bytes32[] memory, bool);

    function checkUser(address userAddress) external view returns (bool);
    function getUserCount() external view returns (uint256);
    function getUsers(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function checkNode(address nodeAddress) external view returns (bool);
    function getNodeCount() external view returns (uint256);
    function getNodes(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);
}
