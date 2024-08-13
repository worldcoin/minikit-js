"use client";

import { VerifyAction } from "./VerifyAction";
import { Pay } from "./Pay";
import { User } from "./User";
import { Nav } from "./Nav";
import { WalletAuth } from "./WalletAuth";
import { ExternalLinks } from "./ExternalLinks";
import dynamic from "next/dynamic";
import {
  MiniKit,
  ResponseEvent,
  ISuccessResult,
  MiniAppVerifyActionPayload,
} from "@worldcoin/minikit-js";
import { useEffect } from "react";

const VersionsNoSSR = dynamic(
  () => import("./Versions").then((comp) => comp.Versions),
  { ssr: false }
);

export const ClientContent = () => {
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppVerifyAction,
      async (response: MiniAppVerifyActionPayload) => {
        if (response.status === "error") {
          return console.log("Error payload", response);
        }

        // Verify the proof in the backend
        const verifyResponse = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: response as ISuccessResult, // Parses only the fields we need to verify
            action: "voting-action",
            signal: "0x12312", // Optional
          }),
        });

        // TODO: Handle Success!
        const verifyResponseJson = await verifyResponse.json();
        if (verifyResponseJson.status === 200) {
          console.log("Verification success!");
        }
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, []);
  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2">
      <Nav />
      <hr />

      <div className="grid gap-y-4 content-start">
        <User />
        <hr />

        <div className="grid gap-y-8">
          <VersionsNoSSR />
          <hr />
          <VerifyAction />
          <hr />
          <Pay />
          <hr />
          <WalletAuth />
          <hr />
          <ExternalLinks />
        </div>
      </div>
    </div>
  );
};
