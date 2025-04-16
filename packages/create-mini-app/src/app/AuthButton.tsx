'use client';
import { walletAuth } from '@/auth/walletAuth';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export const AuthButton = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const onClick = useCallback(async () => {
    setIsPending(true);
    setTimeout(() => setIsPending(false), 5000);

    let result;

    try {
      result = await walletAuth();
    } catch (error) {
      console.error('Wallet authentication failed', error);
      setIsPending(false);
      return;
    }

    if (result?.error) {
      console.error('Wallet authentication failed', result);
    }

    setIsPending(false);
    router.push('/dashboard');
  }, [router]);

  return (
    <button onClick={onClick} disabled={isPending}>
      {isPending ? 'Authing...' : 'Sign in with your wallet'}
    </button>
  );
};
