pragma solidity ^0.5.2;

interface IFileManager {
    function addFile(string calldata cid, address userAddress) external returns (bool waitCallback);
    function onNodeAddFileFinish(address nodeAddress, address userAddress, string calldata cid, uint256 size) external;
    function onAddFileFail(address userAddress, string calldata cid) external;

    function deleteFile(string calldata cid, address userAddress) external returns (bool finish);
    function onNodeDeleteFileFinish(address nodeAddress, address userAddress, string calldata cid) external;

    function getSize(string calldata cid) external view returns (uint256);
    function getNodes(string calldata cid) external view returns (address[] memory);
    function getNodeNumber(string calldata cid) external view returns (uint256);
}
