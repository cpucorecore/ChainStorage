pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IFileManager.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./interfaces/IUserManager.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/ISetting.sol";

contract FileManager is Importable, ExternalStorable, IFileManager {
    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_FILE_MANAGER);
        imports = [
        CONTRACT_USER_MANAGER,
        CONTRACT_NODE_MANAGER,
        CONTRACT_SETTING
        ];
    }

    function _Storage() private view returns (IFileStorage) {
        return IFileStorage(getStorage());
    }

    function _UserManager() private view returns (IUserManager) {
        return IUserManager(requireAddress(CONTRACT_USER_MANAGER));
    }

    function _NodeManager() private view returns (INodeManager) {
        return INodeManager(requireAddress(CONTRACT_NODE_MANAGER));
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function addFile(string calldata cid, address userAddress) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER_MANAGER);

        waitCallback = false;

        uint256 status = _Storage().getStatus(cid);
        require(DefaultStatus == status ||
                FileAdded == status ||
                FilePartialAdded == status, "F:wrong status");

        uint256 replica = _Setting().getReplica();
        if (DefaultStatus == status) {
            _Storage().newFile(cid, replica);
            _Storage().setStatus(cid, FileTryAdd);
            _NodeManager().addFile(cid);
            waitCallback = true;
        }

        if (!_Storage().userExist(cid, userAddress)) {
            _Storage().addUser(cid, userAddress);
        }
    }

    function onBeginAddFile(string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileTryAdd == status, "F:wrong status");
        _Storage().setStatus(cid, FileAdding);
        _Storage().setSize(cid, size);
    }

    function onEndAddFile(string calldata cid, address[] calldata nodeAddresses) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        if (0 == nodeAddresses.length) {
            _Storage().setStatus(cid, FileAddFailed);
        } else if (_Setting().getReplica() == nodeAddresses.length) { // TODO: _Setting().getReplica() may changed
            _Storage().setStatus(cid, FileAdded);
        } else {
            _Storage().setStatus(cid, FilePartialAdded);
        }

        if (0 != nodeAddresses.length) {
            _Storage().addNodes(cid, nodeAddresses);
        }
    }

    function deleteFile(string calldata cid, address userAddress) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER_MANAGER);

        waitCallback = false;

        uint256 status = _Storage().getStatus(cid);
        require(FileAddFailed == status ||
                FilePartialAdded == status ||
                FileAdded == status, "F:wrong status");

        _Storage().deleteUser(cid, userAddress);
        if (_Storage().userEmpty(cid)) {
            if (FileAddFailed == status) {
                _Storage().deleteFile(cid);
            } else {
                _Storage().setStatus(cid, FileTryDelete);
                _NodeManager().deleteFile(cid);
                waitCallback = true;
            }
        }

        return waitCallback;
    }

    function onBeginDeleteFile(string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileTryDelete == status, "F:wrong status");
        _Storage().setStatus(cid, FileDeleting);
    }

    function onEndDeleteFile(string calldata cid, address[] calldata nodeAddresses) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        if (0 == nodeAddresses.length) {
            _Storage().setStatus(cid, FileDeleteFailed);
        } else if (_Storage().getNodes(cid).length == nodeAddresses.length) {
            _Storage().deleteFile(cid);
        } else {
            _Storage().setStatus(cid, FilePartialAdded);
        }
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return _Storage().getSize(cid);
    }

    function getNodes(string calldata cid) external view returns (address[] memory) {
        return _Storage().getNodes(cid);
    }

    function getNodeNumber(string calldata cid) external view returns (uint256) {
        return _Storage().getNodes(cid).length;
    }

    function getReplica(string calldata cid) external view returns (uint256) {
        return _Storage().getReplica(cid);
    }
}
