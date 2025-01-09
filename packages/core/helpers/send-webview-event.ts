export const sendWebviewEvent = <
  T extends Record<string, any> = Record<string, any>,
>(
  payload: T,
) => {
  if (window.webkit) {
    window.webkit?.messageHandlers?.minikit?.postMessage?.(payload);
  } else if (window.Android) {
    window.Android.postMessage?.(JSON.stringify(payload));
  }
};
