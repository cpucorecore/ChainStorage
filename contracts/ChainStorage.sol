pragma solidity ^0.5.2;

import "./base/Proxyable.sol";
import "./base/Pausable.sol";
import "./base/Importable.sol";
import "./interfaces/IUserManager.sol";
import "./interfaces/INodeManager.sol";
import "./interfaces/ISetting.sol";
import "./interfaces/IBlacklist.sol";

contract ChainStorage is Proxyable, Pausable, Importable {
    constructor() public Importable(IResolver(0)) {}

    function initialize(IResolver _resolver) external {
        mustOwner();
        setInitialized();

        resolver = _resolver;
        setContractName(CONTRACT_CHAIN_STORAGE);

        imports = [
        CONTRACT_SETTING,
        CONTRACT_USER_MANAGER,
        CONTRACT_NODE_MANAGER,
        CONTRACT_BLACKLIST,
        ACCOUNT_ADMIN
        ];
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function _UserManager() private view returns (IUserManager) {
        return IUserManager(requireAddress(CONTRACT_USER_MANAGER));
    }

    function _NodeManager() private view returns (INodeManager) {
        return INodeManager(requireAddress(CONTRACT_NODE_MANAGER));
    }

    function _Blacklist() private view returns (IBlacklist) {
        return IBlacklist(requireAddress(CONTRACT_BLACKLIST));
    }

    function userRegister(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxUserExtLength(), "CS:user ext too long");
        _UserManager().register(msg.sender, ext);
    }

    function userSetExt(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxUserExtLength(), "CS:user ext too long");
        _UserManager().setExt(msg.sender, ext);
    }

    function userSetStorageTotal(address userAddress, uint256 storageTotal) external {
        _mustOnline();
        mustAddress(ACCOUNT_ADMIN);
        _UserManager().setStorageTotal(userAddress, storageTotal);
    }

    function userDeRegister() external {
        _mustOnline();
        _UserManager().deRegister(msg.sender);
    }

    function userAddFile(string calldata cid, uint256 duration, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxFileExtLength(), "CS:file ext too long");
        require(bytes(cid).length <= _Setting().getMaxCidLength(), "CS:cid too long");
        require(_Blacklist().checkCid(cid), "CS:cid in blacklist");
        require(_Blacklist().checkUser(msg.sender), "CS:user in blacklist");
        _UserManager().addFile(msg.sender, cid, duration, ext);
    }

    function userSetFileExt(string calldata cid, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxFileExtLength(), "CS:file ext too long");
        _UserManager().setFileExt(msg.sender, cid, ext);
    }

    function userSetFileDuration(string calldata cid, uint256 duration) external {
        _mustOnline();
        _UserManager().setFileDuration(msg.sender, cid, duration);
    }

    function userApproveAccount(address to, bool approved) external {
        _mustOnline();
        _UserManager().approveAccount(msg.sender, to, approved);
    }

    function userApproveFile(address to, string calldata cid, bool approved) external {
        _mustOnline();
        _UserManager().approveFile(msg.sender, to, cid, approved);
    }

    function userDeleteFile(string calldata cid) external {
        _mustOnline();
        require(bytes(cid).length <= _Setting().getMaxCidLength(), "CS:cid too long");
        _UserManager().deleteFile(msg.sender, cid);
    }

    function nodeRegister(uint256 storageTotal, string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxNodeExtLength(), "CS:node ext too long");
        require(storageTotal > 0, "CS:node storageTotal must>0");
        _NodeManager().register(msg.sender, storageTotal, ext);
    }

    function nodeSetExt(string calldata ext) external {
        _mustOnline();
        require(bytes(ext).length <= _Setting().getMaxNodeExtLength(), "CS:node ext too long");
        _NodeManager().setExt(msg.sender, ext);
    }

    function nodeSetStorageTotal(uint256 storageTotal) external {
        _mustOnline();
        _NodeManager().setStorageTotal(msg.sender, storageTotal);
    }

    function nodeDeRegister() external {
        _mustOnline();
        _NodeManager().deRegister(msg.sender);
    }

    function nodeCanAddFile(string calldata cid, uint256 size) external {
        _mustOnline();
        require(_Blacklist().checkNode(msg.sender), "CS:node in blacklist");
        _NodeManager().nodeCanAddFile(msg.sender, cid, size);
    }

    function nodeCancelCanAddFile(string calldata cid) external {
        _mustOnline();
        _NodeManager().nodeCancelCanAddFile(msg.sender, cid);
    }

    function nodeAddFile(string calldata cid) external {
        _mustOnline();
        _NodeManager().nodeAddFile(msg.sender, cid);
    }

    function nodeCanDeleteFile(string calldata cid) external {
        _mustOnline();
        _NodeManager().nodeCanDeleteFile(msg.sender, cid);
    }

    function nodeDeleteFile(string calldata cid) external {
        _mustOnline();
        _NodeManager().nodeDeleteFile(msg.sender, cid);
    }

    function _mustOnline() private {
        mustInitialized();
        mustNotPaused();
    }
}
