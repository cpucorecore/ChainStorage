pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IUserManager.sol";
import "./interfaces/storages/IUserStorage.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/IFileManager.sol";

contract UserManager is Importable, ExternalStorable, IUserManager {
    event UserAction(address indexed userAddress, uint256 action, string cid);

    event AddFileFinished(address indexed userAddress, string cid);
    event DeleteFileFinished(address indexed userAddress, string cid);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_USER_MANAGER);

        imports = [
        CONTRACT_SETTING,
        CONTRACT_FILE_MANAGER,
        CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns (IUserStorage) {
        return IUserStorage(getStorage());
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function _FileManager() private view returns (IFileManager) {
        return IFileManager(requireAddress(CONTRACT_FILE_MANAGER));
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
        require(0 == _Storage().getFileCount(userAddress), "U:files not empty");

        _Storage().deleteUser(userAddress);
    }

    function addFile(address userAddress, string calldata cid, uint256 duration, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().exist(userAddress), "U:user not exist");
        require(!_Storage().fileExist(userAddress, cid), "U:file exist");
        require(_Storage().availableSpace(userAddress) > 0, "U:no available storage space");

        bool waitCallback = _FileManager().addFile(cid, userAddress);
        if (!waitCallback) {
            uint256 size = _FileManager().getSize(cid);
            _Storage().useStorage(userAddress, size, true);
            emit AddFileFinished(userAddress, cid);
        }

        _Storage().addFile(userAddress, cid, duration, ext);

        emit UserAction(userAddress, Add, cid);
    }

    function onAddFileFinish(address[] calldata userAddresses, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_FILE_MANAGER);

        for(uint i=0; i<userAddresses.length; i++) {
            _Storage().useStorage(userAddresses[i], size, false);
            emit AddFileFinished(userAddresses[i], cid);
        }
    }

    function deleteFile(address userAddress, string calldata cid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:file not exist");

        bool waitCallback = _FileManager().deleteFile(cid, userAddress);
        emit UserAction(userAddress, Delete, cid);
        if (!waitCallback) {
            _Storage().deleteFile(userAddress, cid);
            _Storage().freeStorage(userAddress, _FileManager().getSize(cid));
            emit DeleteFileFinished(userAddress, cid);
        }
    }

    function onDeleteFileFinish(address userAddress, string calldata cid, uint256 size) external {
        mustAddress(CONTRACT_FILE_MANAGER);

        _Storage().deleteFile(userAddress, cid);
        _Storage().freeStorage(userAddress, size);

        emit DeleteFileFinished(userAddress, cid);
    }

    function setFileExt(address userAddress, string calldata cid, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:file not exist");

        _Storage().setFileExt(userAddress, cid, ext);
    }

    function setFileDuration(address userAddress, string calldata cid, uint256 duration) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);

        require(_Storage().exist(userAddress), "U:user not exist");
        require(_Storage().fileExist(userAddress, cid), "U:file not exist");

        _Storage().setFileDuration(userAddress, cid, duration);
    }

    function approveAccount(address from, address to, bool approved) external {
        require(_Storage().exist(from), "U:user not exist");
        require(_Storage().exist(to), "U:user not exist");

        _Storage().approveAccount(from, to, approved);
    }

    function approveFile(address from, address to, string calldata cid, bool approved) external {
        require(_Storage().exist(from), "U:user not exist");
        require(_Storage().exist(to), "U:user not exist");
        require(_FileManager().exist(cid), "U:file not exist");

        _Storage().approveFile(from, to, cid, approved);
    }
}
