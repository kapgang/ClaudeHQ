const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');

class ScreenStreamer extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map(); // serial -> stream process
    this.scrcpyPath = null; // Will be set based on platform
  }

  // Find scrcpy binary (placeholder - user needs to provide scrcpy)
  findScrcpyPath() {
    // Check common locations or use PATH
    // For now, assume scrcpy is in PATH
    return 'scrcpy';
    
    // Alternative: bundle scrcpy in project
    // const platform = process.platform;
    // if (platform === 'win32') {
    //   return path.join(__dirname, '..', 'scrcpy', 'scrcpy.exe');
    // } else if (platform === 'darwin') {
    //   return path.join(__dirname, '..', 'scrcpy', 'scrcpy');
    // } else {
    //   return path.join(__dirname, '..', 'scrcpy', 'scrcpy');
    // }
  }

  // Start streaming device screen
  async startStream(serial, options = {}) {
    if (this.streams.has(serial)) {
      return { success: false, error: 'Stream already running for this device' };
    }

    try {
      const scrcpyPath = this.findScrcpyPath();
      const {
        maxSize = 1024,
        bitrate = 2000000,
        maxFps = 30,
        record = false,
        recordPath = null
      } = options;

      const args = [
        '-s', serial,
        '--max-size', maxSize.toString(),
        '--bit-rate', bitrate.toString(),
        '--max-fps', maxFps.toString(),
        '--no-display', // Don't show window
        '--turn-screen-off' // Optional: turn screen off
      ];

      if (record && recordPath) {
        args.push('--record', recordPath);
      }

      const scrcpyProcess = spawn(scrcpyPath, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      scrcpyProcess.stdout.on('data', (data) => {
        this.emit('streamData', { serial, data });
      });

      scrcpyProcess.stderr.on('data', (data) => {
        console.error(`[scrcpy ${serial}]`, data.toString());
        this.emit('streamError', { serial, error: data.toString() });
      });

      scrcpyProcess.on('close', (code) => {
        console.log(`[scrcpy ${serial}] Process exited with code ${code}`);
        this.streams.delete(serial);
        this.emit('streamEnded', { serial, code });
      });

      scrcpyProcess.on('error', (err) => {
        console.error(`[scrcpy ${serial}] Error:`, err);
        this.streams.delete(serial);
        this.emit('streamError', { serial, error: err.message });
      });

      this.streams.set(serial, scrcpyProcess);
      
      // Note: scrcpy streams to a window by default
      // For WebSocket streaming, we'd need to use scrcpy-server.jar directly
      // or pipe the output. This is a placeholder implementation.
      
      return { 
        success: true, 
        note: 'Stream started. WebSocket integration requires custom scrcpy client setup.' 
      };
    } catch (err) {
      console.error(`Error starting stream for ${serial}:`, err);
      return { success: false, error: err.message };
    }
  }

  // Stop streaming device screen
  stopStream(serial) {
    const stream = this.streams.get(serial);
    if (stream) {
      stream.kill();
      this.streams.delete(serial);
      this.emit('streamStopped', { serial });
      return { success: true };
    }
    return { success: false, error: 'No stream running for this device' };
  }

  // Check if stream is running
  isStreaming(serial) {
    return this.streams.has(serial);
  }

  // Stop all streams
  stopAllStreams() {
    for (const [serial, stream] of this.streams.entries()) {
      stream.kill();
      this.emit('streamStopped', { serial });
    }
    this.streams.clear();
  }

  // Get stream info
  getStreamInfo(serial) {
    const stream = this.streams.get(serial);
    if (stream) {
      return {
        serial,
        streaming: true,
        pid: stream.pid
      };
    }
    return {
      serial,
      streaming: false
    };
  }
}

module.exports = ScreenStreamer;



