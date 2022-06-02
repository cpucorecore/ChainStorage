pragma solidity ^0.8.0;

library DataTypes {
    struct TaskItem {
        address user;
        uint256 action;
        string cid;
        uint256 size;
        address node;
        uint256 replica;
    }

    struct TaskState {
        uint256 status;
        uint256 createTime;
        uint256 acceptTime;
        uint256 acceptTimeoutTime;
        uint256 finishTime;
        uint256 failTime;
        uint256 timeoutTime;
        uint256 failReason;
    }

    struct TaskAddFileProgress {
        uint256 time;
        uint256 lastSize;
        uint256 currentSize;
        uint256 size;
        uint256 lastPercentage;
        uint256 currentPercentage;
    }
}
