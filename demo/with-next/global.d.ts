interface Window {
  webkit?: {
    messageHandlers?: {
      minikit?: {
        postMessage?: (payload: Record<string, any>) => void;
      };
    };
  };

  Android?: {
    postMessage?: (payload: string) => void;
  };

  MiniKit?: import("@worldcoin/minikit-react").MiniKit;

  WorldApp?: {
    world_app_version: number;
    device_os: "ios" | "android";

    supported_commands: Array<{
      name: import("@worldcoin/minikit-react").Command;
      supported_versions: Array<number>;
    }>;
  };
}
