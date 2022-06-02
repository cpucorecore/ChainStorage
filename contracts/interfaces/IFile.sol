pragma solidity ^0.5.2;

interface IFile {
    function addFile(address userAddress, string calldata cid, uint256 size) external returns (bool waitCallback);
    function onNodeAddFileFinish(address nodeAddress, address userAddress, string calldata cid, uint256 size, uint256 replica) external;
    function onAddFileFail(address userAddress, string calldata cid, uint256 reason) external;

    function deleteFile(address userAddress, string calldata cid) external returns (bool waitCallback);
    function onNodeDeleteFileFinish(address nodeAddress, address userAddress, string calldata cid) external;

    function getSize(string calldata cid) external view returns (uint256);
    function getNodes(string calldata cid) external view returns (address[] memory);
    function getNodeNumber(string calldata cid) external view returns (uint256);
}
