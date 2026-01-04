const path = require('path');

const BASE_PATH = 'C:\\Users\\kapla\\OneDrive\\Desktop\\Claude HQ\\Applications';

const projects = [
  {
    id: 'chromebot',
    name: 'ChromeBot',
    description: 'Browser Session Manager',
    path: path.join(BASE_PATH, 'ChromeBot'),
    port: 5555,
    script: 'server.js',
    icon: 'chrome',
    color: '#a855f7'
  },
  {
    id: 'remoteconnect',
    name: 'RemoteConnect',
    description: 'Cellular Device Manager',
    path: path.join(BASE_PATH, 'RemoteConnect'),
    port: 7777,
    script: 'server.js',
    icon: 'phone',
    color: '#00d4ff'
  },
  {
    id: 'rammonitor',
    name: 'Ram Monitor',
    description: 'System Memory Monitor',
    path: path.join(BASE_PATH, 'Ram Monitor'),
    port: 9999,
    script: 'server.js',
    icon: 'memory',
    color: '#ff6b35'
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Personal Finance Manager',
    path: path.join(BASE_PATH, 'Portfolio'),
    port: 4444,
    script: 'server.js',
    icon: 'wallet',
    color: '#10b981'
  },
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'Work AI Assistant',
    path: path.join(BASE_PATH, 'Assistant'),
    port: 3333,
    script: 'server.js',
    icon: 'brain',
    color: '#00b4d8'
  },
  {
    id: 'newsmonitor',
    name: 'News Monitor',
    description: 'Polymarket Auto-Trader',
    path: path.join(BASE_PATH, 'NewsMonitor'),
    port: 2222,
    script: 'server.js',
    icon: 'newspaper',
    color: '#f59e0b'
  }
];

function getProjectById(id) {
  return projects.find(p => p.id === id);
}

module.exports = {
  projects,
  getProjectById,
  BASE_PATH
};
