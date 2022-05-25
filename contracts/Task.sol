pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/ITask.sol";
import "./interfaces/storages/ITaskStorage.sol";

contract Task is Importable, ExternalStorable, ITask {
    event TaskIssued(address indexed nodeAddress, uint256 indexed tid);
    event TaskStatusChanged(uint256 tid, address indexed nodeAddress, uint256 action, uint256 from, uint256 to);

    bytes32[] private ISSUABLE_CONTRACTS = [CONTRACT_NODE, CONTRACT_FILE];

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_TASK);
        imports = [
            CONTRACT_NODE,
            CONTRACT_FILE,
            CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns(ITaskStorage) {
        return ITaskStorage(getStorage());
    }

    function issueTask(uint256 action, address userAddress, string calldata cid, address nodeAddress, bool noCallback) external returns (uint256) {
        mustContainAddress(ISSUABLE_CONTRACTS);
        uint256 tid = _Storage().newTask(userAddress, action, cid, nodeAddress, noCallback);
        emit TaskIssued(nodeAddress, tid);
        emit TaskStatusChanged(tid, nodeAddress, action, DefaultStatus, TaskCreated);
        return tid;
    }

    function acceptTask(address nodeAddress, uint256 tid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _checkTaskExist(tid);

        (, uint256 action, address taskNodeAddress,,) = _Storage().getTask(tid);
        require(nodeAddress == taskNodeAddress, "T:node have no this task");

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        if(Add == action) {
            require(TaskCreated == status, "T:wrong status must[C]");
        } else {
            require(TaskCreated == status || TaskAcceptTimeout == status || TaskTimeout == status, "T:wrong status must[CAT]");
        }

        _Storage().setStatusAndTime(tid, TaskAccepted, now);
        emit TaskStatusChanged(tid, nodeAddress, action, status, TaskAccepted);
    }

    function finishTask(uint256 tid) external {
        mustAddress(CONTRACT_NODE);
        _checkTaskExist(tid);

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        (,uint256 action, address taskNodeAddress,,) = _Storage().getTask(tid);
        require(TaskAccepted == status, "T:task status is not Accepted");

        _Storage().setStatusAndTime(tid, TaskFinished, now);
        emit TaskStatusChanged(tid, taskNodeAddress, action, status, TaskFinished);
    }

    function failTask(uint256 tid) external {
        mustAddress(CONTRACT_NODE);
        _checkTaskExist(tid);

        (,uint256 action, address taskNodeAddress,,) = _Storage().getTask(tid);
        require(Add == action, "T:only add file task can fail");

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        require(TaskAccepted == status, "T:task status is not Accepted");

        _Storage().setStatusAndTime(tid, TaskFailed, now);
        emit TaskStatusChanged(tid, taskNodeAddress, action, status, TaskFailed);
    }

    function acceptTaskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_NODE);
        _checkTaskExist(tid);

        (,uint256 action, address taskNodeAddress,,) = _Storage().getTask(tid);
        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        require(TaskCreated == status, "T:task status is not Created");

        _Storage().setStatusAndTime(tid, TaskAcceptTimeout, now);
        emit TaskStatusChanged(tid, taskNodeAddress, action, status, TaskFailed);
    }

    function taskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_NODE);
        _checkTaskExist(tid);

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        (,uint256 action, address taskNodeAddress,,) = _Storage().getTask(tid);
        require(TaskAccepted == status, "T:task status is not Accepted");

        _Storage().setStatusAndTime(tid, TaskTimeout, now);

        emit TaskStatusChanged(tid, taskNodeAddress, action, status, TaskTimeout);
    }

    function reportAddFileProgressBySize(address nodeAddress, uint256 tid, uint256 size) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _checkTaskExist(tid);

        (,,address taskNodeAddress,,) = _Storage().getTask(tid);
        require(nodeAddress == taskNodeAddress, "T:node have no this task");

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        require(TaskAccepted == status, "T:wrong task status,must TaskAccepted");

        _Storage().setAddFileTaskProgressBySize(tid, now, size);
    }

    function reportAddFileProgressByPercentage(address nodeAddress, uint256 tid, uint256 percentage) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _checkTaskExist(tid);

        (,,address taskNodeAddress,,) = _Storage().getTask(tid);
        require(nodeAddress == taskNodeAddress, "T:node have no this task");
        require(percentage <= 100, "T:percentage must <=100");

        (uint256 status,,,,,,,) = _Storage().getTaskState(tid);
        require(TaskAccepted == status, "T:wrong task status,must TaskAccepted");

        _Storage().setAddFileTaskProgressByPercentage(tid, now, percentage);
    }

    function _checkTaskExist(uint256 tid) private view {
        require(_Storage().exist(tid), "T:task not exist");
    }

    function getCurrentTid() external view returns (uint256) {
        return _Storage().getCurrentTid();
    }

    function getNodeMaxTid(address nodeAddress) external view returns (uint256) {
        return _Storage().getNodeMaxTid(nodeAddress);
    }

    function exist(uint256 tid) external view returns (bool) {
        return _Storage().exist(tid);
    }

    function isOver(uint256 tid) external view returns (bool) {
        return _Storage().isOver(tid);
    }

    function isNodeDoingAddFile(address nodeAddress, string calldata cid) external view returns (bool) {
        return _Storage().isNodeDoingAddFile(nodeAddress, cid);
    }

    function getTask(uint256 tid) external view returns (address, uint256, address, bool, string memory) {
        return _Storage().getTask(tid);
    }

    function getTaskState(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        return _Storage().getTaskState(tid);
    }

    function getAddFileTaskProgress(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return _Storage().getAddFileTaskProgress(tid);
    }
}
