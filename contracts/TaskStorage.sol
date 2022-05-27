pragma solidity ^0.5.2;

import "./storages/ExternalStorage.sol";
import "./interfaces/storages/ITaskStorage.sol";
import "./lib/EnumerableSet.sol";

contract TaskStorage is ExternalStorage, ITaskStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct TaskItem {
        address user;
        uint256 action;
        address node;
        bool noCallback;
        string cid;
    }

    struct TaskState {
        uint256 status;
        uint256 createBlockNumber;
        uint256 createTime;
        uint256 acceptTime;
        uint256 acceptTimeoutTime;
        uint256 finishTime;
        uint256 failTime;
        uint256 timeoutTime;
    }

    struct AddFileTaskProgress {
        uint256 time;
        uint256 lastSize;
        uint256 currentSize;
        uint256 size;
        uint256 lastPercentage;
        uint256 currentPercentage;
    }

    uint256 private currentTid;
    mapping(uint256=>TaskItem) private tid2taskItem;
    mapping(uint256=>TaskState) private tid2taskState;
    mapping(uint256=>AddFileTaskProgress) private tid2addFileProgress;
    mapping(address=>EnumerableSet.Bytes32Set) private node2addFileCidHashes;
    mapping(string=>EnumerableSet.AddressSet) private cid2addFileNodes;

    constructor(address _manager) public ExternalStorage(_manager) {}

    function newTask(address userAddress, uint256 action, string calldata cid, address nodeAddress, bool noCallback) external returns (uint256) {
        mustManager(managerName);
        currentTid = currentTid.add(1);

        tid2taskItem[currentTid] = TaskItem(userAddress, action, nodeAddress, noCallback, cid);
        tid2taskState[currentTid] = TaskState(TaskCreated, block.number, now, 0, 0, 0, 0, 0);
        if(Add == action) {
            tid2addFileProgress[currentTid] = AddFileTaskProgress(0, 0, 0, 0, 0, 0);

            bytes32 cidHash = keccak256(bytes(cid));
            node2addFileCidHashes[nodeAddress].add(cidHash);
            if(!cid2addFileNodes[cid].contains(nodeAddress)) {
                cid2addFileNodes[cid].add(nodeAddress);
            }
        }

        return currentTid;
    }

    function getTask(uint256 tid) external view returns (address, uint256, address, bool, string memory) {
        TaskItem storage task = tid2taskItem[tid];
        return (task.user, task.action, task.node, task.noCallback, task.cid);
    }

    function exist(uint256 tid) external view returns (bool) {
        return tid2taskItem[tid].user != address(0);
    }

    function getCurrentTid() external view returns (uint256) {
        return currentTid;
    }

    function isOver(uint256 tid) external view returns (bool) {
        bool over = false;

        if(Add == tid2taskItem[tid].action) {
            over = !(TaskCreated == tid2taskState[tid].status || TaskAccepted == tid2taskState[tid].status);
        } else {
            over = (TaskFinished == tid2taskState[tid].status);
        }
        return over;
    }

    function isNodeAddFileCidDuplicated(address nodeAddress, string calldata cid) external view returns (bool) {
        return node2addFileCidHashes[nodeAddress].contains(keccak256(bytes(cid)));
    }

    function getAddFileNodes(string calldata cid) external view returns (address[] memory nodeAddresses) {
        return cid2addFileNodes[cid].values();
    }

    function getAddFileCidHashes(address nodeAddress) external view returns (bytes32[] memory cidHashes) {
        return node2addFileCidHashes[nodeAddress].values();
    }

    function getTaskState(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        TaskState storage state = tid2taskState[tid];
        return (state.status,
                state.createBlockNumber,
                state.createTime,
                state.acceptTime,
                state.acceptTimeoutTime,
                state.finishTime,
                state.failTime,
                state.timeoutTime
        );
    }

    function getStatusAndTime(uint256 tid) external view returns (uint256 status, uint256 time) {
        status = tid2taskState[tid].status;
        if(TaskCreated == status) {
            time = tid2taskState[tid].createTime;
        } else if(TaskAccepted == status) {
            time = tid2taskState[tid].acceptTime;
        } else if(TaskAcceptTimeout == status) {
            time = tid2taskState[tid].acceptTimeoutTime;
        } else if(TaskFinished == status) {
            time = tid2taskState[tid].finishTime;
        } else if(TaskFailed == status) {
            time = tid2taskState[tid].failTime;
        } else if(TaskTimeout == status) {
            time = tid2taskState[tid].timeoutTime;
        }
    }

    function setStatusAndTime(uint256 tid, uint256 status, uint256 time) external {
        mustManager(managerName);

        tid2taskState[tid].status = status;
        if(TaskAccepted == status) {
            tid2taskState[tid].acceptTime = time;
        } else if(TaskAcceptTimeout == status) {
            tid2taskState[tid].acceptTimeoutTime = time;
        } else if(TaskFinished == status) {
            tid2taskState[tid].finishTime = time;
        } else if(TaskFailed == status) {
            tid2taskState[tid].failTime = time;
        } else if(TaskTimeout == status) {
            tid2taskState[tid].timeoutTime = time;
        }

        TaskItem storage task = tid2taskItem[tid];
        if(Add == task.action && TaskAccepted != status) {
            bytes32 cidHash = keccak256(bytes(task.cid));
            node2addFileCidHashes[task.node].remove(cidHash);
            cid2addFileNodes[task.cid].remove(task.node);
        }
    }

    function getAddFileTaskProgress(uint256 tid) external view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        AddFileTaskProgress storage progress = tid2addFileProgress[tid];
        return (progress.time, progress.lastSize, progress.currentSize, progress.size, progress.lastPercentage, progress.currentPercentage);
    }

    function setAddFileTaskProgressBySize(uint256 tid, uint256 time, uint256 size) external {
        mustManager(managerName);
        tid2addFileProgress[tid].time = time;
        tid2addFileProgress[tid].lastSize = tid2addFileProgress[tid].currentSize;
        tid2addFileProgress[tid].currentSize = size;
    }

    function setAddFileTaskProgressByPercentage(uint256 tid, uint256 time, uint256 percentage) external {
        mustManager(managerName);
        tid2addFileProgress[tid].time = time;
        tid2addFileProgress[tid].lastPercentage = tid2addFileProgress[tid].currentPercentage;
        tid2addFileProgress[tid].currentPercentage = percentage;
    }
}
