---
name: document-nuance
description: Document tricky data scenarios, nuances, and solutions for the team knowledge base. Use when encountering unusual data patterns, solving complex issues, or building institutional knowledge.
---

# Document Data Nuance

## Instructions

Create structured documentation of data nuances and solutions:

1. Ask what nuance or issue was encountered
2. Understand the context (client, data type, workflow)
3. Document the problem clearly
4. Capture the solution implemented
5. Add searchable tags and categories
6. Include lessons learned

## Nuance Documentation Template

```
# Nuance: [Short Descriptive Title]

**ID:** NUC-[YYYY]-[###]
**Date Documented:** [Date]
**Documented By:** [Your Name]
**Project:** [Project Name or "General"]

---

## 🎯 Summary
[One sentence description of the nuance]

## 📋 Context

**Data Type:** [W2 / HR / Time Tracking / Expense / Other]
**Client Industry:** [If relevant]
**Workflow Stage:** [Where this appeared - WF1, WF2, consolidation, etc]
**Engagement Type:** [R&D Credit Calc / Other]

## ⚠️ The Issue

**What We Encountered:**
[Detailed description of what was unusual or problematic]

**Why It Matters:**
[Impact on the calculation, deliverable, or timeline]

**Example Data:**
```
[Show sanitized example of the problem]
Employee ID | Department | Amount | Issue
12345       | R&D-NA     | 50000  | Department code changed mid-year
12345       | R&D-EU     | 60000  | Same employee, different code
```

**Initial Symptoms:**
- [How this nuance first appeared]
- [What made you notice it]

## 💡 Root Cause

[Explanation of why this nuance exists]

Examples:
- "Client merged two entities mid-year, causing duplicate employee records"
- "Time tracking system changed in Q3, project codes don't align"
- "Bonus payments coded separately from regular W2 amounts"

## ✅ Solution Implemented

### Approach
[High-level solution strategy]

### Alteryx Implementation
[Specific tools/steps used in the workflow]

Example:
```
1. Used Summarize tool to group by Employee ID
2. Formula tool to flag records with multiple department codes
3. Join to bring in effective dates from HR file
4. Applied proration based on time in each department
```

### Alternative Approaches Considered
- [Approach 1 - why not chosen]
- [Approach 2 - why not chosen]

### ET Guidance Received
[What the Engagement Team told you to do, if applicable]
- "ET confirmed to prorate W2 amounts based on months in each department"

## 📊 Impact Assessment

**Records Affected:** [number or percentage]
**Dollar Impact:** [if material]
**Time to Resolve:** [hours spent solving this]

## 🏷️ Tags

**Category:** [Schema Issue / Data Quality / Client Process / System Change / Business Logic]

**Keywords:** [searchable terms]
- [Keyword 1]
- [Keyword 2]
- [Keyword 3]

**Similar To:** [Link to related nuances if any]

## 📚 Lessons Learned

**Red Flags to Watch For:**
- [What to look for that signals this nuance might exist]
- [Early warning signs]

**Questions to Ask ET:**
- [Proactive questions that would have caught this earlier]
- [Clarifications needed for similar situations]

**Future Workflow Improvements:**
- [How to build detection into standard workflows]
- [Preventive QA checks]

## 🔄 Reusability

**Likelihood of Recurrence:** [High / Medium / Low]

**Applicable To:**
- [Project types or client profiles where this might appear again]

**Workflow Template Update:**
- [ ] Add to standard WF1 checks
- [ ] Add to standard WF2 checks
- [ ] Add to WF4 validation
- [ ] Document in team wiki
- [ ] Share in team meeting

## 📎 Related Resources

**Files:**
- [Path to example workflow]
- [Path to documentation]

**Team Discussions:**
- [Link to email thread or meeting notes]

**External References:**
- [IRS guidance, client documentation, etc]

---

## Example Entry for Reference

# Nuance: Multiple W2s per Employee Due to Mid-Year Acquisition

**Summary:** Employees have 2+ W2 records when client acquired another company mid-year, causing double-counting risk.

**Data Type:** W2
**Workflow Stage:** WF1 - W2 Standardization

**The Issue:**
Client acquired CompanyB in July. Employees who worked at both companies have:
- W2 from CompanyA (Jan-June): $50,000
- W2 from CompanyB (July-Dec): $60,000
- Total should be $110,000 but needs single employee record

**Solution:**
1. Summarize tool grouping by Employee ID and Name
2. Sum all W2 amounts per employee
3. Retain most recent company code
4. Flag multi-W2 employees in notes field

**Tags:** Schema Issue, Acquisitions, W2, Multi-Record

**Red Flags:**
- File has company codes from entities not in current structure
- Employee counts don't match HR file
- W2 totals seem unusually high
```

## Nuance Categories

### Schema Issues
- Unexpected columns or formats
- Missing expected fields
- Complex hierarchies
- Merged or split data

### Data Quality
- Nulls in critical fields
- Inconsistent values
- Outliers
- Duplicates

### Client Process
- Mid-year changes (acquisitions, divestitures, reorgs)
- System migrations
- Multi-system environments
- Manual adjustments

### Business Logic
- Unique qualifying rules
- Department-specific treatments
- Contractor vs employee distinctions
- Capitalization policies

## Example Triggers

- "Document this nuance"
- "Save this solution for the team"
- "Add to knowledge base"
- "Record this issue"

## Output

Provide:
1. Completed nuance documentation using template
2. Suggested tags and categorization
3. Recommendations for workflow improvements
4. Draft communication for team (if applicable)
