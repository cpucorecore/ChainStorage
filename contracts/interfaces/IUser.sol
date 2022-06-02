pragma solidity ^0.5.2;

interface IUser {
    function register(address userAddress, string calldata ext) external;
    function setExt(address userAddress, string calldata ext) external;
    function setStorageTotal(address userAddress, uint256 size) external;
    function deRegister(address userAddress) external;

    function addFile(address userAddress, string calldata cid, uint256 size, string calldata ext, uint256 duration) external;
    function onAddFileFinish(address userAddress, string calldata cid) external;
    function onAddFileFail(address userAddress, string calldata cid, uint256 size, uint256 reason) external;

    function deleteFile(address userAddress, string calldata cid) external;
    function onDeleteFileFinish(address userAddress, string calldata cid, uint256 size) external;

    function setFileExt(address userAddress, string calldata cid, string calldata ext) external;
    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external;
}
