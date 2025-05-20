import { sendWebviewEvent } from 'helpers/send-webview-event';
import { MiniKit } from 'minikit';
import { MicrophoneErrorCodes } from 'types/errors';
import { ResponseEvent } from 'types/responses';

let microphoneSetupDone = false;

export const setupMicrophone = () => {
  if (microphoneSetupDone) {
    return;
  }

  if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia)
    return;

  // We need to do this on iOS since ended is not fired when the track is stopped.
  const originalStop = MediaStreamTrack.prototype.stop;
  MediaStreamTrack.prototype.stop = function () {
    originalStop.call(this);
    if (this.readyState === 'ended') {
      setTimeout(() => this.dispatchEvent(new Event('ended')), 0);
    }
  };

  const realGUM = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const live = new Set<MediaStream>();

  async function wrapped(constraints: MediaStreamConstraints) {
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
      t.addEventListener('ended', () => {
        console.log('[Microphone] Track ended', t, 'for stream:', stream.id);
        sendWebviewEvent({
          command: 'microphone-stream-ended',
          payload: {
            streamId: stream.id,
          },
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

  const stopAllMiniAppMicrophoneStreams = () => {
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

  MiniKit.subscribe(ResponseEvent.MiniAppMicrophone, (payload) => {
    console.log('[Microphone] Microphone', payload);
    // If the miniapp has requested the microphone and it has not been granted,
    // we stop all streams.
    if (
      payload.status === 'error' &&
      (payload.error_code ===
        MicrophoneErrorCodes.MiniAppPermissionNotEnabled ||
        payload.error_code ===
          MicrophoneErrorCodes.WorldAppPermissionNotEnabled)
    ) {
      stopAllMiniAppMicrophoneStreams();
    }
  });

  window.__stopAllMiniAppMicrophoneStreams = () =>
    stopAllMiniAppMicrophoneStreams;

  microphoneSetupDone = true;
};
