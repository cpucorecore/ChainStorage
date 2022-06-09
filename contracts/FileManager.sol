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
        require(DefaultStatus == status || FileAdded == status, "F:wrong status");

        if (DefaultStatus == status) {
            waitCallback = true;
            _Storage().newFile(cid, _Setting().getReplica());
            _NodeManager().addFile(cid);
        }

        if (!_Storage().userExist(cid, userAddress)) { // TODO check remove this judgement?
            _Storage().addUser(cid, userAddress);
        }
    }

    function onBeginAddFile(string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileTryAdd == status, "F:wrong status");
        require(size > 0, "F:size must>0");

        _Storage().setSize(cid, size);
        _Storage().setStatus(cid, FileAdding);
    }

    function onNodeAddFile(address nodeAddress, string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileAdding == status || FilePartialAdded == status, "F:wrong status");
        require(!_Storage().nodeExist(cid, nodeAddress), "F:node exist");

        _Storage().addNode(cid, nodeAddress);
        _Storage().setStatus(cid, FilePartialAdded);
    }

    function onEndAddFile(string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FilePartialAdded == status, "F:wrong status");

        _Storage().setStatus(cid, FileAdded);
        _UserManager().onAddFileFinish(_Storage().getUsers(cid), cid, _Storage().getSize(cid));
    }

    function deleteFile(string calldata cid, address userAddress) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER_MANAGER);

        waitCallback = false;

        uint256 status = _Storage().getStatus(cid);
        require(FileAdded == status, "F:wrong status");

        _Storage().deleteUser(cid, userAddress);
        if (_Storage().userEmpty(cid)) {
            waitCallback = true;
            _Storage().setStatus(cid, FileTryDelete);
            _Storage().setLastUser(cid, userAddress);
            _NodeManager().deleteFile(cid);
        }

        return waitCallback;
    }

    function onBeginDeleteFile(string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileTryDelete == status, "F:wrong status");

        _Storage().setStatus(cid, FileDeleting);
    }

    function onNodeDeleteFile(address nodeAddress, string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FileDeleting == status || FilePartialDeleted == status, "F:wrong status");
        require(_Storage().nodeExist(cid, nodeAddress), "F:node not exist");

        _Storage().deleteNode(cid, nodeAddress);
        _Storage().setStatus(cid, FilePartialDeleted);
    }

    function onEndDeleteFile(string calldata cid) external {
        mustAddress(CONTRACT_NODE_MANAGER);

        uint256 status = _Storage().getStatus(cid);
        require(FilePartialDeleted == status, "F:wrong status");

        uint256 size = _Storage().getSize(cid);
        _Storage().deleteFile(cid);
        _UserManager().onDeleteFileFinish(_Storage().getLastUser(cid), cid, size);
    }

    function exist(string calldata cid) external view returns (bool) {
        return _Storage().exist(cid);
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return _Storage().getSize(cid);
    }

    function getReplica(string calldata cid) external view returns (uint256) {
        return _Storage().getReplica(cid);
    }
}
