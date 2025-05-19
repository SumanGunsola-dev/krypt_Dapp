// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {Transactions} from "../src/Transactions.sol";
import {Script} from "forge-std/Script.sol";

contract DeployTransactions is Script {
    function run() external {
        Transactions transactions;
        vm.startBroadcast();
        transactions = new Transactions();
        vm.stopBroadcast();
    }
}
