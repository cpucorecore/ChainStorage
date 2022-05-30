pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IUser.sol";
import "./interfaces/storages/IUserStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/IFile.sol";

contract User is Importable, ExternalStorable, IUser {
    event UserAction(address indexed userAddress, uint256 action, string cid);
    event FileAdded(address indexed userAddress, string cid);
    event FileAddFailed(address indexed userAddress, string cid);
    event FileDeleted(address indexed userAddress, string cid);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_USER);
        imports = [
            CONTRACT_SETTING,
            CONTRACT_FILE,
            CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns (IUserStorage) {
        return IUserStorage(getStorage());
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function _File() private view returns (IFile) {
        return IFile(requireAddress(CONTRACT_FILE));
    }

    function register(address userAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(!_Storage().exist(userAddress), "U:user exist");
        _Storage().newUser(userAddress, _Setting().getInitSpace(), ext);
    }

    function setExt(address userAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        _Storage().setExt(userAddress, ext);
    }

    function setStorageTotal(address userAddress, uint256 size) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(size >= _Storage().getStorageUsed(userAddress), "U:storage space too small");
        _Storage().setStorageTotal(userAddress, size);
    }

    function deRegister(address userAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(0 == _Storage().getFileNumber(userAddress), "U:files not empty");
        _Storage().deleteUser(userAddress);
    }

    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(!_Storage().fileExist(userAddress, cid), "U:file exist");
        require(_Storage().availableSpace(userAddress) > 0, "U:storage space not enough");

        emit UserAction(userAddress, Add, cid);

        bool exist = _File().addFile(cid, userAddress);
        if(exist) {
            uint256 size = _File().getSize(cid);
            require(size > 0, "U:file size zero, file in processing, please wait a moment and try again");
            _Storage().useStorage(userAddress, size, true);
            emit FileAdded(userAddress, cid);
        }
        _Storage().addFile(userAddress, cid, duration, ext);
    }

    function onAddFileFinish(address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_FILE);
        if(_Storage().fileExist(userAddress, cid)) {
            _Storage().useStorage(userAddress, size, false);
            emit FileAdded(userAddress, cid);
        }
    }

    function onAddFileFail(address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_FILE);
        _Storage().upInvalidAddFileCount(userAddress);

        emit FileAddFailed(userAddress, cid);
    }

    function deleteFile(address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:file not exist");

        emit UserAction(userAddress, Delete, cid);

        uint256 size = _File().getSize(cid);
        bool finish = _File().deleteFile(cid, userAddress);
        if(finish) {
            _Storage().freeStorage(userAddress, size);
            emit FileDeleted(userAddress, cid);
        }
    }

    function onDeleteFileFinish(address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_FILE);
        _Storage().deleteFile(userAddress, cid);
        _Storage().freeStorage(userAddress, size);

        emit FileDeleted(userAddress, cid);
    }

    function setFileExt(address userAddress, string calldata cid, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:no file");
        _Storage().setFileExt(userAddress, cid, ext);
    }

    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:file not exist");
        _Storage().setFileDuration(userAddress, cid, duration);
    }
}
