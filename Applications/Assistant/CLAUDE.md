# Work Assistant - Project Instructions

## Overview

Web-based Claude Code terminal for the Work Assistant application. Provides an embedded interactive Claude Code session in the browser.

## Architecture

- **Backend**: Node.js/Express server (port 3333)
- **Terminal**: WebSocket + node-pty spawns Claude Code CLI
- **Frontend**: Vanilla HTML/CSS/JS with xterm.js terminal emulator

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express server with WebSocket handler |
| `services/terminal.js` | PTY terminal management, spawns Claude Code |
| `public/index.html` | Terminal UI with xterm.js |
| `public/styles.css` | Dark theme styling |

## How It Works

1. User clicks "Start Claude Code"
2. Frontend opens WebSocket connection to server
3. Server spawns PowerShell via node-pty
4. Server automatically runs `claude` command
5. All I/O is piped through WebSocket to xterm.js in browser

## No API Key Required

This app uses your **Claude Code CLI subscription** - no Anthropic API key needed. The terminal runs the same `claude` command you use in your regular terminal.

## Development

```bash
# Install dependencies
npm install

# Start server
npm start
```

Server runs on http://localhost:3333

## Dependencies

- `express` - Web server
- `ws` - WebSocket server
- `node-pty` - Pseudo-terminal for spawning Claude Code

## UI Theme

Consistent with Claude HQ apps:
- Background: `#0a0a0f`
- Accent: `#00b4d8` (cyan)
- Terminal theme matches VS Code dark

## Port

**3333** - Never use 6666 (causes issues on this system)

## Parent Project

Part of Claude HQ (`C:\Users\kapla\OneDrive\Desktop\Claude HQ`)

## Working Directory

Terminal is locked to: `C:\Users\kapla\OneDrive\Desktop\Claude HQ\Applications\Assistant`

Claude Code will have full context of this project when started.
