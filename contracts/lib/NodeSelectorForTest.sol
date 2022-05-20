pragma solidity ^0.5.2;

import "../interfaces/storages/INodeStorage.sol";

library NodeSelectorForTest {
    function NodeStorage(address addr) internal view returns (INodeStorage) {
        return INodeStorage(addr);
    }

    function selectNodes(address nodeStorageAddr, uint256 count) public view returns (address[] memory nodes, bool success) {
        address[] memory allOnlineNodeAddresses = NodeStorage(nodeStorageAddr).getAllOnlineNodeAddresses();

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
}
