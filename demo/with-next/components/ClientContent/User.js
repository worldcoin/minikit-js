import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export const User = () => {
  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);
  return _jsxs('div', {
    children: [
      _jsx('h2', { children: 'Session User:' }),
      user?.name
        ? _jsxs('p', {
            className: 'truncate',
            children: [
              'User name:',
              ' ',
              _jsx('span', {
                className:
                  'font-bold max-w-full truncate break-all whitespace-break-spaces',
                children: user?.name,
              }),
            ],
          })
        : _jsx('span', { className: 'font-bold', children: 'No user' }),
    ],
  });
};
