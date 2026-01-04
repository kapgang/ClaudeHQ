---
name: check-apps
description: Check the status of all ClaudeHQ applications and show which are running. Use when checking app status, verifying servers, monitoring applications, or debugging startup issues.
---

# Check Applications Status

## Instructions

Provide a comprehensive status report of all ClaudeHQ applications:

1. Check each port for listening processes
2. Identify which applications are running
3. Show PID for running processes
4. Display results in a clear, readable table
5. Highlight any issues or recommendations

## Applications to Monitor

| Application | Port | Description |
|------------|------|-------------|
| HQ | 8888 | Command Center (main dashboard) |
| ChromeBot | 5555 | Browser Session Manager |
| RemoteConnect | 7777 | Cellular Device Manager |
| Ram Monitor | 9999 | System Memory Monitor |
| Portfolio | 4444 | Personal Finance Manager |
| Assistant | 3333 | Work AI Assistant |

## Status Check Process

For each port:
1. Run `netstat -ano | findstr :[PORT]`
2. If output exists: Extract PID and mark as "Running"
3. If no output: Mark as "Stopped"
4. Store results for table display

## Output Format

```
ClaudeHQ Application Status
═══════════════════════════════════════════════════

Application          Port    Status      PID
────────────────────────────────────────────────────
HQ                   8888    Running     12345
ChromeBot            5555    Stopped     -
RemoteConnect        7777    Running     67890
Ram Monitor          9999    Stopped     -
Portfolio            4444    Running     54321
Assistant            3333    Stopped     -

Summary: 3 running, 3 stopped
```

## Additional Information

After the table, provide:
- Quick start commands for stopped apps
- Recommendation if HQ is stopped (start it first)
- Note if critical apps are down

## Example Triggers

- "Check app status"
- "What's running?"
- "Show me application status"
- "Which apps are up?"
- "Status check"

## Quick Actions

Offer helpful next steps:
- "Start HQ" if HQ is stopped
- "Kill port [X]" if there's a conflict
- "Launch all apps" if multiple are stopped

## Use Cases

- Morning startup routine
- After system restart
- Debugging port conflicts
- Verifying deployments
- Before starting development work
