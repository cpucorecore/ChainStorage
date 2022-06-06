pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2; // use this can make contract size smaller

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/ITaskManager.sol";
import "./interfaces/IFileManager.sol";
import "./lib/NodeSelector.sol";

contract NodeManager is Importable, ExternalStorable, INodeManager {
    using NodeSelector for address;

    event NodeStatusChanged(address indexed addr, uint256 from, uint256 to);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_NODE_MANAGER);
        imports = [
        CONTRACT_SETTING,
        CONTRACT_TASK_MANAGER,
        CONTRACT_FILE_MANAGER,
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

    function _TaskManager() private view returns (ITaskManager) {
        return ITaskManager(requireAddress(CONTRACT_TASK_MANAGER));
    }

    function _FileManager() private view returns (IFileManager) {
        return IFileManager(requireAddress(CONTRACT_FILE_MANAGER));
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

    function addFile(address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_FILE_MANAGER);

        uint256 replica = _Setting().getReplica();
        require(0 != replica, "N:replica is 0");

        (address[] memory nodeAddresses, bool success) = getStorage().selectNodes(replica);
        require(success, "N:no available node");

        for(uint256 i=0; i< nodeAddresses.length; i++) {
            _TaskManager().issueTask(Add, userAddress, cid, nodeAddresses[i], false);
        }
    }

    function _nodeMustExist(address nodeAddress) private view {
        require(_Storage().exist(nodeAddress), "N:node not exist");
    }

    function finishTask(address nodeAddress, uint256 tid, uint256 size) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        (address userAddress, uint256 action,,bool noCallback, string memory cid) = _TaskManager().getTask(tid);

        if(Add == action) {
            _FileManager().onNodeAddFileFinish(nodeAddress, userAddress, cid, size);
            _Storage().useStorage(nodeAddress, size);
            _Storage().resetAddFileFailedCount(cid);
        } else if(Delete == action) {
            _Storage().freeStorage(nodeAddress, _FileManager().getSize(cid));
            if(!noCallback) {
                _FileManager().onNodeDeleteFileFinish(nodeAddress, userAddress, cid);
            }
        }

        _TaskManager().finishTask(nodeAddress, tid);
        _Storage().popTaskFront(nodeAddress);
    }

    function failTask(address nodeAddress, uint256 tid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        (address userAddress, uint256 action,,,string memory cid) = _TaskManager().getTask(tid);

        uint256 maxAddFileFailedCount = _Setting().getMaxAddFileFailedCount();
        uint256 addFileFailedCount = _Storage().upAddFileFailedCount(cid);
        if(Add == action) {
            _Storage().popTaskFront(nodeAddress);
        }

        if(addFileFailedCount >= maxAddFileFailedCount) {
            _FileManager().onAddFileFail(userAddress, cid);
            return;
        }

        if(Add == action) {
            if(_FileManager().getNodeNumber(cid) < _Setting().getReplica()) {
                _retryAddFileTask(userAddress, cid, nodeAddress);
            }
        }

        _TaskManager().failTask(nodeAddress, tid);
    }

    function reportAcceptTaskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_MONITOR);
        (address userAddress, uint256 action, address nodeAddress, , string memory cid) = _TaskManager().getTask(tid);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        _offline(nodeAddress);
        _TaskManager().acceptTaskTimeout(tid);
        if(Add == action) {
            if(_FileManager().getNodeNumber(cid) < _Setting().getReplica()) {
                _retryAddFileTask(userAddress, cid, nodeAddress);
            }
            _Storage().popTaskFront(nodeAddress);
        }
    }

    function reportTaskTimeout(uint256 tid) external {
        mustAddress(CONTRACT_MONITOR);
        (address userAddress, uint256 action, address nodeAddress, , string memory cid) = _TaskManager().getTask(tid);
        require(_Storage().firstTaskInTaskQueue(nodeAddress) == tid, "N:must do task by queue");
        _offline(nodeAddress);
        _TaskManager().taskTimeout(tid);

        if(Add == action) {
            _Storage().popTaskFront(nodeAddress);
            uint256 maxAddFileFailedCount = _Setting().getMaxAddFileFailedCount();
            uint256 addFileFailedCount = _Storage().upAddFileFailedCount(cid);
            if(addFileFailedCount >= maxAddFileFailedCount) {
                _FileManager().onAddFileFail(userAddress, cid);
                return;
            }
            if(_FileManager().getNodeNumber(cid) < _Setting().getReplica()) {
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

    function _retryAddFileTask(address userAddress, string memory cid, address excludedAddress) private {
        address nodeStorageAddress = getStorage();
        (address node, bool success) = nodeStorageAddress.selectOneNode(requireAddress(CONTRACT_FILE_MANAGER), requireAddress(CONTRACT_TASK_MANAGER), excludedAddress, cid);
        require(success, "N:no available node");
        _TaskManager().issueTask(Add, userAddress, cid, node, false);
    }

    function taskIssuedCallback(address nodeAddress, uint256 tid) external {
        mustAddress(CONTRACT_TASK_MANAGER);
        _Storage().pushTaskBack(nodeAddress, tid);
    }
}
