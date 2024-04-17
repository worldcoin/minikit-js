"use client";

import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
} from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";

export const ClientContent = () => {
  const [messageFromApp, setMessageFromApp] = useState<string | undefined>();

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, (payload) => {
      console.log("MiniAppVerifyAction, SUBSCRIBE PAYLOAD", payload);
      setMessageFromApp(JSON.stringify(payload, null, 2));
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, []);

  return (
    <div className="p-8 grid grid-rows-[auto_1fr_auto] min-h-[100dvh] gap-y-2">
      <div>
        <h1>Minikit V1</h1>
        <h2 className="mt-8">Buttons: </h2>

        <div className="grid gap-y-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => {
              MiniKit.commands.verify({
                app_id: "app_...",
                action: "action identifier",
                signal: "signal",
                verification_level: VerificationLevel.Device,
                timestamp: new Date().toISOString(),
              });
            }}
          >
            Send verify
          </button>

          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => {
              MiniKit.commands.pay({
                to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
                from: "0x6235379BAf4644cCBd22e9F6C53D35a1CF727D4C",
                value: 200.13,
                network: "optimism",
                token_address: "0x163f8C2467924be0ae7B5347228CABF260318753",
                token: "wld",
                timestamp: new Date().toISOString(),
              });
            }}
          >
            Send pay
          </button>
        </div>
      </div>

      <div className="w-full justify-center grid gap-y-4">
        <p>Message from the app: </p>

        <pre>{messageFromApp}</pre>
        <button
          onClick={() => MiniKit.commands.closeWebview()}
          className="border border-black p-2 hover:bg-gray-200 bg-blue-800 rounded-xl px-2 text-white"
        >
          Trigger Response Payload [0]
        </button>
      </div>
    </div>
  );
};
