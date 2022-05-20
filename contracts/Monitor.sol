pragma solidity ^0.5.2;

import "./base/Importable.sol";
import "./base/ExternalStorable.sol";
import "./interfaces/IMonitor.sol";
import "./interfaces/storages/IMonitorStorage.sol";
import "./interfaces/ITask.sol";
import "./interfaces/INode.sol";
import "./interfaces/ISetting.sol";
import "./lib/SafeMath.sol";

contract Monitor is Importable, ExternalStorable, IMonitor {
    using SafeMath for uint256;
    using Strings for uint256;

    event MonitorReport(address indexed monitorAddress, uint256 tid, uint256 reportType);

    constructor(IResolver _resolver) public Importable(_resolver) {
        setContractName(CONTRACT_MONITOR);
        imports = [
            CONTRACT_TASK,
            CONTRACT_NODE,
            CONTRACT_SETTING,
            CONTRACT_CHAIN_STORAGE
        ];
    }

    function _Storage() private view returns (IMonitorStorage) {
        return IMonitorStorage(getStorage());
    }

    function _Task() private view returns (ITask) {
        return ITask(requireAddress(CONTRACT_TASK));
    }

    function _Node() private view returns (INode) {
        return INode(requireAddress(CONTRACT_NODE));
    }

    function _Setting() private view returns (ISetting) {
        return ISetting(requireAddress(CONTRACT_SETTING));
    }

    function register(address monitorAddress, string calldata ext) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(!_Storage().exist(monitorAddress), "M:monitor exist");
        _Storage().newMonitor(monitorAddress, ext);
    }

    function deRegister(address monitorAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:monitor not exist");
        require(MonitorMaintain == _Storage().getStatus(monitorAddress), "M:status must be maintain");
        _Storage().deleteMonitor(monitorAddress);
    }

    function online(address monitorAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:monitor not exist");
        uint256 status = _Storage().getStatus(monitorAddress);
        require(MonitorRegistered == status || MonitorMaintain == status, "M:wrong status");

        _Storage().setStatus(monitorAddress, MonitorOnline);
        _Storage().addOnlineMonitor(monitorAddress);

        if(MonitorRegistered == status) {
            uint256 currentTid = _Task().getCurrentTid();
            _Storage().setFirstOnlineTid(monitorAddress, currentTid);
        }
    }

    function maintain(address monitorAddress) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:monitor not exist");
        uint256 status = _Storage().getStatus(monitorAddress);
        require(MonitorOnline == status, "M:wrong status");
        _Storage().setStatus(monitorAddress, MonitorMaintain);
        _Storage().deleteOnlineMonitor(monitorAddress);
    }

    function resetCurrentTid(address monitorAddress, uint256 tid) external {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        uint256 firstOnlineTid = _Storage().getFirstOnlineTid(monitorAddress);
        if(tid<firstOnlineTid) {
            _Storage().setCurrentTid(monitorAddress, firstOnlineTid);
        } else {
            _Storage().setCurrentTid(monitorAddress, tid);
        }
    }

    function checkTask(address monitorAddress, uint256 tid) external returns (bool continueCheck) {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:not exist");
        require(MonitorOnline == _Storage().getStatus(monitorAddress), "M:status not online");
        require(_Task().exist(tid), "M:task not exist");

        if(_Task().isOver(tid)) return false;

        continueCheck = true;
        if(_isTaskAcceptTimeout(tid)) {
            _reportTaskAcceptTimeout(monitorAddress, tid);
            continueCheck = false;
        } else if(_isTaskTimeout(tid)) {
            _reportTaskTimeout(monitorAddress, tid);
            continueCheck = false;
        }
    }

    function reportTaskAcceptTimeout(address monitorAddress, uint256 tid) public {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:not exist");
        require(MonitorOnline == _Storage().getStatus(monitorAddress), "M:status not online");
        require(_isTaskAcceptTimeout(tid), "M:task not acceptTimeout");

        _reportTaskAcceptTimeout(monitorAddress, tid);
    }

    function reportTaskTimeout(address monitorAddress, uint256 tid) public {
        mustAddress(CONTRACT_CHAIN_STORAGE);
        require(_Storage().exist(monitorAddress), "M:not exist");
        require(MonitorOnline == _Storage().getStatus(monitorAddress), "M:status not online");
        require(_isTaskTimeout(tid), "M:task not timeout");

        _reportTaskTimeout(monitorAddress, tid);
    }

    function _reportTaskAcceptTimeout(address monitorAddress, uint256 tid) private {
        _Storage().addReport(monitorAddress, tid, ReportAcceptTimeout, now);
        _saveCurrentTid(monitorAddress, tid);
        _Node().reportAcceptTaskTimeout(tid);
        emit MonitorReport(monitorAddress, tid, ReportAcceptTimeout);
    }

    function _reportTaskTimeout(address monitorAddress, uint256 tid) private {
        _Storage().addReport(monitorAddress, tid, ReportTimeout, now);
        _saveCurrentTid(monitorAddress, tid);
        _Node().reportTaskTimeout(tid);
        emit MonitorReport(monitorAddress, tid, ReportTimeout);
    }

    function _isTaskAcceptTimeout(uint256 tid) private view returns (bool isTimeout) {
        uint256 acceptTimeout = _Setting().getTaskAcceptTimeout();
        (uint256 status,,uint256 createTime,,,,,) = _Task().getTaskState(tid);

        if((TaskCreated == status) && (now > createTime.add(acceptTimeout))) {
            isTimeout = true;
        }
    }

    function _isTaskTimeout(uint256 tid) private view returns (bool isTimeout) {
        (uint256 status,,,uint256 acceptTime,,,,) = _Task().getTaskState(tid);
        (,uint256 action,,,) = _Task().getTask(tid);

        if(TaskAccepted != status) {
            return false;
        }

        if(Add == action) {
            uint256 addFileTimeout = _Setting().getAddFileTaskTimeout();

            if(now > acceptTime.add(addFileTimeout)) {
                return true;
            }

            uint256 addFileProgressTimeout = _Setting().getAddFileProgressTimeout();
            (uint256 progressTime, uint256 progressLastSize, uint256 progressCurrentSize,,,) = _Task().getAddFileTaskProgress(tid);
            if(now > progressTime.add(addFileProgressTimeout)) {
                return true;
            }

            if(progressLastSize == progressCurrentSize) {
                return true;
            }
        } else {
            uint256 deleteFileTimeout = _Setting().getDeleteFileTaskTimeout();
            if(now > acceptTime.add(deleteFileTimeout)) {
                return true;
            }
        }
    }

    function _saveCurrentTid(address monitorAddress, uint256 tid) private {
        uint256 currentTid = _Storage().getCurrentTid(monitorAddress);
        if(tid > currentTid) {
            _Storage().setCurrentTid(monitorAddress, tid);
        }
    }
}
