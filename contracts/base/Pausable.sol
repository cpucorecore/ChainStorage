pragma solidity ^0.5.2;

import './Ownable.sol';

contract Pausable is Ownable {
    bool public paused;

    event PauseChanged(bool indexed previousValue, bool indexed newValue);

    function mustNotPaused() public {
        require(!paused, contractName.concat(': paused'));
    }

    constructor() internal {
        paused = false;
    }

    function setPaused(bool _paused) external {
        mustOwner();
        if (paused == _paused) return;
        emit PauseChanged(paused, _paused);
        paused = _paused;
    }
}
