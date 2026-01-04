---
name: kill-port
description: Terminate a process running on a specific port. Use when a port is in use, application won't start, user asks to kill a port, or needs to free up a port.
---

# Kill Process on Port

## Instructions

Safely terminate processes running on specified ports:

1. Identify which port to target (from user request or context)
2. Find the process ID (PID) running on that port
3. Terminate the process forcefully
4. Verify the port is now free
5. Confirm success to the user

## Windows Implementation

1. Find process: `netstat -ano | findstr :[PORT]`
2. Extract PID from the last column
3. Kill process: `taskkill /F /PID [PID]`
4. Verify: `netstat -ano | findstr :[PORT]` (should return empty)

## Common Ports in ClaudeHQ

- 8888: HQ Command Center
- 5555: ChromeBot (Browser Session Manager)
- 7777: RemoteConnect (Cellular Device Manager)
- 9999: Ram Monitor (System Memory Monitor)
- 4444: Portfolio (Personal Finance Manager)
- 3333: Assistant (Work AI Assistant)

## Error Handling

- If no process found on port: Inform user the port is already free
- If kill fails: Show error and suggest manual intervention
- If multiple processes: Kill all of them

## Automatic Execution

This skill should execute automatically without asking for confirmation - it's a utility function that users expect to work immediately.

## Example Triggers

- "Kill port 8888"
- "Free up port 5555"
- "Stop whatever's running on 3333"
- "Port 4444 is in use, fix it"

## Expected Output

```
Checking port [PORT]...
Found process [PID] using port [PORT]
Terminating process [PID]...
Process terminated successfully
Port [PORT] is now free
```

## Integration

This skill is often used before:
- Starting HQ (kill port 8888)
- Launching any application
- Restarting services
- Development workflow restarts
