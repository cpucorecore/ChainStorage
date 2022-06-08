pragma solidity ^0.5.2;

interface IMonitor {
    function register(address monitorAddress, string calldata ext) external;
    function setExt(address monitorAddress, string calldata ext) external;
    function deRegister(address monitorAddress) external;
}
