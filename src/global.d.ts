interface Window {
  webkit?: {
    messageHandlers?: {
      minikit?: {
        postMessage?: (payload: Record<string, any>) => void;
      };
    };
  };

  Android?: {
    minikit?: () => {
      sendEvent: (payload: string) => void;
    };
  };

  MiniKit?: import("./minikit").MiniKit;
}
