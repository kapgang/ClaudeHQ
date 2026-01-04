const { exec } = require('child_process');

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        resolve({ inUse: false, pid: null });
        return;
      }
      const lines = stdout.trim().split('\n');
      const listeningLine = lines.find(line => line.includes('LISTENING'));
      if (listeningLine) {
        const parts = listeningLine.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        resolve({ inUse: true, pid: parseInt(pid) });
      } else {
        resolve({ inUse: false, pid: null });
      }
    });
  });
}

module.exports = {
  checkPort
};
