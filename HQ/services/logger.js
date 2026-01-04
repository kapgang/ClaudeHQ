const MAX_LOGS = 200;
const consoleLogs = [];

function addLog(source, message, type = 'info') {
  const entry = {
    timestamp: new Date().toISOString(),
    source,
    message: message.toString().trim(),
    type
  };
  consoleLogs.unshift(entry);
  if (consoleLogs.length > MAX_LOGS) {
    consoleLogs.pop();
  }
  return entry;
}

function getLogs(limit = 50) {
  return consoleLogs.slice(0, limit);
}

function clearLogs() {
  consoleLogs.length = 0;
  addLog('HQ', 'Console cleared', 'system');
}

module.exports = {
  addLog,
  getLogs,
  clearLogs
};
