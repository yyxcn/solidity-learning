// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// abstract: 따로 배포 안하는 컨트랙트
abstract contract ManagedAccess {
    address public owner;
    address public manager;

    address[] public managers;
    mapping(address => bool) public isManager;
    mapping(address => bool) public hasConfirmed;
    uint256 public confirmationCount;

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;

        managers.push(_manager);
        isManager[_manager] = true;
    }

    modifier onlyOwner(address _manager) {
        require(msg.sender == owner, "You are not an owner");
        require(!isManager[_manager], "Already a manager");
        
        isManager[_manager] = true;
        managers.push(_manager);
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not a manager");
        _;
    }

    modifier onlyAllConfirmed() {
        require(
            confirmationCount == managers.length,
            "Not all confirmed yet"
        );
        _;
        reset();
    }

    function setManager(address _manager) external onlyOwner(_manager) {
        manager = _manager;
    }

    function confirm() external onlyManager {
        if (!hasConfirmed[msg.sender]) {
            hasConfirmed[msg.sender] = true;
            confirmationCount++;
        }
    }

    function reset() internal {
        for(uint i = 0; i < managers.length; i++) {
            hasConfirmed[managers[i]] = false;
        }
    }
}