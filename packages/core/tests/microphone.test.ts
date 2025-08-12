// Mock MiniKit module
jest.mock('minikit', () => ({
  MiniKit: {
    subscribe: jest.fn(),
  },
}));

// Mock sendWebviewEvent before importing any modules
jest.mock('helpers/send-webview-event', () => ({
  sendWebviewEvent: jest.fn(),
}));

describe('Microphone Helper', () => {
  let originalNavigator: any;
  let originalMediaStreamTrack: any;
  let originalWindow: any;
  
  beforeEach(() => {
    // Reset modules to clear the microphoneSetupDone flag
    jest.resetModules();
    
    // Clear all mocks
    jest.clearAllMocks();
    // Store originals
    originalNavigator = global.navigator;
    originalMediaStreamTrack = global.MediaStreamTrack;
    originalWindow = global.window;
    
    // Create window mock
    (global as any).window = {
      __stopAllMiniAppMicrophoneStreams: undefined,
    };
    
    // Create Event mock
    (global as any).Event = class {
      constructor(public type: string) {}
    };
    
    // Create MediaStreamTrack mock
    class MockMediaStreamTrack {
      readyState = 'live';
      stop = jest.fn(function(this: any) {
        this.readyState = 'ended';
        setTimeout(() => {
          if (this.dispatchEvent) {
            this.dispatchEvent(new Event('ended'));
          }
        }, 0);
      });
      addEventListener = jest.fn();
      dispatchEvent = jest.fn();
    }
    MockMediaStreamTrack.prototype.stop = jest.fn(function(this: any) {
      this.readyState = 'ended';
      setTimeout(() => this.dispatchEvent(new Event('ended')), 0);
    });
    (global as any).MediaStreamTrack = MockMediaStreamTrack;
    
    // Create navigator mock
    (global as any).navigator = {
      mediaDevices: {},
    };
    
    // Store original implementations
    originalNavigator = global.navigator;
    originalMediaStreamTrack = global.MediaStreamTrack;
    
    // Mock MediaStream and MediaStreamTrack
    const mockAudioTrack = {
      kind: 'audio',
      readyState: 'live',
      stop: jest.fn(function(this: any) {
        this.readyState = 'ended';
        if (this.onended) this.onended();
      }),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    
    const mockVideoTrack = {
      kind: 'video',
      readyState: 'live',
      stop: jest.fn(function(this: any) {
        this.readyState = 'ended';
        if (this.onended) this.onended();
      }),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
    
    // Mock getUserMedia
    (global.navigator.mediaDevices as any).getUserMedia = jest.fn(async (constraints: MediaStreamConstraints) => {
      const tracks: any[] = [];
      
      if (constraints.audio) {
        tracks.push({ ...mockAudioTrack });
      }
      
      if (constraints.video) {
        tracks.push({ ...mockVideoTrack });
      }
      
      return {
        id: 'mock-stream-id',
        getTracks: () => tracks,
        getAudioTracks: () => tracks.filter(t => t.kind === 'audio'),
        getVideoTracks: () => tracks.filter(t => t.kind === 'video'),
      };
    });
    
    // Mock MediaStreamTrack.prototype.stop
    MediaStreamTrack.prototype.stop = jest.fn(function(this: any) {
      this.readyState = 'ended';
      setTimeout(() => this.dispatchEvent(new Event('ended')), 0);
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    // Restore originals
    global.navigator = originalNavigator;
    global.MediaStreamTrack = originalMediaStreamTrack;
    global.window = originalWindow;
  });
  
  describe('setupMicrophone', () => {
    it('should not send microphone events for video-only streams', async () => {
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      
      // Request video-only stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Should NOT send microphone-stream-started event
      const sendWebviewEvent = require('helpers/send-webview-event').sendWebviewEvent;
      expect(sendWebviewEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'microphone-stream-started',
        })
      );
      
      // Verify stream was returned successfully
      expect(stream).toBeDefined();
      expect(stream.getVideoTracks()).toHaveLength(1);
      expect(stream.getAudioTracks()).toHaveLength(0);
    });
    
    it('should send microphone events for audio streams', async () => {
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      
      // Request audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Should send microphone-stream-started event
      const sendWebviewEvent = require('helpers/send-webview-event').sendWebviewEvent;
      expect(sendWebviewEvent).toHaveBeenCalledWith({
        command: 'microphone-stream-started',
        version: 1,
        payload: {
          streamId: 'mock-stream-id',
        },
      });
      
      // Verify stream was returned successfully
      expect(stream).toBeDefined();
      expect(stream.getAudioTracks()).toHaveLength(1);
      expect(stream.getVideoTracks()).toHaveLength(0);
    });
    
    it('should send microphone events for combined audio+video streams', async () => {
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      
      // Request both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      // Should send microphone-stream-started event (because audio is present)
      const sendWebviewEvent = require('helpers/send-webview-event').sendWebviewEvent;
      expect(sendWebviewEvent).toHaveBeenCalledWith({
        command: 'microphone-stream-started',
        version: 1,
        payload: {
          streamId: 'mock-stream-id',
        },
      });
      
      // Verify stream was returned successfully
      expect(stream).toBeDefined();
      expect(stream.getAudioTracks()).toHaveLength(1);
      expect(stream.getVideoTracks()).toHaveLength(1);
    });
    
    it('should only track ended events for audio tracks', async () => {
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      // Verify only audio tracks have ended event listeners
      expect(audioTracks[0].addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(videoTracks[0].addEventListener).not.toHaveBeenCalled();
    });
    
    it('should not set up microphone tracking twice', () => {
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      const firstWrappedFunction = navigator.mediaDevices.getUserMedia;
      
      setupMicrophone();
      const secondWrappedFunction = navigator.mediaDevices.getUserMedia;
      
      // Should be the same function (not wrapped again)
      expect(firstWrappedFunction).toBe(secondWrappedFunction);
    });
    
    it('should handle streams with no tracks gracefully', async () => {
      // Mock getUserMedia to return empty stream
      (global.navigator.mediaDevices as any).getUserMedia = jest.fn(async () => ({
        id: 'empty-stream-id',
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      }));
      
      const { setupMicrophone } = require('helpers/microphone');
      setupMicrophone();
      
      const stream = await navigator.mediaDevices.getUserMedia({});
      
      // Should not send any events for empty stream
      const sendWebviewEvent = require('helpers/send-webview-event').sendWebviewEvent;
      expect(sendWebviewEvent).not.toHaveBeenCalled();
      
      // Verify stream was returned successfully
      expect(stream).toBeDefined();
      expect(stream.getTracks()).toHaveLength(0);
    });
  });
});