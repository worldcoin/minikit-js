"use client";

import { VerifyAction } from "./VerifyAction";
import { Pay } from "./Pay";
import { User } from "./User";
import { Nav } from "./Nav";

export const ClientContent = () => {
  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2">
      <Nav />
      <hr />

      <div className="grid gap-y-4 content-start">
        <User />
        <hr />

        <div className="grid gap-y-8">
          <VerifyAction />
          <hr />
          <Pay />
        </div>
      </div>
    </div>
  );
};
