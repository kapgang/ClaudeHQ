---
name: analyze-pbc
description: Analyze client-provided PBC data before building workflows. Use when reviewing data files, planning data wrangling, or identifying data quality issues.
---

# PBC Data Analysis Helper

## Instructions

Guide thorough analysis of client-provided data:

1. Ask the user to describe the PBC file:
   - File type (Excel, CSV, PDF, database export)
   - Data category (W2, HR, Time Tracking, Expenses, other)
   - Number of records/rows
   - Visible columns/fields

2. Conduct systematic analysis:
   - Schema assessment
   - Data quality checks
   - Nuance identification
   - Validation rule recommendations
   - Questions for Engagement Team

## Schema Assessment

Ask about and evaluate:

### Column Structure
- How many columns are present?
- Are column headers clear and consistent?
- Any merged columns or complex headers?
- Presence of calculated fields?

### Data Types
- Text fields that should be numbers?
- Dates in unusual formats?
- Currency with special characters?
- Codes vs descriptions?

### Identifiers
- Employee ID format and consistency
- Account numbers format
- Department/company codes
- Any composite keys needed?

## Data Quality Checks

### Completeness
- Missing or null values in critical fields?
- Partial records?
- Summary rows mixed with detail?
- Header/footer rows to remove?

### Consistency
- Standardized naming (departments, roles, accounts)?
- Consistent date formats?
- Uniform currency formatting?
- Code consistency across records?

### Accuracy Red Flags
- Unusually large or small values?
- Dates outside expected range?
- Duplicate records?
- Totals that don't reconcile?

### Format Issues
- Multiple sheets in Excel workbook?
- Pivot table format instead of flat file?
- Grouped/subtotaled data?
- Text wrapped or truncated?

## Common PBC Nuances by Type

### W2 Data
- Multiple W2s per employee?
- Mid-year acquisitions or divestitures?
- Bonus or equity separately stated?
- State vs federal amounts?
- Employee vs contractor classification?

### HR Data
- Point-in-time vs historical snapshot?
- Terminated employees included?
- Multiple positions per employee?
- Organizational changes during year?
- Effective dates for changes?

### Time Tracking
- Multiple time systems?
- Project code changes mid-year?
- Billable vs non-billable distinction?
- Overhead/admin time handling?
- Leave time included?

### Expense/GL Data
- Chart of accounts stability?
- Natural vs department hierarchy?
- Inter-company transactions?
- Accruals vs cash?
- Consolidated vs entity-level?

## Validation Rules to Recommend

Based on data type, suggest:

1. **Range Checks**
   - W2 amounts within reasonable bounds
   - Hours between 0-8760 (annual max)
   - Dates within tax year

2. **Referential Integrity**
   - Employee IDs exist in master list
   - Department codes valid
   - Account numbers in chart of accounts

3. **Mathematical Reconciliation**
   - Sum of details matches totals
   - Hours align with FTE count
   - Account balances reconcile

4. **Business Logic**
   - Terminated employees have end dates
   - Qualifying roles flagged correctly
   - Expense categories align with R&D scope

## Questions for Engagement Team

Generate targeted questions like:

**Data Scope Questions:**
- "Does this file include all entities or just [specific entity]?"
- "Should we include terminated employees who worked part of the year?"
- "Are contractors included or separate?"

**Data Treatment Questions:**
- "How should we handle employees with multiple positions?"
- "Should inter-company charges be eliminated?"
- "What qualifying percentage applies to [specific department]?"

**Data Quality Questions:**
- "We found [X] records with missing Employee IDs - how should we handle?"
- "The totals don't reconcile by $[amount] - can you investigate?"
- "Some project codes appear mid-year - were there system changes?"

**Timing Questions:**
- "Is this data as of year-end or current?"
- "Should we use hire dates to prorate amounts?"
- "How are mid-year acquisitions handled?"

## Analysis Output Template

Provide structured analysis:

```
PBC DATA ANALYSIS: [File Name]

📊 OVERVIEW
- File Type: [Excel/CSV/etc]
- Data Category: [W2/HR/TT/Expense]
- Record Count: [number]
- Period Covered: [dates]

🔍 SCHEMA ASSESSMENT
- [Number] columns identified
- Key fields: [list]
- Identifiers: [Employee ID format, etc]
- Potential issues: [list]

⚠️ DATA QUALITY FINDINGS
Completeness: [findings]
Consistency: [findings]
Format Issues: [findings]

🎯 NUANCES IDENTIFIED
1. [Nuance description and impact]
2. [Nuance description and impact]
3. [...]

✅ RECOMMENDED VALIDATION RULES
1. [Rule and rationale]
2. [Rule and rationale]
3. [...]

❓ QUESTIONS FOR ENGAGEMENT TEAM
1. [Question]
2. [Question]
3. [...]

📝 NEXT STEPS
1. [Recommended action]
2. [Recommended action]
```

## Example Triggers

- "Analyze this PBC file"
- "Review client data"
- "Help me understand this dataset"
- "Data quality check"

## Output

Provide comprehensive analysis report with:
- Schema summary
- Quality findings
- Identified nuances
- Validation recommendations
- Specific ET questions
- Implementation guidance
