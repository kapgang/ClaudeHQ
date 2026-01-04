# Work Assistant - Project Instructions

## Overview

Work Assistant with two main features:
1. **Claude Code Terminal** - Embedded interactive Claude Code session
2. **Ideas Manager** - CRUD interface for tool/automation ideas

No API key required - uses Claude Code CLI subscription.

## Architecture

- **Backend**: Node.js/Express server (port 3333)
- **Terminal**: WebSocket + node-pty spawns Claude Code CLI
- **Ideas**: REST API with JSON file storage
- **Frontend**: Vanilla HTML/CSS/JS with xterm.js

## Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express server, WebSocket handler |
| `services/terminal.js` | PTY terminal management |
| `routes/ideas.js` | Ideas CRUD API |
| `data/ideas.json` | Ideas storage (pre-seeded) |
| `public/index.html` | UI with Terminal and Ideas modes |
| `public/styles.css` | Dark theme styling |

## Features

### Claude Code Terminal
- Embedded terminal running Claude Code CLI
- Uses your subscription (no API costs)
- Working directory locked to Assistant folder

### Ideas Manager
- **View**: Click any idea card to see full details
- **Create**: Click "New Idea" button
- **Edit**: Open idea detail modal, click Edit
- **Delete**: Open idea detail modal, click Delete
- **Discuss**: Send idea to Claude Code terminal for implementation help

### Pre-seeded Ideas (10)
Based on R&D Tax Credit Data Team work:
1. PBC Schema Validator
2. Smart Field Mapper
3. Nuance Database
4. Status Email Composer
5. Workflow Recommender
6. Q/NQ Classification Helper
7. Data Quality Dashboard
8. ET Response Library
9. Process Timer
10. Alteryx Documentation Generator

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ideas` | GET | Get all ideas |
| `/api/ideas/:id` | GET | Get single idea |
| `/api/ideas` | POST | Create new idea |
| `/api/ideas/:id` | PUT | Update idea |
| `/api/ideas/:id` | DELETE | Delete idea |
| `/api/health` | GET | Health check |

## Development

```bash
npm install
npm start
```

Server: http://localhost:3333

## Dependencies

- `express` - Web server
- `ws` - WebSocket server
- `node-pty` - Pseudo-terminal for Claude Code

## Port

**3333** - Never use 6666

## UI Theme

- Background: `#0a0a0f`
- Accent: `#00b4d8` (cyan)
- Cards: `#16161f`

## Parent Project

Part of Claude HQ (`C:\Users\kapla\OneDrive\Desktop\Claude HQ`)
