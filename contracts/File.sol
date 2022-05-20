pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IFile.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./interfaces/IUser.sol";
import "./interfaces/INode.sol";
import "./interfaces/ITask.sol";

contract File is Importable, ExternalStorable, IFile {
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

    function addFile(string calldata cid, address userAddress) external returns (bool finish) {
        mustAddress(CONTRACT_USER);

        if(!_Storage().exist(cid)) {
            _Storage().newFile(cid);
            _Node().addFile(userAddress, cid);
        } else {
            finish = true;
        }

        if(!_Storage().userExist(cid, userAddress)) {
            _Storage().addUser(cid, userAddress);
        }
    }

    function onNodeAddFileFinish(address nodeAddress, address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_NODE);

        if(_Storage().exist(cid)) {
            if(_Storage().nodeEmpty(cid)) {
                _User().onAddFileFinish(userAddress, cid, size);
                _Storage().setSize(cid, size);
                _Storage().upTotalSize(size);
            }

            if(!_Storage().nodeExist(cid, nodeAddress)) {
                _Storage().addNode(cid, nodeAddress);
            }
        } else {
            _Task().issueTask(Delete, userAddress, cid, nodeAddress, true);
        }
    }

    function onAddFileFail(address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_NODE);
        _User().onAddFileFail(userAddress, cid);
    }

    function deleteFile(string calldata cid, address userAddress) external returns (bool finish) {
        mustAddress(CONTRACT_USER);

        require(_Storage().exist(cid), "F:file not exist");

        if(_Storage().userExist(cid, userAddress)) {
            _Storage().deleteUser(cid, userAddress);
        }

        if(_Storage().userEmpty(cid)) {
            if(_Storage().nodeEmpty(cid)) {
                _Storage().deleteFile(cid);
                _Storage().downTotalSize(_Storage().getSize(cid));
                finish = true;
            } else {
                address[] memory nodeAddresses = _Storage().getNodes(cid);
                for(uint i=0; i< nodeAddresses.length; i++) {
                    _Task().issueTask(Delete, userAddress, cid, nodeAddresses[i], false);
                }
            }
        } else {
            finish = true;
        }
    }

    function onNodeDeleteFileFinish(address nodeAddress, address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_NODE);

        if(_Storage().nodeExist(cid, nodeAddress)) {
            _Storage().deleteNode(cid, nodeAddress);
        }

        if(_Storage().nodeEmpty(cid)) {
            uint256 size = _Storage().getSize(cid);
            _User().onDeleteFileFinish(userAddress, cid, size);
            if(_Storage().userEmpty(cid)) {
                _Storage().deleteFile(cid);
                _Storage().downTotalSize(size);
            }
        }
    }

    function getSize(string calldata cid) external view returns (uint256) {
        return _Storage().getSize(cid);
    }
}
