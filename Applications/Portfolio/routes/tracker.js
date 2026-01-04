const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dataStore = require('../services/dataStore');
const csvParser = require('../services/csvParser');

// Configure multer for file uploads
const UPLOADS_DIR = path.join(dataStore.DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ Uploads ============

// GET /api/tracker/uploads - Get all uploads
router.get('/uploads', (req, res) => {
  const uploads = dataStore.getUploads();
  res.json({ uploads });
});

// GET /api/tracker/uploads/:id - Get single upload
router.get('/uploads/:id', (req, res) => {
  const upload = dataStore.getUploadById(req.params.id);
  if (!upload) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  res.json(upload);
});

// POST /api/tracker/upload - Upload new CSV files
router.post('/upload', upload.array('files', 12), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const categories = dataStore.getCategories();
    const results = [];

    for (const file of req.files) {
      // Create upload record
      const uploadId = uuidv4();
      const content = fs.readFileSync(file.path, 'utf-8');
      const transactions = csvParser.parseCSV(content, uploadId, categories);

      // Calculate date range
      let dateRange = { start: null, end: null };
      if (transactions.length > 0) {
        const dates = transactions.map(t => t.date).sort();
        dateRange = { start: dates[0], end: dates[dates.length - 1] };
      }

      // Create upload metadata
      const uploadRecord = {
        id: uploadId,
        filename: file.originalname,
        cardName: req.body.cardName || extractCardName(file.originalname),
        uploadedAt: new Date().toISOString(),
        transactionCount: transactions.length,
        dateRange,
        totalSpending: Math.abs(
          transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0)
        )
      };

      dataStore.createUpload(uploadRecord);

      // Add transactions
      const result = dataStore.addTransactions(transactions);

      results.push({
        uploadId,
        filename: file.originalname,
        imported: result.added,
        duplicates: result.duplicates
      });

      // Clean up temp file
      fs.unlinkSync(file.path);
    }

    res.json({
      success: true,
      results,
      totalImported: results.reduce((sum, r) => sum + r.imported, 0)
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tracker/uploads/:id - Update upload (rename card)
router.put('/uploads/:id', (req, res) => {
  const { cardName } = req.body;
  const updated = dataStore.updateUpload(req.params.id, { cardName });

  if (!updated) {
    return res.status(404).json({ error: 'Upload not found' });
  }

  res.json({ success: true, upload: updated });
});

// DELETE /api/tracker/uploads/:id - Delete upload and its transactions
router.delete('/uploads/:id', (req, res) => {
  const deleted = dataStore.deleteUpload(req.params.id);
  res.json({ success: true, deleted });
});

// ============ Transactions ============

// GET /api/tracker/transactions - Get transactions with filters
router.get('/transactions', (req, res) => {
  const { uploadId, month, category, merchant, search } = req.query;

  const transactions = dataStore.getTransactions({
    uploadId,
    month,
    category,
    merchant,
    search
  });

  // Sort by date descending by default
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ transactions, total: transactions.length });
});

// GET /api/tracker/transactions/:id - Get single transaction
router.get('/transactions/:id', (req, res) => {
  const transaction = dataStore.getTransactionById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
});

// PUT /api/tracker/transactions/:id - Update transaction
router.put('/transactions/:id', (req, res) => {
  const updates = req.body;
  const updated = dataStore.updateTransaction(req.params.id, updates);

  if (!updated) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({ success: true, transaction: updated });
});

// PUT /api/tracker/transactions/:id/category - Update transaction category
router.put('/transactions/:id/category', (req, res) => {
  const { category } = req.body;
  const updated = dataStore.updateTransaction(req.params.id, {
    category,
    categoryConfidence: 1.0 // Manual override
  });

  if (!updated) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({ success: true, transaction: updated });
});

// DELETE /api/tracker/transactions/:id - Delete single transaction
router.delete('/transactions/:id', (req, res) => {
  const deleted = dataStore.deleteTransaction(req.params.id);
  res.json({ success: true, deleted });
});

// DELETE /api/tracker/transactions - Clear all or by upload
router.delete('/transactions', (req, res) => {
  const { uploadId } = req.query;

  if (uploadId) {
    const deleted = dataStore.deleteTransactionsByUpload(uploadId);
    res.json({ success: true, deleted });
  } else {
    dataStore.clearAllTransactions();
    res.json({ success: true });
  }
});

// DELETE /api/tracker/merchants/:merchant - Delete by merchant
router.delete('/merchants/:merchant', (req, res) => {
  const { uploadId } = req.query;
  const merchant = decodeURIComponent(req.params.merchant);

  const deleted = dataStore.deleteTransactionsByMerchant(merchant, uploadId);
  res.json({ success: true, deleted });
});

// GET /api/tracker/merchants - Get merchant list
router.get('/merchants', (req, res) => {
  const { uploadId } = req.query;
  const merchants = dataStore.getMerchantStats(uploadId);
  res.json({ merchants });
});

// ============ Categories ============

// GET /api/tracker/categories
router.get('/categories', (req, res) => {
  const categories = dataStore.getCategories();
  res.json({ categories });
});

// Helper function to extract card name from filename
function extractCardName(filename) {
  // Try to extract card name from common patterns
  const nameMatch = filename.match(/^([A-Za-z]+)/);
  if (nameMatch) {
    return nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
  }
  return 'Credit Card';
}

module.exports = router;
