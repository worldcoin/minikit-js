import { sendWebviewEvent } from 'helpers/send-webview-event';

export const setupMicrophone = () => {
  if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia)
    return;

  const realGUM = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const live = new Set<MediaStream>();

  async function wrapped(constraints: MediaStreamConstraints) {
    // We create the default stream the developer can interact with.
    const stream = await realGUM(constraints);
    console.log('[Microphone] Stream started', stream);
    sendWebviewEvent({
      command: 'microphone-stream-started',
      payload: {
        streamId: stream.id,
      },
    });
    live.add(stream);
    stream.getTracks().forEach((t) => {
      console.log(
        `[Microphone] Attaching 'ended' listener to track: ${t.id} for stream: ${stream.id}`,
      );
      t.addEventListener('ended', () => {
        console.log(
          `[Microphone] 'ended' listener invoked for track: ${t.id}, stream: ${stream.id}`,
        );
        try {
          console.log('[Microphone] Track ended', t, 'for stream:', stream.id);
          sendWebviewEvent({
            command: 'microphone-stream-ended',
            payload: {
              streamId: stream.id,
            },
          });
          live.delete(stream);
        } catch (error) {
          console.error(
            '[Microphone] Error in track ended listener:',
            error,
            'for stream:',
            stream?.id, // Use optional chaining for safety
            'track:',
            t?.id, // Use optional chaining for safety
          );
        }
      });
      t.addEventListener('inactive', () => {
        console.log('[Microphone] Stream inactive – everything’s stopped');
        sendWebviewEvent({
          command: 'microphone-stream-ended',
          payload: { streamId: stream.id },
        });
        live.delete(stream);
      });
    });
    return stream;
  }

  // We lock down the navigator.mediaDevices.getUserMedia property so that it cannot be overridden.
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
    value: wrapped,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  Object.freeze(navigator.mediaDevices);

  window.__stopAllMiniAppMicrophoneStreams = () => {
    live.forEach((s: MediaStream) => {
      s.getTracks().forEach((t) => {
        t.stop();
        console.log('[Microphone] Stopping track:', t.id, 'for stream:', s.id);
        sendWebviewEvent({
          command: 'microphone-stream-ended',
          payload: {
            streamId: s.id,
          },
        });
      });
    });
    live.clear();
  };
};
