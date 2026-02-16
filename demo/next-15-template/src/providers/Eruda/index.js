'use client';
import dynamic from 'next/dynamic';
import { jsx as _jsx } from 'react/jsx-runtime';
const Eruda = dynamic(() => import('./eruda-provider').then((c) => c.Eruda), {
  ssr: false,
});
export const ErudaProvider = (props) => {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    return props.children;
  }
  return _jsx(Eruda, { children: props.children });
};
