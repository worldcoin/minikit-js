import { signIn, signOut, useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export const Nav = () => {
  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);
  return _jsxs('header', {
    className: 'flex justify-between gap-x-2',
    children: [
      _jsx('h1', { className: 'text-2xl font-bold', children: 'MiniKit V1' }),
      _jsx('button', {
        onClick: user?.name ? () => signOut() : () => signIn('worldcoin'),
        className:
          'text-white bg-black hover:bg-gray-500 transition p-4 leading-[1] rounded-md',
        children: user?.name ? 'Sign Out' : 'Sign In',
      }),
    ],
  });
};
