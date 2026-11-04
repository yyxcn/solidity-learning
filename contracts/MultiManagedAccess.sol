// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract MultiManagedAccess {
    uint constant MANAGER_NUMBERS = 5;
    uint immutable BACKUP_MANAGER_NUMBERS;
    
    address public owner;
    address[MANAGER_NUMBERS] public managers;
    bool[MANAGER_NUMBERS] public confirmed;

    constructor(address _owner, address[] memory _managers, uint _manager_numbers) {
        require(_managers.length == _manager_numbers, "size unmatched");
        BACKUP_MANAGER_NUMBERS = _manager_numbers;
        owner = _owner;
        for(uint i = 0; i < _manager_numbers; i++) {
            managers[i] = _managers[i];
        }
    }

    modifier onlyOwner(address _manager) {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyAllConfirmed() {
        require(allConfirmed(), "Not all managers confirmed yet");
        reset();
        _;
    }

    function allConfirmed() internal view returns (bool) {
        for(uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            if(!confirmed[i]) {
                return false;
            }
        }
        return true;
    }

    function reset() internal {
        for(uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            confirmed[i] = false;
        }
    }

    function confirm() external {
        bool found = false;
        for(uint i = 0; i < BACKUP_MANAGER_NUMBERS; i++) {
            if(managers[i] == msg.sender) {
                found = true;
                confirmed[i] = true;
                break;
            }
        }
        require(found, "You are not one of managers");
    }
}