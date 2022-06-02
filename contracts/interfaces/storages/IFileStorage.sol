pragma solidity ^0.5.2;

contract IFileStorage {
    function newSid() external returns (uint256);
    function exist(string memory cid) public view returns (bool);
    function newFile(string calldata cid, uint256 size) external;
    function deleteFile(string calldata cid) external;
    function getCidByHash(bytes32 hash) external view returns (string memory);

    function getSize(string calldata cid) external view returns (uint256);

    function getStatus(string calldata cid) external view returns (uint256);
    function setStatus(string calldata cid, uint256 status) external;

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
    function getNodesNumber(string calldata cid) external view returns (uint256);
    function getNodes(string calldata cid) external view returns (address[] memory);
    function getNodes(string calldata cid, uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function getTotalSize() external view returns (uint256);
    function upTotalSize(uint256 size) external returns (uint256);
    function downTotalSize(uint256 size) external returns (uint256);
    function getTotalFileNumber() external view returns (uint256);
}
