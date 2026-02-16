'use client';
import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Bank, Home, User } from 'iconoir-react';
import { useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */
export const Navigation = () => {
  const [value, setValue] = useState('home');
  return _jsxs(Tabs, {
    value: value,
    onValueChange: setValue,
    children: [
      _jsx(TabItem, { value: 'home', icon: _jsx(Home, {}), label: 'Home' }),
      _jsx(TabItem, { value: 'wallet', icon: _jsx(Bank, {}), label: 'Wallet' }),
      _jsx(TabItem, {
        value: 'profile',
        icon: _jsx(User, {}),
        label: 'Profile',
      }),
    ],
  });
};
