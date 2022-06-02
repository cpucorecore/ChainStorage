pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IFile.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./interfaces/IUser.sol";
import "./interfaces/INode.sol";
import "./interfaces/ITask.sol";

contract File is Importable, ExternalStorable, IFile {
    event TryRequestAddFile(uint256 sid, string cid);
    event TryRequestDeleteFile(uint256 sid, string cid, address[] nodeAddresses);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_FILE);
        imports = [
            CONTRACT_USER,
            CONTRACT_NODE,
            CONTRACT_TASK
        ];
    }

    function _Storage() private view returns (IFileStorage) {
        return IFileStorage(getStorage());
    }

    function _User() private view returns (IUser) {
        return IUser(requireAddress(CONTRACT_USER));
    }

    function _Node() private view returns (INode) {
        return INode(requireAddress(CONTRACT_NODE));
    }

    function _Task() private view returns (ITask) {
        return ITask(requireAddress(CONTRACT_TASK));
    }

    function addFile(address userAddress, string calldata cid, uint256 size) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER);

        waitCallback = false;

        uint256 status = _Storage().getStatus(cid);
        require(DefaultStatus == status || FileAdded == status, "F:wrong status");

        _Storage().addUser(cid, userAddress);
        if (DefaultStatus == status) {
            _Storage().newFile(cid, size);
            _Storage().setStatus(cid, FileAdding);

            _Node().addFile(userAddress, cid, size);
            waitCallback = true;
        }
    }

    function onNodeAddFileFinish(address nodeAddress, address userAddress, string calldata cid, uint256 size, uint256 replica) external {
        mustAddress(CONTRACT_NODE);

        uint256 status = _Storage().getStatus(cid);
        require(FileAdding == status || FilePartialAdded == status, "F:wrong status");

        if (!_Storage().nodeExist(cid, nodeAddress)) {
            _Storage().addNode(cid, nodeAddress);
        }

        _Storage().setStatus(cid, FilePartialAdded);
        if (replica == _Storage().getNodesNumber(cid)) {
            _Storage().upTotalSize(size);
            _Storage().setStatus(cid, FileAdded);
            _User().onAddFileFinish(userAddress, cid);
        }
    }

    function onAddFileFail(address userAddress, string calldata cid, uint256 reason) external {
        mustAddress(CONTRACT_NODE);

        require(0 == _Storage().getNodesNumber(cid), "F:nodes not empty");
        uint256 size = _Storage().getSize(cid);
        _Storage().deleteFile(cid);//////////////////////???????
        _User().onAddFileFail(userAddress, cid, size, reason);
    }

    function deleteFile(address userAddress, string calldata cid) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER);

        require(_Storage().exist(cid), "F:file not exist");

        waitCallback = false;

        if (_Storage().userExist(cid, userAddress)) {
            _Storage().deleteUser(cid, userAddress);
        }

        if (_Storage().userEmpty(cid)) {
            if (_Storage().nodeEmpty(cid)) {
                _Storage().deleteFile(cid);
                _Storage().downTotalSize(_Storage().getSize(cid));
            } else {
                address[] memory nodeAddresses = _Storage().getNodes(cid);
                for(uint i=0; i<nodeAddresses.length; i++) {
                    _Task().issueDeleteFileTask(userAddress, cid, nodeAddresses[i], false);
                }

                waitCallback = true;
            }
        }
    }

    function onNodeDeleteFileFinish(address nodeAddress, address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_NODE);

        if (_Storage().nodeExist(cid, nodeAddress)) {
            _Storage().deleteNode(cid, nodeAddress);
        }

        if (_Storage().nodeEmpty(cid)) {
            uint256 size = _Storage().getSize(cid);
            if(_Storage().userEmpty(cid)) {
                _Storage().deleteFile(cid);
                _Storage().downTotalSize(size);
            }

            _User().onDeleteFileFinish(userAddress, cid, size);
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
}
