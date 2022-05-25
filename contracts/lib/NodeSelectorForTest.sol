pragma solidity ^0.5.2;

import "../interfaces/storages/INodeStorage.sol";
import "../interfaces/IFile.sol";
import "../interfaces/ITask.sol";

library NodeSelectorForTest {
    function _NodeStorage(address addr) internal pure returns (INodeStorage) {
        return INodeStorage(addr);
    }

    function _File(address fileAddress) internal pure returns (IFile) {
        return IFile(fileAddress);
    }

    function _Task(address taskAddress) internal pure returns (ITask) {
        return ITask(taskAddress);
    }

    function selectNodes(address nodeStorageAddress, uint256 count) public view returns (address[] memory nodes, bool success) {
        address[] memory allOnlineNodeAddresses = _NodeStorage(nodeStorageAddress).getAllOnlineNodeAddresses();

        if(allOnlineNodeAddresses.length < count) {
            return(allOnlineNodeAddresses, false);
        } else if(allOnlineNodeAddresses.length == count) {
            return(allOnlineNodeAddresses, true);
        } else {
            address[] memory result = new address[](count);
            uint256 random = uint256(keccak256(abi.encodePacked(now)));

            uint256 sliceNumber = allOnlineNodeAddresses.length / count;
            if((allOnlineNodeAddresses.length % count) > 0) {
                sliceNumber += 1;
            }

            uint256 slice = random % sliceNumber;
            uint256 start = slice*count;
            if(slice == (sliceNumber - 1)) {
                start = allOnlineNodeAddresses.length - count;
            }

            for(uint i=0; i<count; i++) {
                result[i] = allOnlineNodeAddresses[start+i];
            }

            return (result, true);
        }
    }

    function selectOneNode(
        address nodeStorageAddress,
        address fileAddress,
        address taskAddress,
        address excludedAddress,
        string memory cid
    ) internal view returns (address nodeAddress, bool success) {
        address[] memory allOnlineNodeAddresses = _NodeStorage(nodeStorageAddress).getAllOnlineNodeAddresses();
        if(0 == allOnlineNodeAddresses.length) {
            return (address(0), false);
        }

        address[] memory existNodeAddresses = _File(fileAddress).getNodes(cid);

        for(uint i=0; i<allOnlineNodeAddresses.length; i++) {
            bool notExist = true;

            for(uint j=0; j<existNodeAddresses.length; j++) {
                if(allOnlineNodeAddresses[i] == existNodeAddresses[j]) {
                    notExist = false;
                    break;
                }
            }

            if(allOnlineNodeAddresses[i] == excludedAddress) {
                notExist = false;
            }

            if(_Task(taskAddress).isNodeDoingAddFile(allOnlineNodeAddresses[i], cid)) {
                notExist = false;
            }

            if(notExist) {
                return (allOnlineNodeAddresses[i], true);
            }
        }
    }
}
