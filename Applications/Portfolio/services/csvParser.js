const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const categorizer = require('./categorizer');

// CSV format configurations
const CSV_FORMATS = {
  chase: {
    dateCol: 'Transaction Date',
    descCol: 'Description',
    amountCol: 'Amount'
  },
  capitalone: {
    dateCol: 'Transaction Date',
    descCol: 'Description',
    amountCol: 'Debit',
    creditCol: 'Credit'
  },
  amex: {
    dateCol: 'Date',
    descCol: 'Description',
    amountCol: 'Amount'
  },
  discover: {
    dateCol: 'Trans. Date',
    descCol: 'Description',
    amountCol: 'Amount'
  }
};

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr) return null;

  dateStr = dateStr.trim();

  // Try MM/DD/YYYY or MM/DD/YY
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    let year = match[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    return `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD
  match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return dateStr;
  }

  // Try to parse with Date object as fallback
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

// Normalize merchant name
function normalizeMerchant(description) {
  let merchant = description.toUpperCase()
    .replace(/\s+#\d+.*$/, '')
    .replace(/\s+\d{4,}.*$/, '')
    .replace(/\s+\*+.*$/, '')
    .replace(/\s+(CA|TX|NY|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|UT|IA|NV|AR|MS|KS|NM|NE|WV|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY|DC)$/, '')
    .replace(/\s+USA?\s*$/, '')
    .trim();

  // Capitalize first letter of each word
  return merchant.split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Detect CSV format from headers
function detectFormat(headers) {
  const headerLower = headers.map(h => h.toLowerCase());

  if (headerLower.includes('transaction date') && headerLower.includes('debit')) {
    return 'capitalone';
  }
  if (headerLower.includes('transaction date') && headerLower.includes('description')) {
    return 'chase';
  }
  if (headerLower.includes('trans. date')) {
    return 'discover';
  }
  if (headerLower.includes('date') && headerLower.includes('description') && headerLower.includes('amount')) {
    return 'amex';
  }

  return 'generic';
}

// Parse CSV content
function parseCSV(content, uploadId, categories) {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  if (records.length === 0) {
    return [];
  }

  const headers = Object.keys(records[0]);
  const format = detectFormat(headers);
  const config = CSV_FORMATS[format];

  let dateCol, descCol, amountCol, creditCol;

  if (config) {
    dateCol = headers.find(h => h.toLowerCase() === config.dateCol.toLowerCase());
    descCol = headers.find(h => h.toLowerCase() === config.descCol.toLowerCase());
    amountCol = headers.find(h => h.toLowerCase() === config.amountCol.toLowerCase());
    if (config.creditCol) {
      creditCol = headers.find(h => h.toLowerCase() === config.creditCol.toLowerCase());
    }
  } else {
    // Generic fallback
    dateCol = headers.find(h => /date/i.test(h)) || headers[0];
    descCol = headers.find(h => /desc|merchant|name|memo/i.test(h)) || headers[1];
    amountCol = headers.find(h => /amount|debit|charge/i.test(h)) || headers[2];
  }

  const transactions = [];

  for (const record of records) {
    const dateStr = record[dateCol];
    const description = record[descCol];
    let amount = parseFloat((record[amountCol] || '0').replace(/[$,]/g, ''));

    // Handle Credit column for Capital One style
    if (creditCol && record[creditCol]) {
      const credit = parseFloat(record[creditCol].replace(/[$,]/g, ''));
      if (!isNaN(credit) && credit > 0) {
        amount = credit;
      }
    }

    // Skip invalid records
    if (!dateStr || !description || isNaN(amount)) continue;

    const date = parseDate(dateStr);
    if (!date) continue;

    // Make expenses negative if they're positive
    if (amount > 0 && !creditCol) {
      amount = -amount;
    }

    const merchant = normalizeMerchant(description);
    const categoryMatch = categorizer.categorize(description, categories);

    transactions.push({
      id: uuidv4(),
      uploadId,
      date,
      description: description.trim(),
      amount,
      category: categoryMatch.category,
      categoryConfidence: categoryMatch.confidence,
      merchant,
      isRecurring: false,
      importedAt: new Date().toISOString()
    });
  }

  // Detect recurring transactions
  return detectRecurring(transactions);
}

// Detect recurring transactions
function detectRecurring(transactions) {
  const merchantAmounts = {};

  transactions.forEach(t => {
    const key = `${t.merchant}:${Math.abs(t.amount).toFixed(2)}`;
    if (!merchantAmounts[key]) {
      merchantAmounts[key] = { count: 0, months: new Set() };
    }
    merchantAmounts[key].count++;
    merchantAmounts[key].months.add(t.date.substring(0, 7));
  });

  transactions.forEach(t => {
    const key = `${t.merchant}:${Math.abs(t.amount).toFixed(2)}`;
    t.isRecurring = merchantAmounts[key].months.size >= 3;
  });

  return transactions;
}

module.exports = {
  parseCSV,
  parseDate,
  normalizeMerchant,
  detectFormat,
  detectRecurring
};
