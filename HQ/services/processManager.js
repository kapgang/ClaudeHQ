const { spawn, exec } = require('child_process');
const fs = require('fs');
const { addLog } = require('./logger');
const { checkPort } = require('./portChecker');

const runningServers = new Map();

async function startServer(project) {
  const portStatus = await checkPort(project.port);
  if (portStatus.inUse) {
    return { success: false, error: 'Server is already running' };
  }

  if (!fs.existsSync(project.path)) {
    addLog(project.name, `Directory not found: ${project.path}`, 'error');
    return { success: false, error: 'Project directory not found' };
  }

  addLog(project.name, 'Starting server...', 'info');

  const serverProcess = spawn('node', [project.script], {
    cwd: project.path,
    shell: true,
    detached: false
  });

  runningServers.set(project.id, serverProcess);

  serverProcess.stdout.on('data', (data) => {
    addLog(project.name, data, 'stdout');
  });

  serverProcess.stderr.on('data', (data) => {
    addLog(project.name, data, 'stderr');
  });

  serverProcess.on('close', (code) => {
    addLog(project.name, `Process exited with code ${code}`, code === 0 ? 'info' : 'error');
    runningServers.delete(project.id);
  });

  return new Promise((resolve) => {
    setTimeout(async () => {
      const status = await checkPort(project.port);
      if (status.inUse) {
        addLog(project.name, `Server started on port ${project.port}`, 'success');
        resolve({
          success: true,
          message: `${project.name} started successfully`,
          pid: status.pid
        });
      } else {
        addLog(project.name, 'Failed to start server', 'error');
        resolve({
          success: false,
          error: 'Server failed to start',
          message: 'Check console logs for details'
        });
      }
    }, 2000);
  });
}

async function stopServer(project) {
  const portStatus = await checkPort(project.port);
  if (!portStatus.inUse) {
    return { success: false, error: 'Server is not running' };
  }

  addLog(project.name, 'Stopping server...', 'info');

  return new Promise((resolve) => {
    exec(`taskkill /PID ${portStatus.pid} /F`, (error) => {
      if (error) {
        addLog(project.name, `Failed to stop: ${error.message}`, 'error');
        resolve({ success: false, error: 'Failed to stop server' });
        return;
      }

      if (runningServers.has(project.id)) {
        runningServers.delete(project.id);
      }

      addLog(project.name, 'Server stopped', 'success');
      resolve({
        success: true,
        message: `${project.name} stopped successfully`
      });
    });
  });
}

function getRunningServers() {
  return runningServers;
}

module.exports = {
  startServer,
  stopServer,
  getRunningServers
};
