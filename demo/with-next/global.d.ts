interface Window {
  webkit?: {
    messageHandlers?: {
      minikit?: {
        postMessage?: (payload: Record<string, any>) => void;
      };
    };
  };
  __stopAllMiniAppMicrophoneStreams?: () => void;
  Android?: {
    postMessage?: (payload: string) => void;
  };

  MiniKit?: import('@worldcoin/minikit-js').MiniKit;

  WorldApp?: {
    world_app_version: number;
    device_os: 'ios' | 'android';

    supported_commands: Array<{
      name: import('@worldcoin/minikit-js').Command;
      supported_versions: Array<number>;
    }>;
  };
}
