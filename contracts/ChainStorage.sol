pragma solidity ^0.5.2;

import "./base/Proxyable.sol";
import "./base/Pausable.sol";
import "./base/Importable.sol";
import "./interfaces/IUserManager.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/IMonitor.sol";
import "./interfaces/ITaskManager.sol";
import "./interfaces/ISetting.sol";

contract ChainStorage is Proxyable, Pausable, Importable {
    constructor() public Importable(IResolver(0)) {}

    function initialize(IResolver _resolver) external {
        mustOwner();
        setInitialized();

        resolver = _resolver;
        setContractName(CONTRACT_CHAIN_STORAGE);

        imports = [
        CONTRACT_SETTING,
        CONTRACT_USER_MANAGER,
        CONTRACT_NODE_MANAGER,
        CONTRACT_TASK_MANAGER,
        CONTRACT_MONITOR,
        ACCOUNT_ADMIN
        ];
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function _User() private view returns (IUserManager) {
        return IUserManager(requireAddress(CONTRACT_USER_MANAGER));
    }

    function _Node() private view returns (INodeManager) {
        return INodeManager(requireAddress(CONTRACT_NODE_MANAGER));
    }

    function _Monitor() private view returns (IMonitor) {
        return IMonitor(requireAddress(CONTRACT_MONITOR));
    }

    function _Task() private view returns (ITaskManager) {
        return ITaskManager(requireAddress(CONTRACT_TASK_MANAGER));
    }

    function userRegister(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxUserExtLength(), "CS:user ext too long");
        _User().register(msg.sender, ext);
    }

    function userSetExt(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxUserExtLength(), "CS:user ext too long");
        _User().setExt(msg.sender, ext);
    }

    function userSetStorageTotal(address addr, uint256 storageTotal) external {
        _mustOnline();
        mustAddress(ACCOUNT_ADMIN);
        _User().setStorageTotal(addr, storageTotal);
    }

    function userDeRegister() external {
        _mustOnline();
        _User().deRegister(msg.sender);
    }

    function userAddFile(string calldata cid, uint256 duration, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxFileExtLength(), "CS:file ext too long");
        require(bytes(cid).length <= _Setting().getMaxCidLength(), "CS:cid too long");
        _User().addFile(msg.sender, cid, duration, ext);
    }

    function userSetFileExt(string calldata cid, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxFileExtLength(), "CS:file ext too long");
        _User().setFileExt(msg.sender, cid, ext);
    }

    function userSetFileDuration(string calldata cid, uint256 duration) external {
        _mustOnline();
        _User().setFileDuration(msg.sender, cid, duration);
    }

    function userDeleteFile(string calldata cid) external {
        _mustOnline();
        require(bytes(cid).length <= _Setting().getMaxCidLength(), "CS:cid too long");
        _User().deleteFile(msg.sender, cid);
    }

    function nodeRegister(uint256 storageTotal, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxNodeExtLength(), "CS:node ext too long");
        require(storageTotal > 0, "CS:node storageTotal must>0");
        _Node().register(msg.sender, storageTotal, ext);
    }

    function nodeSetExt(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxNodeExtLength(), "CS:node ext too long");
        _Node().setExt(msg.sender, ext);
    }

    function nodeSetStorageTotal(uint256 storageTotal) external {
        _mustOnline();
        _Node().setStorageTotal(msg.sender, storageTotal);
    }

    function nodeDeRegister() external {
        _mustOnline();
        _Node().deRegister(msg.sender);
    }

    function nodeOnline() external {
        _mustOnline();
        _Node().online(msg.sender);
    }

    function nodeMaintain() external {
        _mustOnline();
        _Node().maintain(msg.sender);
    }

    function nodeAcceptTask(uint256 tid) external {
        _mustOnline();
        _Task().acceptTask(msg.sender, tid);
    }

    function nodeReportAddFileProgressBySize(uint256 tid, uint256 size) external {
        _mustOnline();
        _Task().reportAddFileProgressBySize(msg.sender, tid, size);
    }

    function nodeReportAddFileProgressByPercentage(uint256 tid, uint256 percentage) external {
        _mustOnline();
        _Task().reportAddFileProgressByPercentage(msg.sender, tid, percentage);
    }

    function nodeFinishTask(uint256 tid, uint256 size) external {
        _mustOnline();
        _Node().finishTask(msg.sender, tid, size);
    }

    function nodeFailTask(uint256 tid) external {
        _mustOnline();
        _Node().failTask(msg.sender, tid);
    }

    function monitorRegister(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxMonitorExtLength(), "CS:monitor ext too long");
        _Monitor().register(msg.sender, ext);
    }

    function monitorDeRegister() external {
        _mustOnline();
        _Monitor().deRegister(msg.sender);
    }

    function monitorSetExt(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxMonitorExtLength(), "CS:monitor ext too long");
        _Monitor().setExt(msg.sender, ext);
    }

    function monitorOnline() external {
        _mustOnline();
        _Monitor().online(msg.sender);
    }

    function monitorMaintain() external {
        _mustOnline();
        _Monitor().maintain(msg.sender);
    }

    function monitorResetCurrentTid(uint256 tid) external {
        _mustOnline();
        _Monitor().resetCurrentTid(msg.sender, tid);
    }

    function monitorCheckTask(uint256 tid) external returns (bool continueCheck) {
        _mustOnline();
        return _Monitor().checkTask(msg.sender, tid);
    }

    function monitorReportTaskAcceptTimeout(uint256 tid) external {
        _mustOnline();
        _Monitor().reportTaskAcceptTimeout(msg.sender, tid);
    }

    function monitorReportTaskTimeout(uint256 tid) external {
        _mustOnline();
        _Monitor().reportTaskTimeout(msg.sender, tid);
    }

    function _mustOnline() private {
        mustInitialized();
        mustNotPaused();
    }
}
