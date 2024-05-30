"use client";

import {
  MiniKit,
  MiniKitInstallErrorCode,
  MiniKitInstallErrorMessage,
} from "@worldcoin/minikit-js";
import { useEffect } from "react";

export const Versions = () => {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.WorldApp === "undefined"
    ) {
      return;
    }

    // @ts-ignore
    console.log(MiniKit.commandsValid(window.WorldApp?.supported_commands));
  }, []);

  const isValid = () => {
    if (
      typeof window === "undefined" ||
      typeof window.WorldApp === "undefined"
    ) {
      return { isValid: false, error: "window.WorldApp is undefined" };
    }

    try {
      // @ts-ignore
      if (MiniKit.commandsValid(window.WorldApp?.supported_commands)) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error:
            MiniKitInstallErrorMessage[MiniKitInstallErrorCode.AppOutOfDate],
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: "Something went wrong on version validation",
      };
    }
  };

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Versions</h2>

      <div>
        <p>window.WorldApp:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(window.WorldApp ?? null, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <p>Is versions Valid:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(isValid() ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
