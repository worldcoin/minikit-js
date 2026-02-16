import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
// This component has a button that when clicked, will send a request to the /api/nonce route
// It will then display the nonce in the component
import { useState } from 'react';
export default function CheckRequests() {
  const [nonce, setNonce] = useState(null);
  const [localNonce, setLocalNonce] = useState(null);
  const [response, setResponse] = useState(null);
  const handleClick = async () => {
    const response = await fetch('/api/nonce');
    if (response.ok) {
      const data = await response.json();
      setNonce(data.nonce);
      setLocalNonce(null);
      setResponse(data);
    }
  };
  const handlePostClick = async () => {
    const localNonce = Math.random().toString(36).substring(2, 15);
    const response = await fetch('/api/nonce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localNonce: localNonce }),
    });
    const data = await response.json();
    setNonce(data.nonce);
    setLocalNonce(localNonce);
    setResponse(data);
  };
  return _jsxs('div', {
    className: 'grid gap-y-2',
    children: [
      _jsx('h2', {
        className: 'text-2xl font-bold',
        children: 'Check Requests',
      }),
      _jsx('p', {
        className: 'text-sm text-gray-500',
        children:
          'Each time you click the button it should change the nonce. The nonce should be different for GET and POST requests. Local Nonce is the nonce that is generated on the client side and returned so you can check that requests are not being cached',
      }),
      _jsxs('div', {
        className: 'grid gap-x-2 grid-cols-2',
        children: [
          _jsx('button', {
            className: 'bg-black text-white rounded-lg p-4 w-full',
            onClick: handleClick,
            children: 'Check Nonce GET',
          }),
          _jsx('button', {
            className: 'bg-black text-white rounded-lg p-4 w-full',
            onClick: handlePostClick,
            children: 'Check Nonce POST',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'bg-gray-300 min-h-[100px] p-2',
        children: [
          _jsxs('p', { children: ['Local Nonce: ', localNonce] }),
          _jsxs('p', { children: ['Response: ', JSON.stringify(response)] }),
        ],
      }),
    ],
  });
}
