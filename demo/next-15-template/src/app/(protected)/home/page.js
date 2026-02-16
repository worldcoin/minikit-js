import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { Pay } from '@/components/Pay';
import { Transaction } from '@/components/Transaction';
import { UserInfo } from '@/components/UserInfo';
import { Verify } from '@/components/Verify';
import { ViewPermissions } from '@/components/ViewPermissions';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from 'react/jsx-runtime';
export default async function Home() {
  const session = await auth();
  return _jsxs(_Fragment, {
    children: [
      _jsx(Page.Header, {
        className: 'p-0',
        children: _jsx(TopBar, {
          title: 'Home',
          endAdornment: _jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              _jsx('p', {
                className: 'text-sm font-semibold capitalize',
                children: session?.user.username,
              }),
              _jsx(Marble, {
                src: session?.user.profilePictureUrl,
                className: 'w-12',
              }),
            ],
          }),
        }),
      }),
      _jsxs(Page.Main, {
        className: 'flex flex-col items-center justify-start gap-4 mb-16',
        children: [
          _jsx(UserInfo, {}),
          _jsx(Verify, {}),
          _jsx(Pay, {}),
          _jsx(Transaction, {}),
          _jsx(ViewPermissions, {}),
        ],
      }),
    ],
  });
}
