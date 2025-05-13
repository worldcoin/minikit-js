(function () {
  if (!navigator.mediaDevices?.getUserMedia) return;

  const realGUM = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const live = new Set<MediaStream>();

  async function wrapped(constraints: MediaStreamConstraints) {
    // We create the default stream the developer can interact with.
    const stream = await realGUM(constraints);
    live.add(stream);
    stream
      .getTracks()
      .forEach((t) => t.addEventListener('ended', () => live.delete(stream)));
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
    live.forEach((s: MediaStream) => s.getTracks().forEach((t) => t.stop()));
    live.clear();
  };
})();
