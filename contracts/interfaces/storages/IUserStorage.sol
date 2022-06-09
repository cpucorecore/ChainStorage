pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

interface IUserStorage {
    function exist(address userAddress) external view returns (bool);
    function newUser(address userAddress, uint256 storageTotal, string calldata ext) external;
    function deleteUser(address userAddress) external;

    function setExt(address userAddress, string calldata ext) external;
    function getExt(address userAddress) external view returns (string memory);

    function setStorageTotal(address userAddress, uint256 size) external;
    function getStorageTotal(address userAddress) external view returns (uint256);

    function useStorage(address userAddress, uint256 size, bool checkSpaceEnough) external;
    function freeStorage(address userAddress, uint256 size) external;
    function availableSpace(address userAddress) external view returns (uint256);
    function getStorageUsed(address userAddress) external view returns (uint256);

    function getUserCount() external view returns (uint256);
    function getAllUserAddresses(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool);

    function fileExist(address userAddress, string calldata cid) external view returns (bool);
    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external;
    function deleteFile(address userAddress, string calldata cid) external;
    function setFileExt(address userAddress, string calldata cid, string calldata ext) external;
    function getFileExt(address userAddress, string calldata cid) external view returns (string memory);
    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external;
    function getFileDuration(address userAddress, string calldata cid) external view returns (uint256);
    function getFileInfo(address userAddress, string calldata cid) external view returns (uint256, uint256, string memory);

    function getFileCount(address userAddress) external view returns (uint256);
    function getFiles(address userAddress, uint256 pageSize, uint256 pageNumber) external view returns (string[] memory, bool);
}
