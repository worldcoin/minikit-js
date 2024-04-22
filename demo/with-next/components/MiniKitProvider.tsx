"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { useEffect, ReactNode } from "react";

export const MiniKitProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    MiniKit.install();
  }, []);

  return <>{children}</>;
};
``