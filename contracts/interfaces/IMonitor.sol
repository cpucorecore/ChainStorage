pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2;

interface IMonitor {
    function register(address monitorAddress, string calldata ext) external;
    function deRegister(address monitorAddress) external;

    function online(address monitorAddress) external;
    function maintain(address monitorAddress) external;

    function resetCurrentTid(address monitorAddress, uint256 tid) external;
    function checkTask(address monitorAddress, uint256 tid) external returns (bool continueCheck);
    function reportTaskAcceptTimeout(address monitorAddress, uint256 tid) external;
    function reportTaskTimeout(address monitorAddress, uint256 tid) external;
}
