// Input hexadecimal strings
const merkleRoot =
  '0x1e4f60d53124ffbcabc84bdb69028a60d5ec5c707a02b3ed983f61b56b008830';
const nullifierHash =
  '0x1a89ac04dccd8ee721d8ab49d5313e8495842a187853cf4e2397f2683050863b';
const signalHash =
  '0x00c2a20deb61de8f7d1a57eb59ca3a3fead1d2996866182ac1913486341c5081';

// Convert to BigInt since these are too large for regular JavaScript numbers
const merkleRootBigInt = BigInt(merkleRoot);
const nullifierHashBigInt = BigInt(nullifierHash);
const signalHashBigInt = BigInt(signalHash);

// If you need the decimal string representation
console.log('Merkle Root as decimal string:', merkleRootBigInt.toString());
console.log(
  'Nullifier Hash as decimal string:',
  nullifierHashBigInt.toString(),
);
console.log('Nullifier Hash as decimal string:', signalHashBigInt.toString());
