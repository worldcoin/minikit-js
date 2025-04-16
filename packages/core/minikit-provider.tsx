'use client';

import { ReactNode, useEffect } from 'react';
import { MiniKit } from './minikit';

type MiniKitProps = {
  appId: string;
};

export const MiniKitProvider = ({
  children,
  props,
}: {
  children: ReactNode;
  props?: MiniKitProps;
}) => {
  useEffect(() => {
    MiniKit.install(props?.appId);
    MiniKit.commandsAsync
      .getPermissions()
      .then(({ commandPayload: _, finalPayload }) => {
        if (finalPayload.status === 'success') {
          MiniKit.user.permissions = {
            notifications: finalPayload.permissions.notifications,
            contacts: finalPayload.permissions.contacts,
          };
        }
      });
  }, [props?.appId]);

  return <>{children}</>;
};
