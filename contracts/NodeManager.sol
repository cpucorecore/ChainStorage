pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2; // use this can make contract size smaller

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/IFileManager.sol";

contract NodeManager is Importable, ExternalStorable, INodeManager {
    event NodeStatusChanged(address indexed nodeAddress, uint256 from, uint256 to);

    event TryRequestAddFile(string cid);
    event RequestAddFile(string cid, address[] nodeAddresses);

    event TryRequestDeleteFile(string cid, address[] nodeAddresses);
    event RequestDeleteFile(string cid, address[] nodeAddresses);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_NODE_MANAGER);

        imports = [
        CONTRACT_SETTING,
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
        mustAddress(CONTRACT_CHAIN_STORAGE);

        _nodeMustExist(nodeAddress);
        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeRegistered == status || NodeMaintain == status, "N:wrong status must[RM]");
        (bytes32[] memory cidHashes, bool finish) = _Storage().getCidHashes(nodeAddress, 1, 50);
        require(0 == cidHashes.length, "N:cid not empty");
        _Storage().deleteNode(nodeAddress);

        emit NodeStatusChanged(nodeAddress, status, DefaultStatus);
    }

    function online(address nodeAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _nodeMustExist(nodeAddress);

        uint256 status = _Storage().getStatus(nodeAddress);
        require(NodeRegistered == status || NodeMaintain == status || NodeOffline == status, "N:wrong status[RMO]");

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
        if (count == _FileManager().getReplica(cid)) {
        (bool sizeConsistent, uint256 size) = _Storage().isSizeConsistent(cid);
            if (sizeConsistent) {
                _FileManager().onBeginAddFile(cid, size);
                address[] memory nodeAddresses = _Storage().getCanAddCidNodeAddresses(cid);
                emit RequestAddFile(cid, nodeAddresses);
            }
        }
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external {
        bool allNodeFinishAddFile = _Storage().nodeAddFile(nodeAddress, cid);
        if (allNodeFinishAddFile) {
            _FileManager().onEndAddFile(cid, _Storage().getNodeAddresses(cid));
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
            emit RequestDeleteFile(cid, nodeAddresses);
        }
    }

    function nodeDeleteFile(address nodeAddress, string calldata cid) external {
        bool allNodeFinishDeleteFile = _Storage().nodeDeleteFile(nodeAddress, cid);
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
