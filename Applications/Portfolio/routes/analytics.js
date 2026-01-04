const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

// GET /api/analytics/summary - Overall spending summary
router.get('/summary', (req, res) => {
  const { uploadId } = req.query;
  const transactions = dataStore.getTransactions(uploadId ? { uploadId } : {});
  const expenses = transactions.filter(t => t.amount < 0);

  if (transactions.length === 0) {
    return res.json({
      totalSpending: 0,
      transactionCount: 0,
      averageTransaction: 0,
      averageDailySpending: 0,
      topCategory: null,
      dateRange: { start: null, end: null }
    });
  }

  const totalSpending = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));

  // Category totals
  const categoryTotals = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
  });

  const categories = dataStore.getCategories();
  let topCategory = null;
  let maxAmount = 0;
  for (const [catId, amount] of Object.entries(categoryTotals)) {
    if (amount > maxAmount) {
      maxAmount = amount;
      const cat = categories.find(c => c.id === catId);
      topCategory = { id: catId, name: cat?.name || catId, amount };
    }
  }

  // Date range and daily average
  const dates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
  const dayRange = Math.max(1, Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)));

  res.json({
    totalSpending: Math.round(totalSpending * 100) / 100,
    transactionCount: transactions.length,
    averageTransaction: expenses.length > 0 ? Math.round((totalSpending / expenses.length) * 100) / 100 : 0,
    averageDailySpending: Math.round((totalSpending / dayRange) * 100) / 100,
    topCategory,
    dateRange: {
      start: dates[0]?.toISOString().split('T')[0] || null,
      end: dates[dates.length - 1]?.toISOString().split('T')[0] || null
    }
  });
});

// GET /api/analytics/monthly - Monthly spending trends
router.get('/monthly', (req, res) => {
  const { uploadId } = req.query;
  const transactions = dataStore.getTransactions(uploadId ? { uploadId } : {});
  const expenses = transactions.filter(t => t.amount < 0);

  const monthlyTotals = {};

  expenses.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = { total: 0, count: 0 };
    }
    monthlyTotals[month].total += Math.abs(t.amount);
    monthlyTotals[month].count++;
  });

  const months = Object.entries(monthlyTotals)
    .map(([month, data]) => ({
      month,
      total: Math.round(data.total * 100) / 100,
      transactionCount: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json({ months });
});

// GET /api/analytics/categories - Spending by category
router.get('/categories', (req, res) => {
  const { uploadId } = req.query;
  const transactions = dataStore.getTransactions(uploadId ? { uploadId } : {});
  const expenses = transactions.filter(t => t.amount < 0);

  const categoryTotals = {};

  expenses.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = { total: 0, count: 0 };
    }
    categoryTotals[t.category].total += Math.abs(t.amount);
    categoryTotals[t.category].count++;
  });

  const categoriesList = dataStore.getCategories();
  const totalSpending = Object.values(categoryTotals).reduce((sum, c) => sum + c.total, 0);

  const categories = Object.entries(categoryTotals)
    .map(([catId, data]) => {
      const cat = categoriesList.find(c => c.id === catId);
      return {
        id: catId,
        name: cat?.name || catId,
        color: cat?.color || '#64748b',
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        percentage: totalSpending > 0 ? Math.round((data.total / totalSpending) * 1000) / 10 : 0
      };
    })
    .sort((a, b) => b.total - a.total);

  res.json({ categories, totalSpending: Math.round(totalSpending * 100) / 100 });
});

// GET /api/analytics/merchants - Top merchants and recurring charges
router.get('/merchants', (req, res) => {
  const { uploadId } = req.query;
  const transactions = dataStore.getTransactions(uploadId ? { uploadId } : {});
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

  const topMerchants = Object.entries(merchantTotals)
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      isRecurring: data.isRecurring
    }))
    .sort((a, b) => b.total - a.total);

  // Recurring charges
  const recurring = transactions.filter(t => t.isRecurring && t.amount < 0);
  const recurringMerchants = {};

  recurring.forEach(t => {
    const key = `${t.merchant}:${Math.abs(t.amount).toFixed(2)}`;
    if (!recurringMerchants[key]) {
      recurringMerchants[key] = {
        merchant: t.merchant,
        amount: Math.abs(t.amount),
        occurrences: 0
      };
    }
    recurringMerchants[key].occurrences++;
  });

  const recurringCharges = Object.values(recurringMerchants)
    .filter(r => r.occurrences >= 3)
    .sort((a, b) => b.amount - a.amount);

  res.json({ topMerchants, recurringCharges });
});

module.exports = router;
