import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from '@worldcoin/minikit-js';
import { NextRequest } from 'next/server';
import * as yup from 'yup';

const schema = yup.object({
  siweResponsePayload: yup.object({
    status: yup.string().optional(),
    message: yup.string().required(),
    signature: yup.string().required(),
    address: yup.string().required(),
  }),
  nonce: yup.string().required(),
});

export const POST = async (req: NextRequest) => {
  try {
    console.log(req.body);
    const body = await req.json();

    const validData = await schema.validate(body);
    if (!validData) {
      throw new Error('Invalid data');
    }

    const { siweResponsePayload, nonce } = validData;
    const validMessage = await verifySiweMessage(
      siweResponsePayload as MiniAppWalletAuthSuccessPayload,
      nonce,
    );

    return new Response(
      JSON.stringify({ status: 'success', isValid: validMessage.isValid }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error: any) {
    // Handle errors in validation or processing
    return new Response(
      JSON.stringify({
        status: 'error',
        isValid: false,
        message: error.message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
