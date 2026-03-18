// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import { TestVerify } from "../src/TestVerify.sol";
import { IWorldID } from "../src/IWorldID.sol";

contract DeployTestVerify is Script {
    // World ID Router on World Chain
    address constant WORLD_ID_ROUTER = 0x17B354dD2595411ff79041f930e491A4Df39A278;

    function run() external {
        vm.startBroadcast();

        TestVerify testVerify = new TestVerify(
            IWorldID(WORLD_ID_ROUTER),
            "app_f617d152e3f3ea2142dde27099ffd368",
            "onchain-verify-test"
        );

        console.log("TestVerify deployed to:", address(testVerify));

        vm.stopBroadcast();
    }
}
