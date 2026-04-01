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
  __stopAllMiniAppMicrophoneStreams?: () => void;

  WorldApp?: {
    world_app_version: number;
    device_os: 'ios' | 'android';
    is_optional_analytics: boolean;
    supported_commands: Array<{
      name: import('./commands/types').Command;
      supported_versions: Array<number>;
    }>;
    safe_area_insets: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    verification_status?: {
      is_orb_verified: boolean;
      is_document_verified: boolean;
      is_secure_document_verified: boolean;
    };
    wallet_address?: string;
    preferred_currency?: string;
    pending_notifications?: number;
    location: { open_origin: string } | string | null | undefined;
  };
}
