import { VerificationLevel as IDKitVerificationLevel } from '@worldcoin/idkit-core';

const FACE_VERIFICATION_LEVEL = 'face' as const;

export type VerificationLevel =
  | IDKitVerificationLevel
  | typeof FACE_VERIFICATION_LEVEL;

export const VerificationLevel = {
  ...IDKitVerificationLevel,
  Face: FACE_VERIFICATION_LEVEL,
} as const;
