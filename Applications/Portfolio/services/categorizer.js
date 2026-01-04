// Auto-categorization service

function categorize(description, categories) {
  const upperDesc = description.toUpperCase();
  let bestMatch = { category: 'other', confidence: 0, matchedKeyword: null };

  for (const category of categories) {
    if (category.id === 'other') continue;

    for (const keyword of category.keywords || []) {
      if (upperDesc.includes(keyword.toUpperCase())) {
        // Higher confidence for longer keyword matches
        const confidence = Math.min(keyword.length / 10, 1.0);

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category: category.id,
            confidence: confidence,
            matchedKeyword: keyword
          };
        }
      }
    }
  }

  return bestMatch;
}

// Re-categorize all transactions in a batch
function recategorizeTransactions(transactions, categories) {
  return transactions.map(t => {
    const match = categorize(t.description, categories);
    return {
      ...t,
      category: match.category,
      categoryConfidence: match.confidence
    };
  });
}

module.exports = {
  categorize,
  recategorizeTransactions
};
