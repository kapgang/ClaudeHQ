# RemoteConnect - Multi-Device Android Remote Access System

A comprehensive web-based system for managing multiple Android devices remotely with proxy support, screen streaming, and input control.

## Features

- **Multi-Device Management**: Monitor and control multiple Android devices simultaneously
- **Real-Time Updates**: WebSocket-based real-time device status updates
- **Proxy Management**: Configure HTTP/HTTPS and SOCKS5 proxies per device
- **Screen Streaming**: Stream device screens using scrcpy (requires scrcpy installation)
- **Input Control**: Send touch, swipe, keyboard, and button inputs to devices
- **Device Auto-Detection**: Automatically detects connected ADB devices
- **Web Dashboard**: Beautiful, responsive web UI for device management

## Prerequisites

1. **Node.js** (v14 or higher)
2. **ADB (Android Debug Bridge)** - Must be installed and in your system PATH
   - Download from: https://developer.android.com/studio/releases/platform-tools
   - Verify installation: `adb version`
3. **USB Debugging** enabled on all Android devices
4. **scrcpy** (optional, for screen streaming)
   - Download from: https://github.com/Genymobile/scrcpy
   - Must be in PATH or configured in `lib/screenStreamer.js`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Ensure ADB is in your PATH:
```bash
adb version
```

3. Connect your Android device(s) via USB and authorize USB debugging

## Running the Server

Start the server:
```bash
npm start
```

The server will run on `http://localhost:7777`

Open your browser and navigate to the URL to access the dashboard.

## Project Structure

```
RemoteConnect/
├── server.js              # Express server with WebSocket support
├── package.json           # Dependencies
├── devices.json           # Device state persistence (auto-generated)
├── lib/
│   ├── deviceManager.js   # ADB device detection and management
│   ├── proxyManager.js    # Proxy configuration management
│   ├── inputController.js # Touch/keyboard input handling
│   └── screenStreamer.js  # scrcpy integration for screen streaming
└── public/
    ├── index.html         # Multi-device dashboard UI
    ├── styles.css         # Styling
    └── script.js          # Frontend JavaScript with WebSocket client
```

## API Endpoints

### Device Management
- `GET /api/devices` - Get list of all devices
- `GET /api/devices/:serial` - Get specific device info
- `POST /api/devices/:serial/connect` - Connect to a device
- `POST /api/devices/:serial/disconnect` - Disconnect a device
- `GET /api/devices/:serial/status` - Get device status

### Proxy Management
- `POST /api/devices/:serial/proxy` - Set proxy configuration
  - Body: `{ type: 'http'|'socks5', host: string, port: number }`
- `DELETE /api/devices/:serial/proxy` - Remove proxy
- `POST /api/devices/:serial/proxy/test` - Test proxy connectivity
  - Body: `{ host: string, port: number }`

### Input Control
- `POST /api/devices/:serial/input` - Send input command
  - Body: `{ type: 'tap'|'swipe'|'text'|'key'|'back'|'home'|'menu'|'power'|'longPress', ... }`

### Screen Streaming
- `POST /api/devices/:serial/stream/start` - Start screen stream
  - Body: `{ maxSize: number, bitrate: number, maxFps: number }`
- `POST /api/devices/:serial/stream/stop` - Stop screen stream

## WebSocket Events

The server broadcasts device updates via WebSocket:
- `devices` - Full device list update
- `deviceEvent` - Individual device state change
- `inputResult` - Result of input command
- `pong` - Keep-alive response

## Usage

1. **Connect Devices**: Connect Android devices via USB with USB debugging enabled
2. **View Dashboard**: Open `http://localhost:7777` in your browser
3. **Manage Devices**: 
   - View all connected devices in the grid
   - Click "Controls" to access device-specific settings
   - Configure proxies per device
   - Start/stop screen streaming
   - Send input commands

## Proxy Configuration

The system supports:
- **HTTP/HTTPS Proxies**: Works without root access using Android system settings
- **SOCKS5 Proxies**: May require root access or a VPN/proxy app

To configure a proxy:
1. Click "Proxy" button on a device card
2. Enter proxy host, port, and type
3. Click "Apply Proxy"
4. Use "Test Connection" to verify connectivity

## Screen Streaming

Screen streaming uses scrcpy. To enable:
1. Install scrcpy and ensure it's in your PATH
2. Start streaming from the device controls
3. Note: WebSocket video streaming requires additional setup (see Phase 2 implementation)

## Troubleshooting

- **Devices not detected**: 
  - Verify ADB is installed: `adb devices`
  - Check USB debugging is enabled
  - Authorize USB debugging on device
  
- **Proxy not working**:
  - HTTP proxies work without root
  - SOCKS5 may require root access
  - Verify proxy host and port are correct

- **Streaming not working**:
  - Ensure scrcpy is installed: `scrcpy --version`
  - Check scrcpy is in PATH
  - See scrcpy documentation for troubleshooting

## Future Enhancements

- iOS support (requires libimobiledevice)
- WebSocket video streaming integration
- Screen recording per device
- Automated testing capabilities
- Device grouping and bulk operations
- Proxy rotation/management
- Device health monitoring

## License

ISC
