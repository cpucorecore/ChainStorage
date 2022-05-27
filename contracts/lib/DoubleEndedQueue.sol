// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (utils/structs/DoubleEndedQueue.sol)
pragma solidity ^0.5.2;

import "./SafeMath.sol";

library DoubleEndedQueue {
    using SafeMath for uint256;

    struct Uint256Deque {
        uint256 _begin;
        uint256 _end;
        mapping(uint256 => uint256) _data;
    }

    function pushBack(Uint256Deque storage deque, uint256 value) internal {
        uint256 backIndex = deque._end;
        deque._data[backIndex] = value;
        deque._end = backIndex.add(1);
    }

    function popBack(Uint256Deque storage deque) internal returns (uint256 value) {
        require (!empty(deque), "dq:empty");
        uint256 backIndex;
        backIndex = deque._end.sub(1);
        value = deque._data[backIndex];
        delete deque._data[backIndex];
        deque._end = backIndex;
    }

    function pushFront(Uint256Deque storage deque, uint256 value) internal {
        uint256 frontIndex;
        frontIndex = deque._begin.sub(1);
        deque._data[frontIndex] = value;
        deque._begin = frontIndex;
    }

    function popFront(Uint256Deque storage deque) internal returns (uint256 value) {
        require (!empty(deque), "dq:empty");
        uint256 frontIndex = deque._begin;
        value = deque._data[frontIndex];
        delete deque._data[frontIndex];
        deque._begin = frontIndex.add(1);
    }

    function front(Uint256Deque storage deque) internal view returns (uint256 value) {
        require (!empty(deque), "dq:empty");
        uint256 frontIndex = deque._begin;
        return deque._data[frontIndex];
    }

    function back(Uint256Deque storage deque) internal view returns (uint256 value) {
        require (!empty(deque), "dq:empty");
        uint256 backIndex;
        backIndex = deque._end.sub(1);
        return deque._data[backIndex];
    }

    function at(Uint256Deque storage deque, uint256 index) internal view returns (uint256 value) {
        uint256 idx = deque._begin.add(index);
        require (idx < deque._end, "dq:oob");
        return deque._data[idx];
    }

    function clear(Uint256Deque storage deque) internal {
        deque._begin = 0;
        deque._end = 0;
    }

    function length(Uint256Deque storage deque) internal view returns (uint256) {
        return deque._end.sub(deque._begin);
    }

    function empty(Uint256Deque storage deque) internal view returns (bool) {
        return deque._end <= deque._begin;
    }
}
