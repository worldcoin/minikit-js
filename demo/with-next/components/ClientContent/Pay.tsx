import {
  MiniKit,
  PayCommandInput,
  PaymentErrorCodes,
  ResponseEvent,
  Tokens,
  tokenToDecimals,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const paymentSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  transaction_status: yup.string<'submitted'>().oneOf(['submitted']),
  transaction_id: yup.string().required(),
  reference: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});

const paymentErrorPayloadSchema = yup.object({
  error_code: yup
    .string<PaymentErrorCodes>()
    .oneOf(Object.values(PaymentErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
});

export const Pay = () => {
  const [paymentAppPayload, setPaymentAppPayload] = useState<
    string | undefined
  >();
  const [tempInstallFix, setTempInstallFix] = useState(0);
  const [paymentPayloadValidationMessage, setPaymentPayloadValidationMessage] =
    useState<string | null>();

  const [sentPayPayload, setSentPayPayload] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppPayment, async (payload) => {
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
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
    };
  }, [tempInstallFix]);

  const onPayClick = useCallback(
    async (amount: number, address: string, token?: Tokens) => {
      const wldAmount = tokenToDecimals(amount, Tokens.WLD);
      const usdcAmount = tokenToDecimals(amount, Tokens.USDCE);

      const tokenPayload = [
        {
          symbol: Tokens.WLD,
          token_amount: wldAmount.toString(),
        },
        {
          symbol: Tokens.USDCE,
          token_amount: usdcAmount.toString(),
        },
      ];

      const payPayload: PayCommandInput = {
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
      };

      const payload = MiniKit.commands.pay(payPayload);
      setTempInstallFix((prev) => prev + 1);
      setSentPayPayload({
        payload,
      });
    },
    [],
  );

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Pay</h2>

        <div>
          <p>Sent payload: Spec is still WIP</p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentPayPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-4">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() =>
              onPayClick(0.1, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
            }
          >
            Pay (USDCE + WLD)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() =>
              onPayClick(
                0.1,
                '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                Tokens.WLD,
              )
            }
          >
            Pay Single (WLD)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() =>
              onPayClick(
                0.1,
                '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
                Tokens.USDCE,
              )
            }
          >
            Pay Single (USDC)
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppPayment}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {paymentAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {paymentPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
      </div>
    </div>
  );
};
