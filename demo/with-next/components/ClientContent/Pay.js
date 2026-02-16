import {
  MiniKit,
  PaymentErrorCodes,
  ResponseEvent,
  Tokens,
  tokenToDecimals,
} from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const paymentSuccessPayloadSchema = yup.object({
  status: yup.string().oneOf(['success']),
  transaction_status: yup.string().oneOf(['submitted']),
  transaction_id: yup.string().required(),
  reference: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});
const paymentErrorPayloadSchema = yup.object({
  error_code: yup.string().oneOf(Object.values(PaymentErrorCodes)).required(),
  status: yup.string().equals(['error']).required(),
});
/* Asynchronous Implementation
For the purpose of variability some of these commands use async handlers
and some of the commands user synchronous responses.
*/
export const Pay = () => {
  const [paymentAppPayload, setPaymentAppPayload] = useState();
  const [paymentPayloadValidationMessage, setPaymentPayloadValidationMessage] =
    useState();
  const [sentPayPayload, setSentPayPayload] = useState(null);
  const validateResponse = async (payload) => {
    console.log('MiniAppPayment, SUBSCRIBE PAYLOAD', payload);
    if (payload.status === 'error') {
      const errorMessage = await validateSchema(
        paymentErrorPayloadSchema,
        payload,
      );
      if (!errorMessage) {
        setPaymentPayloadValidationMessage('Payload is valid');
      } else {
        setPaymentPayloadValidationMessage(errorMessage);
      }
    } else {
      const errorMessage = await validateSchema(
        paymentSuccessPayloadSchema,
        payload,
      );
      if (!errorMessage) {
        setPaymentPayloadValidationMessage('Payload is valid');
      } else {
        setPaymentPayloadValidationMessage(errorMessage);
      }
    }
    setPaymentAppPayload(JSON.stringify(payload, null, 2));
  };
  const onPayClick = useCallback(async (amount, address, token) => {
    const wldAmount = tokenToDecimals(amount, Tokens.WLD);
    const usdcAmount = tokenToDecimals(amount, Tokens.USDC);
    const tokenPayload = [
      {
        symbol: Tokens.WLD,
        token_amount: wldAmount.toString(),
      },
      {
        symbol: Tokens.USDC,
        token_amount: usdcAmount.toString(),
      },
    ];
    const payPayload = {
      to: address,
      tokens: token
        ? [
            {
              symbol: token,
              token_amount:
                token === Tokens.WLD
                  ? wldAmount.toString()
                  : usdcAmount.toString(),
            },
          ]
        : tokenPayload,
      description: 'Test example payment for minikit on Worldchain',
      reference: new Date().toISOString(),
      fallback: async () => {
        console.warn('MiniKit.pay fallback called');
        // Implement your own payment logic here, e.g. using a web3 provider
        // This is just a placeholder to simulate a successful payment response
        return {
          transactionId: '0x1234567890abcdef',
          reference: new Date().toISOString(),
          from: '0xabcdef1234567890',
          chain: 'worldchain',
          timestamp: new Date().toISOString(),
        };
      },
    };
    const finalPayload = await MiniKit.pay(payPayload);
    setSentPayPayload(payPayload);
    await validateResponse(finalPayload);
  }, []);
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        className: 'grid gap-y-2',
        children: [
          _jsx('h2', { className: 'text-2xl font-bold', children: 'Pay' }),
          _jsxs('div', {
            children: [
              _jsx('p', { children: 'Sent payload: Spec is still WIP' }),
              _jsx('div', {
                className: 'bg-gray-300 min-h-[100px] p-2',
                children: _jsx('pre', {
                  className: 'break-all whitespace-break-spaces',
                  children: JSON.stringify(sentPayPayload, null, 2),
                }),
              }),
            ],
          }),
          _jsxs('div', {
            className: 'grid grid-cols-3 gap-x-4',
            children: [
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () =>
                  onPayClick(0.1, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
                children: 'Pay (USDC + WLD)',
              }),
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () =>
                  onPayClick(
                    0.1,
                    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                    Tokens.WLD,
                  ),
                children: 'Pay Single (WLD)',
              }),
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () =>
                  onPayClick(
                    0.1,
                    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                    Tokens.USDC,
                  ),
                children: 'Pay Single (USDC)',
              }),
            ],
          }),
        ],
      }),
      _jsx('hr', {}),
      _jsxs('div', {
        className: 'w-full grid gap-y-2',
        children: [
          _jsxs('p', {
            children: ['Message from "', ResponseEvent.MiniAppPayment, '" '],
          }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: paymentAppPayload ?? JSON.stringify(null),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('p', { children: 'Validation message:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children: paymentPayloadValidationMessage ?? 'No validation',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
