pragma solidity ^0.5.2;

library Strings {
    function toBytes32(string memory a) internal pure returns (bytes32) {
        bytes32 b;
        assembly {
            b := mload(add(a, 32))
        }
        return b;
    }

    function concat(string memory a, string memory b) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b));
    }

    function concat(
        string memory a,
        string memory b,
        bytes32 c
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b, c));
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
