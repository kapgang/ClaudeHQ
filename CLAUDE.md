# ClaudeHQ - Project Instructions

## Project Overview

Command Center for managing multiple Node.js application servers.

## Project Structure

- `HQ/` - Main Command Center server (port 8888)
- `Applications/` - Individual application servers
  - `ChromeBot/` - Browser Session Manager (port 5555)
  - `RemoteConnect/` - Cellular Device Manager (port 7777)
  - `Ram Monitor/` - System Memory Monitor (port 9999)
  - `Portfolio/` - Personal Finance Manager (port 4444)
  - `Assistant/` - Work AI Assistant (port 3333)

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

## Port Restrictions

- **NEVER use port 6666** - This port causes issues and should be avoided
- Available ports in use: 3333, 4444, 5555, 7777, 8888, 9999
