"use client";

import { VerifyAction } from "./VerifyAction";
import { Pay } from "./Pay";
import { User } from "./User";
import { Nav } from "./Nav";
import { WalletAuth } from "./WalletAuth";
import { ExternalLinks } from "./ExternalLinks";
import dynamic from "next/dynamic";

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
          <ExternalLinks />
        </div>
      </div>
    </div>
  );
};
