pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

interface IUserStorage {
    function newUser(address userAddress, uint256 storageTotal, string calldata ext) external;
    function deleteUser(address userAddress) external;
    function setExt(address userAddress, string calldata ext) external;
    function setStorageTotal(address userAddress, uint256 size) external;
    function upInvalidAddFileCount(address userAddress) external returns (uint256);
    function useStorage(address userAddress, uint256 size, bool checkSpaceEnough) external;
    function freeStorage(address userAddress, uint256 size) external;
    function exist(address userAddress) external view returns (bool);
    function getExt(address userAddress) external view returns (string memory);
    function availableSpace(address userAddress) external view returns (uint256);
    function getStorageTotal(address userAddress) external view returns (uint256);
    function getStorageUsed(address userAddress) external view returns (uint256);
    function getFileNumber(address userAddress) external view returns (uint256);
    function getCids(address userAddress, uint256 pageSize, uint256 pageNumber) external view returns (string[] memory, bool);
    function getInvalidAddFileCount(address userAddress) external view returns (uint256);

    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external;
    function deleteFile(address userAddress, string calldata cid) external;
    function setFileExt(address userAddress, string calldata cid, string calldata ext) external;
    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external;
    function fileExist(address userAddress, string calldata cid) external view returns (bool);
    function getFileExt(address userAddress, string calldata cid) external view returns (string memory);
    function getFileDuration(address userAddress, string calldata cid) external view returns (uint256);
    function getFileItem(address userAddress, string calldata cid) external view returns (string memory, uint256, uint256, string memory);

    function getTotalUserNumber() external view returns (uint256);
}
