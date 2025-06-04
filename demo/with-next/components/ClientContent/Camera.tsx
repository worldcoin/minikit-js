import { ChangeEvent, useCallback, useEffect, useState } from 'react';

export const CameraComponent = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, source: string) => {
      const files = event.target.files;
      if (!files) {
        return;
      }
    },
    [],
  );

  // create an endpoint to poll if a mic stream is still active
  useEffect(() => {
    const interval = setInterval(() => {
      if (stream && stream.getTracks().length > 0) {
        const audioTracks = stream.getAudioTracks();
        const isRecording = audioTracks.some(
          (track) => track.readyState === 'live' && track.enabled,
        );

        if (isRecording) {
          console.log('[Camera] Mic stream is actively recording');
        } else {
          console.log(
            '[Camera] Mic stream is not recording or tracks are ended',
          );
          setIsMicOn(false);
          clearInterval(interval);
        }
      } else {
        setIsMicOn(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  const endRecording = useCallback(() => {
    if (window.__stopAllMiniAppMicrophoneStreams) {
      console.log('[Camera] Stopping all microphone streams');
      window.__stopAllMiniAppMicrophoneStreams();
    }
  }, []);

  const playSound = useCallback(() => {
    const audio = new Audio('/money.mp3');
    audio.play();
  }, []);

  const handleMicAccess = useCallback(async () => {
    if (isMicOn) {
      // Stop microphone access
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setIsMicOn(false);
    } else {
      // Start microphone access
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(newStream);
        setIsMicOn(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  }, [isMicOn, stream]);

  return (
    <div className="gap-y-2 grid">
      <p className="font-bold text-lg">Permissions</p>
      <label
        className={
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10'
        }
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          capture="user"
          onChange={(event) => handleChange(event, 'camera')}
        />
        <div className="grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white">
          Open Camera
        </div>
      </label>
      <button className="grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white">
        Open Universal Link
      </button>
      <label
        className={
          ' items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10'
        }
      >
        <input
          type="file"
          accept="video/*"
          className="hidden"
          capture="user"
          onChange={(event) => handleChange(event, 'camera')}
        />
        <div className="grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white">
          Open Video
        </div>
      </label>
      <label className=" items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={(event) => handleChange(event, 'gallery')}
        />
        <div className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white">
          Open Gallery
        </div>
      </label>
      <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full"
          onClick={handleMicAccess}
        >
          {isMicOn ? 'Stop microphone' : 'Activate microphone'}
        </button>
      </label>
      <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full"
          onClick={endRecording}
        >
          Stop Mic
        </button>
      </label>
      <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full"
          onClick={playSound}
        >
          Play Sound
        </button>
      </label>
      <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-blue-500 p-4 rounded-lg text-white w-full mt-4"
          onClick={() => {
            navigator.geolocation.getCurrentPosition(
              (position) =>
                alert(
                  `Location: ${position.coords.latitude}, ${position.coords.longitude}`,
                ),
              (error) => alert(`Error: ${error.message}`),
            );
          }}
        >
          Get Location
        </button>
      </label>
      <label
        htmlFor="fileInput"
        className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10 cursor-pointer"
      >
        <input
          type="file"
          id="fileInput"
          multiple
          accept="*/*"
          onChange={(event) => {
            const files = event.target.files;
            if (!files) {
              return;
            }
            console.log(files);
            setSelectedFiles(Array.from(files));
          }}
          style={{ display: 'none' }}
        />
        <div className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white">
          Open File Picker
        </div>
      </label>
      {/* Display selected files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <p className="font-bold">Selected Files:</p>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
