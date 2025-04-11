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

  MiniKit?: import('./minikit').MiniKit;

  WorldApp?: {
    world_app_version: number;
    device_os: 'ios' | 'android';
    is_optional_analytics: boolean;
    supported_commands: Array<{
      name: import('./types/commands').Command;
      supported_versions: Array<number>;
    }>;
  };
}
