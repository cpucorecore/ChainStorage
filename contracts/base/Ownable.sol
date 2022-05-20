pragma solidity ^0.5.2;

import './Constants.sol';
import '../interfaces/IOwnable.sol';
import '../lib/Strings.sol';

contract Ownable is Constants, IOwnable {
    using Strings for string;

    string public contractName;
    address public owner;
    address public manager;

    constructor() internal {
        owner = msg.sender;
        manager = msg.sender;
    }

    function mustOwner() public {
        require(msg.sender == owner, "caller is not the owner");
    }

    function mustManager(bytes32 managerName) public {
        require(msg.sender == manager, contractName.concat(': caller is not the ', managerName));
    }

    function setOwner(address _owner) public {
        mustOwner();
        require(_owner != address(0), "new owner is the zero address");
        emit OwnerChanged(owner, _owner);
        owner = _owner;
    }

    function setManager(address _manager) public {
        mustOwner();
        require(_manager != address(0), "new manager is the zero address");
        emit ManagerChanged(manager, _manager);
        manager = _manager;
    }

    function setContractName(bytes32 _contractName) internal {
        contractName = string(abi.encodePacked(_contractName));
    }
}
