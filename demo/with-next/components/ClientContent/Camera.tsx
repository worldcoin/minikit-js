import { ChangeEvent, useCallback, useState } from 'react';

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
  const endRecording = useCallback(async () => {
    if (window.__stopAllMiniAppMicrophoneStreams) {
      console.log('stopping all mic');
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
        const tracks = stream.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
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

  const handleFilePick = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        setSelectedFiles(Array.from(target.files));
        // You can now do something with the selected files, e.g., log them
        console.log('Selected files:', Array.from(target.files));
      }
    };
    input.click();
  }, []);

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
      {/* <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full"
          onClick={endRecording}
        >
          End Recording
        </button>
      </label> */}
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
      <label className="items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10">
        <button
          className="grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full mt-4"
          onClick={handleFilePick}
        >
          Open File Picker
        </button>
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
