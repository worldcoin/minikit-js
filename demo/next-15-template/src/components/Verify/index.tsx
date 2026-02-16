'use client';
import { IDKit, orbLegacy, type RpContext } from '@worldcoin/idkit';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';

/**
 * This component is an example of how to use World ID verification via IDKit.
 * Verification now goes through IDKit end-to-end (both native World App and web).
 * It's critical you verify the proof on the server side.
 * Read More: https://docs.world.org/mini-apps/commands/verify#verifying-the-proof
 */
export const Verify = () => {
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const onClickVerify = async () => {
    setButtonState('pending');
    try {
      // Fetch RP signature from your backend
      const rpRes = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-action' }),
      });

      if (!rpRes.ok) {
        throw new Error('Failed to get RP signature');
      }

      const rpSig = await rpRes.json();
      const rpContext: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      // Use IDKit request API
      const request = await IDKit.request({
        app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
        action: 'test-action',
        rp_context: rpContext,
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: '' }));

      const completion = await request.pollUntilCompletion();

      if (!completion.success) {
        setButtonState('failed');
        setTimeout(() => setButtonState(undefined), 2000);
        return;
      }

      // Verify the proof on the server
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        body: JSON.stringify({
          payload: completion.result,
          action: 'test-action',
        }),
      });

      const data = await response.json();
      if (data.verifyRes.success) {
        setButtonState('success');
      } else {
        setButtonState('failed');
        setTimeout(() => setButtonState(undefined), 2000);
      }
    } catch {
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 2000);
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
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={onClickVerify}
          disabled={buttonState === 'pending'}
          size="lg"
          variant="primary"
          className="w-full"
        >
          Verify with World ID
        </Button>
      </LiveFeedback>
    </div>
  );
};
