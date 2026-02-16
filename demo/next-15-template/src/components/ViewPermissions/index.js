'use client';
import { ListItem } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * This component is an example of how to view the permissions of a user
 * It's critical you use Minikit commands on client components
 * Read More: https://docs.world.org/mini-apps/commands/permissions
 */
export const ViewPermissions = () => {
  const [permissions, setPermissions] = useState({});
  const { isInstalled } = useMiniKit();
  useEffect(() => {
    const fetchPermissions = async () => {
      if (isInstalled) {
        try {
          // You can also fetch this by grabbing from user
          // MiniKit.user.permissions
          const result = await MiniKit.getPermissions();
          setPermissions(result.data.permissions || {});
          console.log('permissions', result);
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        }
      } else {
        console.log('MiniKit is not installed');
      }
    };
    fetchPermissions();
  }, [isInstalled]);
  return _jsxs('div', {
    className: 'grid w-full gap-4',
    children: [
      _jsx('p', {
        className: 'text-lg font-semibold',
        children: 'Permissions',
      }),
      permissions &&
        Object.entries(permissions).map(([permission, value]) =>
          _jsx(
            ListItem,
            { description: `Enabled: ${value}`, label: permission },
            permission,
          ),
        ),
    ],
  });
};
