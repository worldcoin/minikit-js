"use client";

import { VerifyAction } from "./VerifyAction";
import { Pay } from "./Pay";
import { User } from "./User";
import { Nav } from "./Nav";
import { WalletAuth } from "./WalletAuth";
import { ExternalLinks } from "./ExternalLinks";
import dynamic from "next/dynamic";
import { CameraComponent } from "./Camera";
import { SendTransaction } from "./Transaction";
import { SignMessage } from "./SignMessage";
import { SignTypedData } from "./SignTypedMessage";
import { ShareContacts } from "./ShareContacts";

const VersionsNoSSR = dynamic(
  () => import("./Versions").then((comp) => comp.Versions),
  { ssr: false }
);

export const ClientContent = () => {
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
          <SendTransaction />
          <hr />
          <SignMessage />
          <hr />
          <SignTypedData />
          <hr />
          <ShareContacts />
          <hr />
          <input className="text-xs border-black border-2" />
          <ExternalLinks />
          <hr />
          <CameraComponent />
        </div>
      </div>
    </div>
  );
};
