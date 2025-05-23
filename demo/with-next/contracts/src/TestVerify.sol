
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ByteHasher } from './ByteHasher.sol';
import { IWorldID } from './IWorldID.sol';

contract TestVerify {
	using ByteHasher for bytes;

	/// @dev The World ID instance that will be used for verifying proofs
	IWorldID internal immutable worldId;

	/// @dev The contract's external nullifier hash
	uint256 internal immutable externalNullifier;

	/// @dev The World ID group ID (always 1)
	uint256 internal immutable groupId = 1;

	/// @param nullifierHash The nullifier hash for the verified proof
	/// @dev A placeholder event that is emitted when a user successfully verifies with World ID
	event Verified(uint256 nullifierHash);

	/// @param _worldId The WorldID router that will verify the proofs
	/// @param _appId The World ID app ID
	/// @param _actionId The World ID action ID
	constructor(IWorldID _worldId, string memory _appId, string memory _actionId) {
		worldId = _worldId;
		externalNullifier = abi.encodePacked(abi.encodePacked(_appId).hashToField(), _actionId).hashToField();
	}

	/// @param signal An arbitrary input from the user, usually the user's wallet address (check README for further details)
	/// @param root The root of the Merkle tree
	/// @param nullifierHash The nullifier hash for this proof, preventing double signaling
	/// @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID
	function verify(address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) public {

		// We now verify the provided proof is valid and the user is verified by World ID
		worldId.verifyProof(
			root,
			groupId,
			abi.encodePacked(signal).hashToField(),
			nullifierHash,
			externalNullifier,
			proof
		);

		emit Verified(nullifierHash);
	}
}