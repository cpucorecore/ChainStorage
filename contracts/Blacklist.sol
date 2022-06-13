pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./interfaces/IBlacklist.sol";
import "./lib/EnumerableSet.sol";
import "./lib/Paging.sol";

contract Blacklist is Importable, IBlacklist {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_BLACKLIST);
        imports = [
        ACCOUNT_ADMIN
        ];
    }

    EnumerableSet.Bytes32Set private cidHashes;
    EnumerableSet.AddressSet private users;
    EnumerableSet.AddressSet private nodes;

    function addCid(string calldata cid) external {
        mustAddress(ACCOUNT_ADMIN);
        bytes32 cidHash = keccak256(bytes(cid));
        cidHashes.add(cidHash);
    }

    function deleteCid(string calldata cid) external {
        mustAddress(ACCOUNT_ADMIN);
        bytes32 cidHash = keccak256(bytes(cid));
        cidHashes.remove(cidHash);
    }

    function addUser(address userAddress) external {
        mustAddress(ACCOUNT_ADMIN);
        users.add(userAddress);
    }

    function deleteUser(address userAddress) external {
        mustAddress(ACCOUNT_ADMIN);
        users.remove(userAddress);
    }

    function addNode(address nodeAddress) external {
        mustAddress(ACCOUNT_ADMIN);
        nodes.add(nodeAddress);
    }

    function deleteNode(address nodeAddress) external {
        mustAddress(ACCOUNT_ADMIN);
        nodes.remove(nodeAddress);
    }

    function checkCid(string calldata cid) external view returns (bool) {
        bytes32 cidHash = keccak256(bytes(cid));
        return !cidHashes.contains(cidHash);
    }

    function getCidCount() external view returns (uint256) {
        return cidHashes.length();
    }

    function getCidHashes(uint256 pageSize, uint256 pageNumber) external view returns (bytes32[] memory, bool) {
        Paging.Page memory page = Paging.getPage(cidHashes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        bytes32[] memory result = new bytes32[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = cidHashes.at(start+i);
        }
        return (result, page.totalPages == page.pageNumber);
    }

    function checkUser(address userAddress) external view returns (bool) {
        return !users.contains(userAddress);
    }

    function getUserCount() external view returns (uint256) {
        return users.length();
    }

    function getUsers(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(users.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = users.at(start+i);
        }
        return (result, page.totalPages == page.pageNumber);
    }

    function checkNode(address nodeAddress) external view returns (bool) {
        return !nodes.contains(nodeAddress);
    }

    function getNodeCount() external view returns (uint256) {
        return nodes.length();
    }

    function getNodes(uint256 pageSize, uint256 pageNumber) external view returns (address[] memory, bool) {
        Paging.Page memory page = Paging.getPage(nodes.length(), pageSize, pageNumber);
        uint256 start = page.pageNumber.sub(1).mul(page.pageSize);
        address[] memory result = new address[](page.pageRecords);
        for(uint256 i=0; i<page.pageRecords; i++) {
            result[i] = nodes.at(start+i);
        }
        return (result, page.totalPages == page.pageNumber);
    }
}