import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect } from "react";

export const MiniKitProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    MiniKit.install();
  }, []);

  return <>{children}</>;
};
