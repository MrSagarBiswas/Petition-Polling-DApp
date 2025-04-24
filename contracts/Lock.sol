// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lock {
  uint256 public unlockTime;
  constructor(uint256 _unlockTime) payable {
    unlockTime = _unlockTime;
  }
}
