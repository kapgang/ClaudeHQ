---
name: new-app
description: Create a new Express application server in the ClaudeHQ Applications directory. Use when user wants to create a new app, add an application, set up a new server, or build a new service.
---

# Create New Application

## Instructions

When creating a new ClaudeHQ application:

1. Ask for the application name (use PascalCase for directory, e.g., "ChromeBot", "Portfolio")
2. Ask for the port number (available: 3333, 4444, 5555, 7777, 9999 - NEVER 6666)
3. Ask for a brief description of the app's purpose
4. Create modular directory structure following project standards
5. Generate Express server with standard middleware
6. Create public directory with basic HTML
7. Update HQ's server.js to include the new app
8. Create app-specific CLAUDE.md with context

## Directory Structure Template

```
Applications/AppName/
├── server.js
├── routes/
│   └── index.js
├── controllers/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── CLAUDE.md
└── package.json
```

## Server.js Template

```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = [PORT_NUMBER];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const routes = require('./routes');
app.use('/', routes);

// Start server
app.listen(PORT, () => {
  console.log(`[APP_NAME] listening on http://localhost:${PORT}`);
});
```

## Project Standards

- Follow ES6+ syntax
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch
- Separate concerns into routes/, controllers/, services/
- Keep server.js minimal - delegate to modules
- Static files go in public/

## HQ Integration

After creating the app, update `HQ/server.js` to include the new application in the applications array with:
- name: Application display name
- port: Port number
- status: 'stopped' (initial state)
- description: Brief description

## Example

User: "Create a new app called NotificationService on port 3333"

Response:
1. Create Applications/NotificationService/ directory
2. Generate modular file structure
3. Create server.js on port 3333
4. Add to HQ registry
5. Create CLAUDE.md
6. Confirm app is ready to launch

## Post-Creation

Inform user:
- App created at: Applications/[AppName]
- Access at: http://localhost:[PORT]
- Start with: node Applications/[AppName]/server.js
- Or launch from HQ dashboard
