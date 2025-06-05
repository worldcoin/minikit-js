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
    sendWebviewEvent({
      command: 'microphone-stream-started',
      version: 1,
      payload: {
        streamId: stream.id,
      },
    });
    live.add(stream);
    stream.getTracks().forEach((t) => {
      t.addEventListener('ended', () => {
        sendWebviewEvent({
          command: 'microphone-stream-ended',
          version: 1,
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
        sendWebviewEvent({
          command: 'microphone-stream-ended',
          version: 1,
          payload: {
            streamId: s.id,
          },
        });
      });
    });
    live.clear();
  };

  MiniKit.subscribe(ResponseEvent.MiniAppMicrophone, (payload) => {
    // If the miniapp has requested the microphone and it has not been granted,
    // we stop all streams.
    if (
      payload.status === 'error' &&
      (payload.error_code ===
        MicrophoneErrorCodes.MiniAppPermissionNotEnabled ||
        payload.error_code ===
          MicrophoneErrorCodes.WorldAppPermissionNotEnabled)
    ) {
      console.log('stopping all microphone streams', payload);
      stopAllMiniAppMicrophoneStreams();
    }
  });

  window.__stopAllMiniAppMicrophoneStreams = stopAllMiniAppMicrophoneStreams;
  microphoneSetupDone = true;
};
