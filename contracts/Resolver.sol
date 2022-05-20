// SPDX-License-Identifier: MIT
pragma solidity ^0.5.2;

import './lib/Arrays.sol';
import './storages/AddressStorage.sol';
import './interfaces/IResolver.sol';

contract Resolver is AddressStorage, IResolver {
    mapping(bytes32 => bytes32[]) _assets;

    constructor() public {
        setContractName(CONTRACT_RESOLVER);
    }

    function importAddress(bytes32[] calldata name, address[] calldata value) external {
        mustOwner();
        require(name.length == value.length, 'Resolver: name and value length mismatch');
        for (uint256 i = 0; i < name.length; i++) {
            setAddress(name[i], value[i]);
        }
    }

    function setAddress(bytes32 name, address value) public {
        mustOwner();
        address previousValue = getAddressValue(name);
        emit AddressChanged(name, previousValue, value);
        setAddressValue(name, value);
    }

    function getAddress(bytes32 name) external view returns (address) {
        return getAddressValue(name);
    }
}
