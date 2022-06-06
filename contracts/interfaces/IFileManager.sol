pragma solidity ^0.5.2;

interface IFileManager {
    function addFile(string calldata cid, address userAddress) external returns (bool waitCallback);
    function onBeginAddFile(string calldata cid, uint256 size) external;
    function onEndAddFile(string calldata cid, address[] calldata nodeAddresses) external;

    function deleteFile(string calldata cid, address userAddress) external returns (bool waitCallback);
    function onBeginDeleteFile(string calldata cid) external;
    function onEndDeleteFile(string calldata cid, address[] calldata nodeAddresses) external;

    function onNodeDeleteFileFinish(address nodeAddress, address userAddress, string calldata cid) external;

    function getSize(string calldata cid) external view returns (uint256);
    function getNodes(string calldata cid) external view returns (address[] memory);
    function getNodeNumber(string calldata cid) external view returns (uint256);
}
