'use client';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useState } from 'react';

/**
 * This component is an example of how to use World ID in Mini Apps
 * Minikit commands must be used on client components
 * It's critical you verify the proof on the server side
 * Read More: https://docs.world.org/mini-apps/commands/verify#verifying-the-proof
 */
export const Verify = () => {
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const [whichVerification, setWhichVerification] = useState<
    VerificationLevel | 'multi'
  >(VerificationLevel.Device);

  // Single verification level
  const onClickVerify = async (verificationLevel: VerificationLevel) => {
    setButtonState('pending');
    setWhichVerification(verificationLevel);
    const result = await MiniKit.commandsAsync.verify({
      action: 'test-action', // Make sure to create this in the developer portal -> incognito actions
      verification_level: verificationLevel,
    });
    console.log(result.finalPayload);
    // Verify the proof
    const response = await fetch('/api/verify-proof', {
      method: 'POST',
      body: JSON.stringify({
        payload: result.finalPayload,
        action: 'test-action',
      }),
    });

    const data = await response.json();
    if (data.verifyRes.success) {
      setButtonState('success');
      // Normally you'd do something here since the user is verified
      // Here we'll just do nothing
    } else {
      setButtonState('failed');

      // Reset the button state after 3 seconds
      setTimeout(() => {
        setButtonState(undefined);
      }, 2000);
    }
  };

  // Multiple verification levels
  const onClickVerifyMulti = async () => {
    setButtonState('pending');
    setWhichVerification('multi');
    const result = await MiniKit.commandsAsync.verify({
      action: 'test-action',
      // Request multiple verification levels - response only includes what user has
      verification_level: [VerificationLevel.Orb, VerificationLevel.Device],
    });
    console.log('Multi-verification result:', result.finalPayload);

    // For multi-verification, the response contains a `verifications` array
    if (
      result.finalPayload.status === 'success' &&
      'verifications' in result.finalPayload
    ) {
      console.log('Verifications:', result.finalPayload.verifications);
      setButtonState('success');
    } else {
      setButtonState('failed');
      setTimeout(() => {
        setButtonState(undefined);
      }, 2000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Verify</p>
      <LiveFeedback
        label={{
          failed: 'Failed to verify',
          pending: 'Verifying',
          success: 'Verified',
        }}
        state={
          whichVerification === VerificationLevel.Device
            ? buttonState
            : undefined
        }
        className="w-full"
      >
        <Button
          onClick={() => onClickVerify(VerificationLevel.Device)}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="tertiary"
          className="w-full"
        >
          Verify (Device)
        </Button>
      </LiveFeedback>
      <LiveFeedback
        label={{
          failed: 'Failed to verify',
          pending: 'Verifying',
          success: 'Verified',
        }}
        state={
          whichVerification === VerificationLevel.Orb ? buttonState : undefined
        }
        className="w-full"
      >
        <Button
          onClick={() => onClickVerify(VerificationLevel.Orb)}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Verify (Orb)
        </Button>
      </LiveFeedback>
      <LiveFeedback
        label={{
          failed: 'Failed to verify',
          pending: 'Verifying multiple levels',
          success: 'Verified',
        }}
        state={whichVerification === 'multi' ? buttonState : undefined}
        className="w-full"
      >
        <Button
          onClick={onClickVerifyMulti}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="secondary"
          className="w-full"
        >
          Verify (Multi: Orb + Device)
        </Button>
      </LiveFeedback>
    </div>
  );
};
