"use client";
import { MiniKit } from "@worldcoin/minikit-js";
import { useEffect, ReactNode } from "react";

export const MiniKitProvider = ({
  app_id,
  children,
}: {
  app_id: `app_${string}`;
  children: ReactNode;
}) => {
  useEffect(() => {
    MiniKit.install({
      app_id: app_id,
    });
  }, [app_id]);

  return <>{children}</>;
};
