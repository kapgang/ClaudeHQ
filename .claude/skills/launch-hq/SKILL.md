---
name: launch-hq
description: Start the ClaudeHQ command center server on port 8888. Use when the user asks to start HQ, launch HQ, launch the server, restart HQ, or begin the command center.
---

# Launch HQ Server

## Instructions

When the user wants to start the HQ server:

1. Check if a server is already running on port 8888
2. If running, kill the existing process automatically
3. Navigate to the project root directory
4. Start the server using `node HQ/server.js`
5. Wait a moment and confirm the server started successfully

## Steps to Execute

1. Run `netstat -ano | findstr :8888` to check for existing processes on port 8888
2. If a PID is found, run `taskkill /F /PID [PID]` to kill it
3. Start the server: `node HQ/server.js`
4. Verify the server started by checking the output for "listening on port 8888"

## Port Management

- HQ always runs on port 8888
- If port is in use, automatically kill the process (no need to ask)
- NEVER use port 6666 (causes issues - this is a project rule)

## Example Triggers

- "Start HQ"
- "Launch HQ"
- "Restart HQ"
- "Start the command center"
- "Launch the server"

## Expected Output

Confirm to the user that HQ is now running on http://localhost:8888
