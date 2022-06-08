pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IMonitor.sol";
import "./interfaces/storages/IMonitorStorage.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/ISetting.sol";
import "./lib/SafeMath.sol";

contract Monitor is Importable, ExternalStorable, IMonitor {
    using SafeMath for uint256;
    using Strings for uint256;

    event MonitorReport(address indexed monitorAddress, uint256 tid, uint256 reportType);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_MONITOR);
        imports = [
        CONTRACT_NODE_MANAGER,
        CONTRACT_SETTING,
        CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns (IMonitorStorage) {
        return IMonitorStorage(getStorage());
    }

    function _NodeManager() private view returns (INodeManager) {
        return INodeManager(requireAddress(CONTRACT_NODE_MANAGER));
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function register(address monitorAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(!_Storage().exist(monitorAddress), "M:monitor exist");
        _Storage().newMonitor(monitorAddress, ext);
    }

    function setExt(address monitorAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:monitor not exist");
        _Storage().setExt(monitorAddress, ext);
    }

    function deRegister(address monitorAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:monitor not exist");
        _Storage().deleteMonitor(monitorAddress);
    }
}
