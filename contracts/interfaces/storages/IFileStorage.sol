pragma solidity ^0.5.2;

contract IFileStorage {
    function exist(string calldata cid) external view returns (bool);
    function newFile(string calldata cid, uint256 replica) external;
    function deleteFile(string calldata cid) external;

    function getStatus(string calldata cid) external view returns (uint256);
    function getStatusTime(string calldata cid) external view returns (uint256);
    function setStatus(string calldata cid, uint256 status) external;

    function getSize(string calldata cid) external view returns (uint256);
    function setSize(string calldata cid, uint256 size) external;

    function getReplica(string calldata cid) external view returns (uint256);

    function userExist(string calldata cid, address userAddress) external view returns (bool);
    function userEmpty(string calldata cid) external view returns (bool);
    function addUser(string calldata cid, address userAddress) external;
    function deleteUser(string calldata cid, address userAddress) external;
    function getUsers(string calldata cid) external view returns (address[] memory);
    function getUsers(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function nodeExist(string calldata cid, address nodeAddress) external view returns (bool);
    function nodeEmpty(string calldata cid) external view returns (bool);
    function addNode(string calldata cid, address nodeAddress) external;
    function deleteNode(string calldata cid, address nodeAddress) external;
    function getNodes(string calldata cid) external view returns (address[] memory);
    function getNodes(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function getTotalSize() external view returns (uint256);
    function getFileNumber() external view returns (uint256);

    function getCid(bytes32 cidHash) external view returns (string memory);

    function setLastUser(string calldata cid, address lastUser) external;
    function getLastUser(string calldata cid) external view returns (address);
}
