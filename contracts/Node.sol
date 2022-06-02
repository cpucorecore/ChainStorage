pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2; // use this can make contract size smaller

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/INode.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/ITask.sol";
import "./interfaces/IFile.sol";
import "./lib/NodeSelector.sol";
import "./base/DataTypes.sol";

contract Node is Importable, ExternalStorable, INode {
    using NodeSelector for address;

    event NodeStatusChanged(address indexed addr, uint256 from, uint256 to);

    event WrongFileSize(address userAddress, address nodeAddress, uint256 userClaimSize);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_NODE);
        imports = [
            CONTRACT_SETTING,
            CONTRACT_TASK,
            CONTRACT_FILE,
            CONTRACT_MONITOR,
            CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns (INodeStorage) {
        return INodeStorage(getStorage());
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function _Task() private view returns (ITask) {
        return ITask(requireAddress(CONTRACT_TASK));
    }

    function _File() private view returns (IFile) {
        return IFile(requireAddress(CONTRACT_FILE));
    }

    function register(address nodeAddress, uint256 storageTotal, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(!_Storage().exist(nodeAddress), "N:node exist");
        _Storage().newNode(nodeAddress, storageTotal, ext);
        emit NodeStatusChanged(nodeAddress, DefaultStatus, NodeRegistered);
    }

    function setExt(address nodeAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _nodeMustExist(nodeAddress);
        _Storage().setExt(nodeAddress, ext);
    }

    function setStorageTotal(address nodeAddress, uint256 storageTotal) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _nodeMustExist(nodeAddress);
        require(storageTotal >= _Storage().getStorageUsed(nodeAddress), "N:too small");
        _Storage().setStorageTotal(nodeAddress, storageTotal);
    }

    function deRegister(address nodeAddress) external {
        // TODO node should delete cids and report the cids before deRegister
        mustAddress(CONTRACT_CHAIN_STORAGE);

        _nodeMustExist(nodeAddress);
        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeRegistered == status || NodeMaintain == status, "N:wrong status must[RM]");
        _Storage().deleteNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, DefaultStatus);
    }

    function online(address nodeAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _nodeMustExist(nodeAddress);

        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeRegistered == status || NodeMaintain == status || NodeOffline == status, "N:wrong status[RMO]");

        uint256 nodeTasksLength = _Storage().getTasks(nodeAddress).length;
        require(0 == nodeTasksLength, "N:can't online before finish all tasks");

        _Storage().setStatus(nodeAddress, NodeOnline);
        _Storage().addOnlineNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, NodeOnline);
    }

    function maintain(address nodeAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _nodeMustExist(nodeAddress);

        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeOnline == status, "N:wrong status must[O]");

        _Storage().setStatus(nodeAddress, NodeMaintain);
        _Storage().deleteOnlineNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, NodeMaintain);
    }

    function addFile(address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_FILE);

        uint256 replica = _Setting().getReplica();
        require(0 != replica, "N:replica is 0");

        (address[] memory nodeAddresses, bool success) = getStorage().selectNodes(replica);
        require(success, "N:no available node");

        for(uint256 i=0; i<nodeAddresses.length; i++) {
            _Storage().useStorage(nodeAddresses[i], size);
            _Task().issueAddFileTask(userAddress, cid, size, nodeAddresses[i], replica);
        }
    }

    function _nodeMustExist(address nodeAddress) private view {
        require(_Storage().exist(nodeAddress), "N:node not exist");
    }

    function finishTask(address nodeAddress, uint256 tid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by task queue");

        DataTypes.TaskItem memory task = _Task().getTask(tid);
        if (Add == task.action) {
            _File().onNodeAddFileFinish(nodeAddress, task.user, task.cid, task.size, task.replica);
        } else if (Delete == action) {
            _Storage().freeStorage(nodeAddress, task.size);
            _File().onNodeDeleteFileFinish(nodeAddress, task.user, task.cid);
        }

        _Task().finishTask(nodeAddress, tid);
        _Storage().popTaskFront(nodeAddress);
    }

    function failTask(address nodeAddress, uint256 tid, uint256 reason) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        require(QueryFileSizeTimeout == reason || WrongFileSize == reason, "N:wrong reason");

        DataTypes.TaskItem memory task = _Task().getTask(tid);
        require(Add == task.action, "N:only add file task can fail");

        _Storage().freeStorage(nodeAddress, task.size);
        _Storage().popTaskFront(nodeAddress);
        _Task().failTask(nodeAddress, tid, reason);
        _File().onAddFileFail(task.user, task.cid, reason);
    }

    function reportAcceptTaskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_MONITOR);
        (address userAddress, uint256 action, address nodeAddress, , string memory cid) = _Task().getTask(tid);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        _offline(nodeAddress);
        _Task().acceptTaskTimeout(tid);
        if(Add == action) {
            if(_File().getNodeNumber(cid) < _Setting().getReplica()) {
                _retryAddFileTask(userAddress, cid, nodeAddress);
            }
            _Storage().popTaskFront(nodeAddress);
        }
    }

    function reportTaskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_MONITOR);

        (address userAddress, uint256 action, address nodeAddress, , string memory cid) = _Task().getTask(tid);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        _offline(nodeAddress);
        _Task().taskTimeout(tid);

        if(Add == action) {
            _Storage().popTaskFront(nodeAddress);
            uint256 maxAddFileFailedCount = _Setting().getMaxAddFileFailedCount();
            uint256 addFileFailedCount = _Storage().upAddFileFailedCount(cid);
            if(addFileFailedCount >= maxAddFileFailedCount) {
                _File().onAddFileFail(userAddress, cid);
                return;
            }
            if(_File().getNodeNumber(cid) < _Setting().getReplica()) {
                _retryAddFileTask(userAddress, cid, nodeAddress);
            }
        }
    }

    function _offline(address nodeAddress) private {
        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeOnline == status, "N:wrong status must[O]");

        _Storage().setStatus(nodeAddress, NodeOffline);
        _Storage().deleteOnlineNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, NodeOffline);
    }

    // TODO change to _retryTask
    function _retryAddFileTask(address userAddress, string memory cid, address excludedAddress) private {
        address nodeStorageAddress = getStorage();
        (address node, bool success) = nodeStorageAddress.selectOneNode(requireAddress(CONTRACT_FILE), requireAddress(CONTRACT_TASK), excludedAddress, cid);
        require(success, "N:no available node");
        _Task().issueAddFileTask(userAddress, cid, size, node, replica);
    }

    function taskIssuedCallback(address nodeAddress, uint256 tid) external {
        mustAddress(CONTRACT_TASK);
        _Storage().pushTaskBack(nodeAddress, tid);
    }
}
