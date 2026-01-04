# ClaudeHQ - Project Instructions

## Project Overview

Command Center for managing multiple Node.js application servers.

## Project Structure

-  - Main Command Center server (port 8888)
-  - Individual application servers
  -  - Browser Session Manager (port 5555)
  -  - Cellular Device Manager (port 7777)
  -  - System Memory Monitor (port 9999)
  -  - Personal Finance Manager (port 4444)

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
