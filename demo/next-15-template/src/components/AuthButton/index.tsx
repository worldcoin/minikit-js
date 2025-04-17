'use client';
import { walletAuth } from '@/auth/wallet';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useEffect, useState } from 'react';

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthButton = () => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
      setIsPending(false);
      return;
    }

    setIsPending(false);
  }, [isInstalled, isPending]);

  useEffect(() => {
    const authenticate = async () => {
      if (isInstalled && !isPending) {
        setIsPending(true);
        try {
          await walletAuth();
        } catch (error) {
          console.error('Auto wallet authentication error', error);
        } finally {
          setIsPending(false);
        }
      }
    };

    authenticate();
  }, [isInstalled, isPending]);

  return (
    <LiveFeedback
      label={{
        failed: 'Failed to login',
        pending: 'Logging in',
        success: 'Logged in',
      }}
      state={isPending ? 'pending' : undefined}
    >
      <Button
        onClick={onClick}
        disabled={isPending}
        size="lg"
        variant="primary"
      >
        Login with Wallet
      </Button>
    </LiveFeedback>
  );
};
