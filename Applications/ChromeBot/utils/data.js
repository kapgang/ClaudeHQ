const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROFILES_DIR = path.join(__dirname, '..', 'profiles');

const FILES = {
  accounts: path.join(DATA_DIR, 'accounts.json'),
  proxies: path.join(DATA_DIR, 'proxies.json'),
  fingerprints: path.join(DATA_DIR, 'fingerprints.json'),
  sessions: path.join(DATA_DIR, 'sessions.json')
};

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Convenience methods
const db = {
  accounts: {
    getAll: () => readJSON(FILES.accounts),
    save: (data) => writeJSON(FILES.accounts, data)
  },
  proxies: {
    getAll: () => readJSON(FILES.proxies),
    save: (data) => writeJSON(FILES.proxies, data)
  },
  fingerprints: {
    getAll: () => readJSON(FILES.fingerprints),
    save: (data) => writeJSON(FILES.fingerprints, data)
  },
  sessions: {
    getAll: () => readJSON(FILES.sessions),
    save: (data) => writeJSON(FILES.sessions, data)
  }
};

module.exports = {
  DATA_DIR,
  PROFILES_DIR,
  FILES,
  readJSON,
  writeJSON,
  db
};
