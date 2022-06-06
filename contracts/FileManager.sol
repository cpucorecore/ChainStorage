pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IFileManager.sol";
import "./interfaces/storages/IFileStorage.sol";
import "./interfaces/IUserManager.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/ITaskManager.sol";

contract FileManager is Importable, ExternalStorable, IFileManager {
    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_FILE_MANAGER);
        imports = [
        CONTRACT_USER_MANAGER,
        CONTRACT_NODE_MANAGER,
        CONTRACT_TASK_MANAGER
        ];
    }

    function _Storage() private view returns (IFileStorage) {
        return IFileStorage(getStorage());
    }

    function _User() private view returns (IUserManager) {
        return IUserManager(requireAddress(CONTRACT_USER_MANAGER));
    }

    function _Node() private view returns (INodeManager) {
        return INodeManager(requireAddress(CONTRACT_NODE_MANAGER));
    }

    function _Task() private view returns (ITaskManager) {
        return ITaskManager(requireAddress(CONTRACT_TASK_MANAGER));
    }


    function addFile(string calldata cid, address userAddress) external returns (bool waitCallback) {
        mustAddress(CONTRACT_USER_MANAGER);

        waitCallback = false;

        if (!_Storage().exist(cid)) { // TODO file.exist(cid) == true but file may add failed, should use file.status to judge
            _Storage().newFile(cid);
            _Node().addFile(userAddress, cid);
            waitCallback = true;
        }

        if (!_Storage().userExist(cid, userAddress)) {
            _Storage().addUser(cid, userAddress);
        }
    }

    function onNodeAddFileFinish(address nodeAddress, address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_NODE_MANAGER);

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
        mustAddress(CONTRACT_NODE_MANAGER);
        _User().onAddFileFail(userAddress, cid);
    }

    function deleteFile(string calldata cid, address userAddress) external returns (bool finish) {
        mustAddress(CONTRACT_USER_MANAGER);

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
        mustAddress(CONTRACT_NODE_MANAGER);

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

    function getNodes(string calldata cid) external view returns (address[] memory) {
        return _Storage().getNodes(cid);
    }

    function getNodeNumber(string calldata cid) external view returns (uint256) {
        return _Storage().getNodes(cid).length;
    }
}
