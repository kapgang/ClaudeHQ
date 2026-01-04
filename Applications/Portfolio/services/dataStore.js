const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_FILE = path.join(DATA_DIR, 'uploads.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
function initializeDataFiles() {
  if (!fs.existsSync(UPLOADS_FILE)) {
    saveJSON(UPLOADS_FILE, { uploads: [] });
  }
  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    saveJSON(TRANSACTIONS_FILE, { transactions: [] });
  }
}

// Generic JSON load/save helpers
function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ============ Uploads ============
function getUploads() {
  const data = loadJSON(UPLOADS_FILE);
  return data?.uploads || [];
}

function getUploadById(uploadId) {
  const uploads = getUploads();
  return uploads.find(u => u.id === uploadId);
}

function createUpload(upload) {
  const data = loadJSON(UPLOADS_FILE) || { uploads: [] };
  data.uploads.push(upload);
  saveJSON(UPLOADS_FILE, data);
  return upload;
}

function updateUpload(uploadId, updates) {
  const data = loadJSON(UPLOADS_FILE);
  const index = data.uploads.findIndex(u => u.id === uploadId);
  if (index !== -1) {
    data.uploads[index] = { ...data.uploads[index], ...updates };
    saveJSON(UPLOADS_FILE, data);
    return data.uploads[index];
  }
  return null;
}

function deleteUpload(uploadId) {
  const data = loadJSON(UPLOADS_FILE);
  const before = data.uploads.length;
  data.uploads = data.uploads.filter(u => u.id !== uploadId);
  saveJSON(UPLOADS_FILE, data);

  // Also delete associated transactions
  deleteTransactionsByUpload(uploadId);

  return before - data.uploads.length;
}

// ============ Transactions ============
function getTransactions(filters = {}) {
  const data = loadJSON(TRANSACTIONS_FILE);
  let transactions = data?.transactions || [];

  if (filters.uploadId) {
    transactions = transactions.filter(t => t.uploadId === filters.uploadId);
  }
  if (filters.month) {
    transactions = transactions.filter(t => t.date.startsWith(filters.month));
  }
  if (filters.category) {
    transactions = transactions.filter(t => t.category === filters.category);
  }
  if (filters.merchant) {
    transactions = transactions.filter(t =>
      t.merchant.toLowerCase().includes(filters.merchant.toLowerCase())
    );
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    transactions = transactions.filter(t =>
      t.description.toLowerCase().includes(searchLower) ||
      t.merchant.toLowerCase().includes(searchLower)
    );
  }

  return transactions;
}

function getTransactionById(id) {
  const data = loadJSON(TRANSACTIONS_FILE);
  return data.transactions.find(t => t.id === id);
}

function addTransactions(newTransactions) {
  const data = loadJSON(TRANSACTIONS_FILE) || { transactions: [] };

  // Check for duplicates
  const existingKeys = new Set(
    data.transactions.map(t => `${t.date}:${t.description}:${t.amount}`)
  );

  let added = 0;
  let duplicates = 0;

  for (const transaction of newTransactions) {
    const key = `${transaction.date}:${transaction.description}:${transaction.amount}`;
    if (!existingKeys.has(key)) {
      data.transactions.push(transaction);
      existingKeys.add(key);
      added++;
    } else {
      duplicates++;
    }
  }

  saveJSON(TRANSACTIONS_FILE, data);
  return { added, duplicates, total: data.transactions.length };
}

function updateTransaction(id, updates) {
  const data = loadJSON(TRANSACTIONS_FILE);
  const index = data.transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    data.transactions[index] = { ...data.transactions[index], ...updates };
    saveJSON(TRANSACTIONS_FILE, data);
    return data.transactions[index];
  }
  return null;
}

function deleteTransaction(id) {
  const data = loadJSON(TRANSACTIONS_FILE);
  const before = data.transactions.length;
  data.transactions = data.transactions.filter(t => t.id !== id);
  saveJSON(TRANSACTIONS_FILE, data);
  return before - data.transactions.length;
}

function deleteTransactionsByUpload(uploadId) {
  const data = loadJSON(TRANSACTIONS_FILE);
  const before = data.transactions.length;
  data.transactions = data.transactions.filter(t => t.uploadId !== uploadId);
  saveJSON(TRANSACTIONS_FILE, data);
  return before - data.transactions.length;
}

function deleteTransactionsByMerchant(merchant, uploadId = null) {
  const data = loadJSON(TRANSACTIONS_FILE);
  const before = data.transactions.length;

  data.transactions = data.transactions.filter(t => {
    const merchantMatch = t.merchant.toLowerCase() === merchant.toLowerCase();
    const uploadMatch = uploadId ? t.uploadId === uploadId : true;
    return !(merchantMatch && uploadMatch);
  });

  saveJSON(TRANSACTIONS_FILE, data);
  return before - data.transactions.length;
}

function clearAllTransactions() {
  saveJSON(TRANSACTIONS_FILE, { transactions: [] });
}

// ============ Categories ============
function getCategories() {
  const data = loadJSON(CATEGORIES_FILE);
  return data?.categories || [];
}

function saveCategories(categories) {
  saveJSON(CATEGORIES_FILE, { categories });
}

// ============ Analytics Helpers ============
function getTransactionStats(uploadId = null) {
  const transactions = getTransactions(uploadId ? { uploadId } : {});
  const expenses = transactions.filter(t => t.amount < 0);

  if (expenses.length === 0) {
    return {
      totalSpending: 0,
      transactionCount: 0,
      averageTransaction: 0,
      averageDailySpending: 0,
      dateRange: { start: null, end: null }
    };
  }

  const totalSpending = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
  const dayRange = Math.max(1, Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)));

  return {
    totalSpending: Math.round(totalSpending * 100) / 100,
    transactionCount: transactions.length,
    averageTransaction: Math.round((totalSpending / expenses.length) * 100) / 100,
    averageDailySpending: Math.round((totalSpending / dayRange) * 100) / 100,
    dateRange: {
      start: transactions.length > 0 ? dates[0].toISOString().split('T')[0] : null,
      end: transactions.length > 0 ? dates[dates.length - 1].toISOString().split('T')[0] : null
    }
  };
}

function getMerchantStats(uploadId = null) {
  const transactions = getTransactions(uploadId ? { uploadId } : {});
  const expenses = transactions.filter(t => t.amount < 0);

  const merchantTotals = {};
  expenses.forEach(t => {
    if (!merchantTotals[t.merchant]) {
      merchantTotals[t.merchant] = { total: 0, count: 0, isRecurring: false };
    }
    merchantTotals[t.merchant].total += Math.abs(t.amount);
    merchantTotals[t.merchant].count++;
    if (t.isRecurring) {
      merchantTotals[t.merchant].isRecurring = true;
    }
  });

  return Object.entries(merchantTotals)
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      isRecurring: data.isRecurring
    }))
    .sort((a, b) => b.total - a.total);
}

// Initialize on load
initializeDataFiles();

module.exports = {
  // Uploads
  getUploads,
  getUploadById,
  createUpload,
  updateUpload,
  deleteUpload,

  // Transactions
  getTransactions,
  getTransactionById,
  addTransactions,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsByUpload,
  deleteTransactionsByMerchant,
  clearAllTransactions,

  // Categories
  getCategories,
  saveCategories,

  // Analytics
  getTransactionStats,
  getMerchantStats,

  // Raw access
  loadJSON,
  saveJSON,
  DATA_DIR,
  UPLOADS_FILE,
  TRANSACTIONS_FILE,
  CATEGORIES_FILE
};
