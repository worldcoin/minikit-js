import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export const CameraComponent = () => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const handleChange = useCallback((event, source) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
  }, []);
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
  return _jsxs('div', {
    className: 'gap-y-2 grid',
    children: [
      _jsx('p', { className: 'font-bold text-lg', children: 'Permissions' }),
      _jsxs('label', {
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: [
          _jsx('input', {
            type: 'file',
            accept: 'image/*',
            className: 'hidden',
            capture: 'user',
            onChange: (event) => handleChange(event, 'camera'),
          }),
          _jsx('div', {
            className:
              'grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white',
            children: 'Open Camera',
          }),
        ],
      }),
      _jsx('button', {
        className:
          'grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white',
        children: 'Open Universal Link',
      }),
      _jsxs('label', {
        className:
          ' items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: [
          _jsx('input', {
            type: 'file',
            accept: 'video/*',
            className: 'hidden',
            capture: 'user',
            onChange: (event) => handleChange(event, 'camera'),
          }),
          _jsx('div', {
            className:
              'grid justify-items-center gap-y-2 bg-green-500 p-4 rounded-lg text-white',
            children: 'Open Video',
          }),
        ],
      }),
      _jsxs('label', {
        className:
          ' items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: [
          _jsx('input', {
            type: 'file',
            accept: 'image/*',
            className: 'hidden',
            multiple: true,
            onChange: (event) => handleChange(event, 'gallery'),
          }),
          _jsx('div', {
            className:
              'grid justify-items-center bg-green-500 p-4 rounded-lg text-white',
            children: 'Open Gallery',
          }),
        ],
      }),
      _jsx('label', {
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: _jsx('button', {
          className:
            'grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full',
          onClick: handleMicAccess,
          children: isMicOn ? 'Stop microphone' : 'Activate microphone',
        }),
      }),
      _jsx('label', {
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: _jsx('button', {
          className:
            'grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full',
          onClick: endRecording,
          children: 'Stop Mic',
        }),
      }),
      _jsx('label', {
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: _jsx('button', {
          className:
            'grid justify-items-center bg-green-500 p-4 rounded-lg text-white w-full',
          onClick: playSound,
          children: 'Play Sound',
        }),
      }),
      _jsx('label', {
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10',
        children: _jsx('button', {
          className:
            'grid justify-items-center bg-blue-500 p-4 rounded-lg text-white w-full mt-4',
          onClick: () => {
            navigator.geolocation.getCurrentPosition(
              (position) =>
                console.log(
                  `Location: ${position.coords.latitude}, ${position.coords.longitude}`,
                ),
              (error) => alert(`Error: ${error.message}`),
            );
          },
          children: 'Get Location',
        }),
      }),
      _jsxs('label', {
        htmlFor: 'fileInput',
        className:
          'items-center justify-center rounded-lg bg-2f2b43/5 hover:bg-2f2b43/10 cursor-pointer',
        children: [
          _jsx('input', {
            type: 'file',
            id: 'fileInput',
            multiple: true,
            accept: '*/*',
            onChange: (event) => {
              const files = event.target.files;
              if (!files) {
                return;
              }
              console.log(files);
              setSelectedFiles(Array.from(files));
            },
            style: { display: 'none' },
          }),
          _jsx('div', {
            className:
              'grid justify-items-center bg-green-500 p-4 rounded-lg text-white',
            children: 'Open File Picker',
          }),
        ],
      }),
      selectedFiles.length > 0 &&
        _jsxs('div', {
          className: 'mt-4',
          children: [
            _jsx('p', { className: 'font-bold', children: 'Selected Files:' }),
            _jsx('ul', {
              children: selectedFiles.map((file, index) =>
                _jsx('li', { children: file.name }, index),
              ),
            }),
          ],
        }),
    ],
  });
};
