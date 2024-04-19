"use client";

import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
} from "@worldcoin/minikit-js";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

export const ClientContent = () => {
  const [messageFromApp, setMessageFromApp] = useState<string | undefined>();

  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const [sentPayPayload, setSentPayPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);

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

  const onVerifyClick = useCallback(() => {
    const verifyPayload = {
      app_id: process.env.NEXT_PUBLIC_VERIFY_APP_ID as `app_${string}`,
      action: process.env.NEXT_PUBLIC_VERIFY_ACTION as string,
      signal: "signal",
      verification_level: VerificationLevel.Device,
      timestamp: new Date().toISOString(),
    };

    MiniKit.commands.verify(verifyPayload);
    setSentVerifyPayload(verifyPayload);
  }, []);

  const onPayclick = useCallback(() => {
    const payPayload = {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      from: "0x6235379BAf4644cCBd22e9F6C53D35a1CF727D4C",
      value: 200.13,
      network: "optimism",
      token_address: "0x163f8C2467924be0ae7B5347228CABF260318753",
      token: "wld",
      timestamp: new Date().toISOString(),
    };

    MiniKit.commands.pay(payPayload);
    setSentPayPayload(payPayload);
  }, []);

  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2">
      <header className="flex justify-between">
        <h1 className="text-2xl font-bold">MiniKit V1</h1>

        <button
          onClick={user?.name ? () => signOut() : () => signIn("worldcoin")}
          className="text-white bg-blue-500 hover:bg-blue-300 transition p-4 leading-[1]"
        >
          {user?.name ? "Sign Out" : "Sign In"}
        </button>
      </header>

      <hr />

      <div className="grid gap-y-4 content-start">
        <div>
          <h2>Session User:</h2>
          {user?.name ? (
            <p className="truncate">
              User name:{" "}
              <span className="font-bold max-w-full truncate">
                {user?.name}
              </span>
            </p>
          ) : (
            <span className="font-bold">No user</span>
          )}
        </div>

        <hr />

        <div className="grid gap-y-8">
          <div className="grid gap-y-2">
            <h2>Verify action:</h2>

            <div>
              <p>Sent payload:</p>

              <div className="bg-gray-300 min-h-[100px] p-2">
                <pre className="break-all whitespace-break-spaces">
                  {JSON.stringify(sentVerifyPayload, null, 2)}
                </pre>
              </div>
            </div>

            <button
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={onVerifyClick}
            >
              Send verify
            </button>
          </div>

          <hr />

          <div className="grid gap-y-2">
            <h2>Pay action:</h2>

            <div>
              <p>Sent payload:</p>

              <div className="bg-gray-300 min-h-[100px] p-2">
                <pre className="break-all whitespace-break-spaces">
                  {JSON.stringify(sentPayPayload, null, 2)}
                </pre>
              </div>
            </div>

            <button
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={onPayclick}
            >
              Send pay
            </button>
          </div>

          <hr />

          <div className="w-full grid gap-y-2">
            <p>Message from the app: </p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {messageFromApp ?? JSON.stringify(null)}
              </pre>
            </div>
            <button
              onClick={() => MiniKit.commands.closeWebview()}
              className="border border-black p-4 bg-blue-800 rounded-lg text-white"
            >
              Trigger Response Payload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
