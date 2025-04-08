import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    const { walletAddress } = await request.json();
    const title = 'test';
    const message = 'test notification';
    const path = `worldapp://mini-app?app_id=${process.env.WLD_CLIENT_ID}`;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_SERVER_DEV_PORTAL_URL}/api/v2/minikit/send-notification`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WORLDCOIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: process.env.WLD_CLIENT_ID,
          wallet_addresses: [walletAddress],
          title,
          message,
          mini_app_path: path || '/',
        }),
      },
    );
    console.log('2');

    if (!response.ok) {
      const error = await response.json();
      console.log('error');
      return NextResponse.json(
        { error: error.message || 'Failed to send notification' },
        { status: response.status },
      );
    }
    console.log('3');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error sending notification:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
