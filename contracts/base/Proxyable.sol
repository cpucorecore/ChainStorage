pragma solidity ^0.5.2;

import './Ownable.sol';

contract Proxyable is Ownable {
    bool private _initialized;

    function mustInitialized() public {
        require(_initialized, contractName.concat(': contract uninitialized'));
    }

    function setInitialized() internal {
        require(_initialized == false, contractName.concat(': already initialized'));
        _initialized = true;
    }
}
