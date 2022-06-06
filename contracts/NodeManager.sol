pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2; // use this can make contract size smaller

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/ITaskManager.sol";
import "./interfaces/IFileManager.sol";

contract NodeManager is Importable, ExternalStorable, INodeManager {
    event NodeStatusChanged(address indexed nodeAddress, uint256 from, uint256 to);

    event TryRequestAddFile(string cid);
    event RequestAddFile(string cid, uint256 tid);

    event TryRequestDeleteFile(string cid, address[] nodeAddresses);
    event RequestDeleteFile(string cid, uint256 tid);

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

    function addFile(string calldata cid) external {
        mustAddress(CONTRACT_FILE_MANAGER);
        emit TryRequestAddFile(cid);
    }

    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external {
        uint256 count = _Storage().nodeCanAddFile(nodeAddress, cid, size);
        if (count == _Setting().getReplica()) {
            if (_Storage().isSizeConsistent(cid)) {
                _FileManager().onBeginAddFile(cid, size);
                address[] memory nodeAddresses = _Storage().getCanAddCidNodeAddresses(cid);
                uint256 tid = _TaskManager().issueTask(Add, cid, nodeAddresses);
                emit RequestAddFile(cid, tid);
            }
        }
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external {
        uint256 allNodeFinishAddFile = _Storage().nodeAddFile(cid, nodeAddress);
        if (allNodeFinishAddFile) {
            _FileManager().onEndAddFile(cid, _Storage().getNodeAddresses(cid));
            // TODO: tell task node finish add file
        }
    }

    function deleteFile(string calldata cid) external {
        mustAddress(CONTRACT_FILE_MANAGER);
        address[] memory nodeAddresses = _Storage().getNodeAddresses(cid);
        emit TryRequestDeleteFile(cid, nodeAddresses);
    }

    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external {
        bool allNodeCanDeleteFile = _Storage().nodeCanDeleteFile(nodeAddress, cid);
        if (allNodeCanDeleteFile) {
            _FileManager().onBeginDeleteFile(cid);
            address[] memory nodeAddresses = _Storage().getNodeAddresses(cid);
            uint256 tid = _TaskManager().issueTask(Delete, cid, nodeAddresses);
            emit RequestDeleteFile(cid, tid);
        }
    }

    function nodeDeleteFile(address nodeAddress, string calldata cid) external {
        uint256 allNodeFinishDeleteFile = _Storage().nodeDeleteFile(cid, nodeAddress);
        if (allNodeFinishDeleteFile) {
            _FileManager().onEndDeleteFile(cid, _Storage().getNodeAddresses(cid));
        }
    }

    function _nodeMustExist(address nodeAddress) private view {
        require(_Storage().exist(nodeAddress), "N:node not exist");
    }

    function _offline(address nodeAddress) private {
        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeOnline == status, "N:wrong status must[O]");

        _Storage().setStatus(nodeAddress, NodeOffline);
        _Storage().deleteOnlineNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, NodeOffline);
    }
}
