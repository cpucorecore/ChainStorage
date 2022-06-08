pragma solidity ^0.5.2;

interface IFileManager {
    function addFile(string calldata cid, address userAddress) external returns (bool waitCallback);
    function onBeginAddFile(string calldata cid, uint256 size) external;
    function onNodeAddFile(address nodeAddress, string calldata cid) external;
    function onEndAddFile(string calldata cid) external;

    function deleteFile(string calldata cid, address userAddress) external returns (bool waitCallback);
    function onBeginDeleteFile(string calldata cid) external;
    function onNodeDeleteFile(address nodeAddress, string calldata cid) external;
    function onEndDeleteFile(string calldata cid) external;

    function getSize(string calldata cid) external view returns (uint256);
    function getReplica(string calldata cid) external view returns (uint256);
}
