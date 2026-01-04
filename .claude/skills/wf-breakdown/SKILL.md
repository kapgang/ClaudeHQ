---
name: wf-breakdown
description: Plan custom Alteryx workflows for non-standard requests. Use when building custom workflows, breaking down complex requirements, or planning data transformations.
---

# Workflow Planning Assistant

## Instructions

Break down ET requests into actionable Alteryx workflow steps:

1. Ask for the ET request or requirements
2. Understand input data sources
3. Identify desired output format
4. Map transformations needed
5. Create step-by-step Alteryx tool sequence
6. Highlight potential challenges
7. Generate implementation checklist

## Requirements Gathering

### Input Analysis
- What data sources are involved?
- What format is the data in?
- How many files/tables?
- How large is the dataset?
- Any known data quality issues?

### Output Requirements
- What should the final deliverable look like?
- What level of detail? (employee, department, account, etc.)
- What calculations are needed?
- Any specific formatting requirements?
- Who is the audience? (client, partner, analysis)

### Business Logic
- What qualifying rules apply?
- Any filtering criteria?
- Aggregation requirements?
- Calculations or derived fields?
- Special treatments or exceptions?

## Workflow Breakdown Template

```
# Workflow Plan: [Project Name] - [Workflow Purpose]

## 📋 REQUIREMENT SUMMARY
[1-2 sentence description of what this workflow needs to accomplish]

## 📥 INPUTS

| Input | Source | Format | Key Fields | Row Count |
|-------|--------|--------|------------|-----------|
| W2 Data | PBC_W2.xlsx | Excel | EmpID, Name, Amount | ~5,000 |
| HR Data | PBC_HR.csv | CSV | EmpID, Dept, Title | ~5,200 |
| Q/NQ File | QNQ_Mapping.xlsx | Excel | Dept, Q_Pct | ~50 |

## 📤 OUTPUT

**Deliverable:** Employee-level qualified amounts
**Format:** Excel workbook
**Aggregation:** By Employee, Department, and Company
**Key Metrics:**
- Total W2 Amount
- Qualifying %
- Qualified Amount
- Department
- Role Category

## 🔧 ALTERYX WORKFLOW SEQUENCE

### Stage 1: Data Inputs and Cleaning

**Step 1.1 - Read W2 Data**
- Tool: Input Data
- File: PBC_W2.xlsx
- Purpose: Load employee W2 amounts

**Step 1.2 - Clean W2 Fields**
- Tool: Select
- Purpose: Rename to standard wireframe, remove unnecessary columns
- Output fields: Employee_ID, Employee_Name, W2_Amount, Company

**Step 1.3 - W2 Data Quality**
- Tool: Filter
- Purpose: Remove test employees, nulls
- Keep: Employee_ID is not null AND W2_Amount > 0

**Step 1.4 - Read HR Data**
- Tool: Input Data
- File: PBC_HR.csv
- Purpose: Load employee department and role info

**Step 1.5 - Clean HR Fields**
- Tool: Select
- Purpose: Standardize field names
- Output fields: Employee_ID, Department, Job_Title, Role_Category

### Stage 2: Data Integration

**Step 2.1 - Join W2 to HR**
- Tool: Join
- Join key: Employee_ID
- Join type: Left outer (keep all W2 records)
- Purpose: Append department and role to W2 data

**Step 2.2 - Flag Unmatched**
- Tool: Formula
- Purpose: Flag employees in W2 but not in HR for review
- Formula: IF ISNULL([Department]) THEN "No HR Match" ELSE "Matched" ENDIF

**Step 2.3 - Read Q/NQ Mapping**
- Tool: Input Data
- File: QNQ_Mapping.xlsx
- Purpose: Load qualifying percentages by department

**Step 2.4 - Join to Q/NQ**
- Tool: Join
- Join key: Department
- Join type: Left outer
- Purpose: Append qualifying % to each employee record

### Stage 3: Calculations

**Step 3.1 - Calculate Qualified Amount**
- Tool: Formula
- Purpose: Calculate employee's qualified W2
- Formula: [W2_Amount] * [Q_Pct] / 100
- New field: Qualified_Amount

**Step 3.2 - Calculate NQ Amount**
- Tool: Formula
- Purpose: Calculate non-qualified portion
- Formula: [W2_Amount] - [Qualified_Amount]
- New field: NonQualified_Amount

**Step 3.3 - Add Metadata**
- Tool: Formula
- Purpose: Add run date, version, flags
- New fields:
  - Run_Date: DateTimeNow()
  - Version: "1.0"
  - Needs_Review: IF [Q_Pct] = 0 OR ISNULL([Q_Pct]) THEN "Yes" ELSE "No" ENDIF

### Stage 4: Aggregations

**Step 4.1 - Employee Summary**
- Tool: Summarize
- Group by: Employee_ID, Employee_Name, Department, Company
- Sum: W2_Amount, Qualified_Amount, NonQualified_Amount
- Purpose: One record per employee (handles multi-record scenarios)

**Step 4.2 - Department Summary**
- Tool: Summarize
- Group by: Department, Company
- Sum: W2_Amount, Qualified_Amount, NonQualified_Amount
- Count: Distinct Employee_ID (as Employee_Count)
- Purpose: Summary by department for dashboard

**Step 4.3 - Company Summary**
- Tool: Summarize
- Group by: Company
- Sum: W2_Amount, Qualified_Amount, NonQualified_Amount
- Count: Distinct Employee_ID
- Purpose: Executive summary

### Stage 5: QA and Validation

**Step 5.1 - Total Reconciliation**
- Tool: Summarize
- Purpose: Calculate grand totals for validation
- Sum: W2_Amount, Qualified_Amount
- Output to: Validation tab

**Step 5.2 - Exception Report**
- Tool: Filter
- Purpose: Flag records needing review
- Keep: Needs_Review = "Yes" OR ISNULL([Department]) OR [Q_Pct] = 0
- Output to: Exceptions tab

**Step 5.3 - Duplicate Check**
- Tool: Summarize
- Group by: Employee_ID
- Count: * (as Record_Count)
- Filter: Record_Count > 1
- Purpose: Identify duplicate employees

### Stage 6: Output Generation

**Step 6.1 - Format for Output**
- Tool: Select
- Purpose: Arrange columns in logical order, set data types
- Order: Company, Department, Employee_ID, Employee_Name, W2_Amount, Q_Pct, Qualified_Amount, NonQualified_Amount

**Step 6.2 - Sort**
- Tool: Sort
- Purpose: Order by Company, then Department, then Employee_Name
- Makes output more readable

**Step 6.3 - Output Employee Detail**
- Tool: Output Data
- File: Output_Employee_Detail.xlsx | Sheet: Detail
- Purpose: Main deliverable

**Step 6.4 - Output Department Summary**
- Tool: Output Data
- File: Output_Employee_Detail.xlsx | Sheet: Dept_Summary
- Purpose: Department rollup

**Step 6.5 - Output Exceptions**
- Tool: Output Data
- File: Output_Employee_Detail.xlsx | Sheet: Exceptions
- Purpose: Records needing review

**Step 6.6 - Output Validation**
- Tool: Output Data
- File: Output_Employee_Detail.xlsx | Sheet: Validation
- Purpose: Total reconciliation check

## ⚠️ POTENTIAL CHALLENGES

### Data Quality Risks
1. **Multiple records per employee**
   - Cause: Job changes, multiple entities, system issues
   - Mitigation: Summarize by Employee_ID in Stage 4.1

2. **Unmatched employees**
   - Cause: HR file incomplete or timing difference
   - Mitigation: Flag in Step 2.2, output to exceptions

3. **Missing Q/NQ percentages**
   - Cause: New departments not in mapping file
   - Mitigation: Flag for ET review, assign 0% conservatively

### Technical Challenges
1. **File size**
   - If >1M records, may need to optimize (select fields earlier, reduce joins)

2. **Performance**
   - Summarize tools can be slow on large datasets
   - Consider adding filters earlier to reduce row count

3. **Excel output limits**
   - Excel max 1,048,576 rows - if exceeded, split or use CSV

### Business Logic Challenges
1. **Proration scenarios**
   - If employees changed departments mid-year, may need time-based logic
   - Would require effective dates from HR

2. **Bonus treatment**
   - If bonuses are separate, may need different Q% than base salary
   - Clarify with ET

## ✅ IMPLEMENTATION CHECKLIST

### Before Building
- [ ] Review all input files to confirm structure matches plan
- [ ] Confirm output requirements with ET
- [ ] Understand any client-specific nuances
- [ ] Verify Q/NQ mapping file is current

### During Build
- [ ] Build incrementally - test each stage before moving on
- [ ] Add comments to workflow explaining logic
- [ ] Use Browse tools liberally to validate data at each step
- [ ] Name all tools clearly (not "Formula 27")

### QA Testing
- [ ] Row count reconciliation (inputs vs outputs)
- [ ] Dollar amount reconciliation (totals match)
- [ ] Spot check calculations manually
- [ ] Review exception report - expected scenarios?
- [ ] Test with subset of data first, then full file

### Delivery Prep
- [ ] Clean up workflow (remove unused tools, organize layout)
- [ ] Add workflow annotations explaining purpose of each stage
- [ ] Create summary documentation
- [ ] Package input files, output files, and workflow together
- [ ] Test on colleague's machine to ensure portability

## 📊 QA VALIDATION RULES

**Must Pass Before Delivery:**
1. ✅ Sum of employee detail = Sum of department summary = Sum of company summary
2. ✅ Total W2 amount in output matches sum of input W2 file
3. ✅ Every employee has a department (or is flagged in exceptions)
4. ✅ Every department has a Q/NQ percentage (or is flagged)
5. ✅ Qualified + NonQualified = Total W2 for each employee
6. ✅ No duplicate Employee_IDs in employee detail (or documented why)
7. ✅ Exception count is reasonable and explained

## 🎯 SUCCESS METRICS

**Workflow Quality:**
- Clean, organized canvas layout
- Descriptive tool names and comments
- Runs without errors
- Processes in reasonable time (<5 min for typical dataset)

**Output Quality:**
- All required fields present and formatted correctly
- Totals reconcile
- Exception report is comprehensive
- Ready for ET review without additional formatting

## 📝 NEXT STEPS

1. Review plan with [lead/senior]
2. Confirm input files match expected structure
3. Clarify any questions with ET
4. Build workflow incrementally
5. Test thoroughly before delivery
```

## Complexity Assessment

### Simple Workflow (1-2 hours)
- Single input file
- Basic transformations (select, filter, formula)
- One output
- Minimal business logic

### Medium Workflow (3-6 hours)
- 2-3 input files with joins
- Some aggregations
- Multiple outputs
- Moderate business logic

### Complex Workflow (1-2 days)
- 4+ input files
- Complex joins and unions
- Extensive calculations
- Multiple aggregation levels
- Lots of exceptions/edge cases
- Requires ET clarification

## Example Triggers

- "Help me plan a workflow for..."
- "Break down this ET request"
- "How should I build this in Alteryx?"
- "Workflow planning for [requirement]"

## Output

Provide:
1. Complete workflow breakdown with Alteryx tool sequence
2. Step-by-step instructions for each transformation
3. QA checklist
4. Implementation timeline estimate
5. Potential challenges and mitigations
