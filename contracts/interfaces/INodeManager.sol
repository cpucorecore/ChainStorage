pragma solidity ^0.5.2;

interface INodeManager {
    function register(address nodeAddress, uint256 storageTotal, string calldata ext) external;
    function setExt(address nodeAddress, string calldata ext) external;
    function setStorageTotal(address nodeAddress, uint256 storageTotal) external;
    function deRegister(address nodeAddress) external;

    function online(address nodeAddress) external;
    function maintain(address nodeAddress) external;

    function addFile(address userAddress, string calldata cid) external;

    function finishTask(address nodeAddress, uint256 tid, uint256 size) external;
    function failTask(address nodeAddressAddress, uint256 tid) external;

    function reportAcceptTaskTimeout(uint256 tid) external;
    function reportTaskTimeout(uint256 tid) external;

    function taskIssuedCallback(address nodeAddress, uint256 tid) external;
}
