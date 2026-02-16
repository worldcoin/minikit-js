'use client';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
import { useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * This component is used to pay a user
 * The payment command simply does an ERC20 transfer
 * But, it also includes a reference field that you can search for on-chain
 */
export const Pay = () => {
  const [buttonState, setButtonState] = useState(undefined);
  const onClickPay = async () => {
    // Lets use Alex's username to pay!
    const address = (await MiniKit.getUserByUsername('alex')).walletAddress;
    setButtonState('pending');
    const res = await fetch('/api/initiate-payment', {
      method: 'POST',
    });
    const { id } = await res.json();
    try {
      const result = await MiniKit.pay({
        reference: id,
        to: address ?? '0x0000000000000000000000000000000000000000',
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(0.5, Tokens.WLD).toString(),
          },
          {
            symbol: Tokens.USDC,
            token_amount: tokenToDecimals(0.1, Tokens.USDC).toString(),
          },
        ],
        description: 'Test example payment for minikit',
      });
      console.log(result.data);
      setButtonState('success');
      // It's important to actually check the transaction result on-chain
      // You should confirm the reference id matches for security
      // Read more here: https://docs.world.org/mini-apps/commands/pay#verifying-the-payment
    } catch {
      setButtonState('failed');
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    }
  };
  return _jsxs('div', {
    className: 'grid w-full gap-4',
    children: [
      _jsx('p', { className: 'text-lg font-semibold', children: 'Pay' }),
      _jsx(LiveFeedback, {
        label: {
          failed: 'Payment failed',
          pending: 'Payment pending',
          success: 'Payment successful',
        },
        state: buttonState,
        className: 'w-full',
        children: _jsx(Button, {
          onClick: onClickPay,
          disabled: buttonState === 'pending',
          size: 'lg',
          variant: 'primary',
          className: 'w-full',
          children: 'Pay',
        }),
      }),
    ],
  });
};
