# ClaudeHQ - Project Instructions

## Project Overview

Command Center for managing multiple Node.js application servers.

## Project Structure

- `HQ/` - Main Command Center server (port 8888)
- `Applications/` - Individual application servers
  - `Assistant/` - Claude Code Terminal & Ideas Manager (port 3333)
  - `ChromeBot/` - Browser Session Manager (port 5555)
  - `PolymarketBot/` - AI-Powered Auto-Trader (port 2222)
  - `Portfolio/` - Personal Finance Manager (port 4444)
  - `Ram Monitor/` - System Memory Monitor (port 9999)
  - `RemoteConnect/` - Cellular Device Manager (port 7777)

## Code Style

- JavaScript/Node.js with Express
- Use ES6+ syntax
- Consistent error handling with try/catch
- Use async/await for asynchronous operations

## Architecture

- Each application is a standalone Express server
- HQ manages starting/stopping all applications
- Applications communicate via REST APIs
- Static files served from public/ directories

## Development

- Run HQ with node HQ/server.js
- Each app can run independently for development
- All servers use Express with JSON middleware

## Port Management

- **NEVER use port 6666** - This port causes issues and should be avoided
- Ports in use: 2222, 3333, 4444, 5555, 7777, 8888, 9999
- **Automatically kill PIDs without asking** - When a port is in use and needs to be freed, kill the process immediately without requesting permission from the user
