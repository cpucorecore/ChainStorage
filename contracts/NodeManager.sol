pragma solidity ^0.5.2;
pragma experimental ABIEncoderV2; // use this can make contract size smaller

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/storages/INodeStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/IFileManager.sol";

contract NodeManager is Importable, ExternalStorable, INodeManager {
    event TryRequestAddFile(string cid);
    event RequestAddFile(string cid, address[] nodeAddresses);

    event TryRequestDeleteFile(string cid, address[] nodeAddresses);
    event RequestDeleteFile(string cid, address[] nodeAddresses);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_NODE_MANAGER);

        imports = [
        CONTRACT_SETTING,
        CONTRACT_FILE_MANAGER,
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
    }

    function setExt(address nodeAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _checkNodeExist(nodeAddress);
        _Storage().setExt(nodeAddress, ext);
    }

    function setStorageTotal(address nodeAddress, uint256 storageTotal) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        _checkNodeExist(nodeAddress);
        require(storageTotal >= _Storage().getStorageUsed(nodeAddress), "N:too small");
        _Storage().setStorageTotal(nodeAddress, storageTotal);
    }

    function deRegister(address nodeAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        _checkNodeExist(nodeAddress);
        (bytes32[] memory cidHashes,) = _Storage().getCidHashes(nodeAddress, 1, 50);
        require(0 == cidHashes.length, "N:cid not empty");
        _Storage().deleteNode(nodeAddress);
    }

    function addFile(string calldata cid) external {
        mustAddress(CONTRACT_FILE_MANAGER);
        emit TryRequestAddFile(cid);
    }

    function nodeCanAddFile(address nodeAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_FileManager().exist(cid), "N:file not exist");

        uint256 maxNodeCanAddFile = _Setting().getMaxNodeCanAddFileCount();
        require(_Storage().getNodeCanAddFileCount(nodeAddress) < maxNodeCanAddFile, "N:must finish addFile");

        uint256 replica = _FileManager().getReplica(cid);
        require(_Storage().getCanAddFileNodeCount(cid) < replica, "N:can addFile node enough");

        uint256 count = _Storage().nodeCanAddFile(nodeAddress, cid, size);
        if (count == replica) {
            if (_Storage().isSizeConsistent(cid)) {
                _FileManager().onBeginAddFile(cid, size);
                address[] memory nodeAddresses = _Storage().getCanAddFileNodeAddresses(cid);
                emit RequestAddFile(cid, nodeAddresses);
            }
        }
    }

    function nodeAddFile(address nodeAddress, string calldata cid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().isCanAddFile(nodeAddress, cid), "N:can't add file");
        require(!_Storage().isFileAdded(nodeAddress, cid), "N:can't add file duplicated");

        _Storage().useStorage(nodeAddress, _FileManager().getSize(cid));
        bool allNodeFinishAddFile = _Storage().nodeAddFile(nodeAddress, cid);

        _FileManager().onNodeAddFile(nodeAddress, cid);
        if (allNodeFinishAddFile) {
            _FileManager().onEndAddFile(cid);
        }
    }

    function deleteFile(string calldata cid) external {
        mustAddress(CONTRACT_FILE_MANAGER);

        address[] memory nodeAddresses = _Storage().getNodeAddresses(cid);
        emit TryRequestDeleteFile(cid, nodeAddresses);
    }

    function nodeCanDeleteFile(address nodeAddress, string calldata cid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_FileManager().exist(cid), "N:file not exist");
        require(_Storage().fileExist(nodeAddress, cid), "N:node have not the file");

        uint256 maxNodeCanDeleteFile = _Setting().getMaxNodeCanDeleteFileCount();
        require(_Storage().getCanDeleteFileCount(nodeAddress) < maxNodeCanDeleteFile, "N:must finish deleteFile");

        bool allNodeCanDeleteFile = _Storage().nodeCanDeleteFile(nodeAddress, cid);
        if (allNodeCanDeleteFile) {
            _FileManager().onBeginDeleteFile(cid);
            address[] memory nodeAddresses = _Storage().getNodeAddresses(cid);
            emit RequestDeleteFile(cid, nodeAddresses);
        }
    }

    function nodeDeleteFile(address nodeAddress, string calldata cid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().isFileAdded(nodeAddress, cid), "N:can't delete file not added");

        _Storage().freeStorage(nodeAddress, _FileManager().getSize(cid));
        bool allNodeFinishDeleteFile = _Storage().nodeDeleteFile(nodeAddress, cid);
        _FileManager().onNodeDeleteFile(nodeAddress, cid);
        if (allNodeFinishDeleteFile) {
            _FileManager().onEndDeleteFile(cid);
        }
    }

    function _checkNodeExist(address nodeAddress) private view {
        require(_Storage().exist(nodeAddress), "N:node not exist");
    }
}
