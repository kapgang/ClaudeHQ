---
name: alteryx-template
description: Generate Alteryx workflow templates and logic patterns for R&D credit calculations. Use when building workflows, standardizing data, or planning Alteryx solutions.
---

# Alteryx Workflow Template Generator

## Instructions

Provide structured guidance for building Alteryx workflows:

1. Ask which data type is being processed:
   - W2 Data
   - HR Data
   - Time Tracking Data
   - Expense Data (GL/Trial Balance)
   - Custom/Combined

2. Based on data type, provide:
   - Standard field mapping template
   - Required transformation steps
   - Common nuances to watch for
   - QA validation checks
   - Output format requirements

## W2 Workflow Template

### Standard Fields to Extract
- Employee Name
- Employee ID
- W2 Amount
- Company/Entity
- Tax Year
- Any additional identifiers

### Common Transformations
1. **Input**: Read W2 PBC file
2. **Select**: Rename fields to standard wireframe format
3. **Filter**: Remove invalid/test records
4. **Formula**: Calculate derived fields if needed
5. **Summarize**: Group by employee (if multiple records per person)
6. **Output**: Export to standard W2 format

### Common Nuances
- Multiple W2s per employee (job changes, multiple entities)
- Inconsistent Employee ID formats
- Missing or null company codes
- Year-end vs mid-year data
- Contractor vs employee classification

### QA Checks
- Total W2 amount matches sum of detail
- No duplicate Employee IDs (or document why)
- All required fields populated
- Record count matches source

## HR Workflow Template

### Standard Fields to Extract
- Employee Name
- Employee ID
- Department
- Job Title/Role
- Manager
- Hire Date
- Termination Date (if applicable)
- FTE/PT status

### Common Transformations
1. **Input**: Read HR PBC file
2. **Select**: Standardize field names
3. **Formula**: Derive qualifying flags based on role/department
4. **Join**: Connect to employee master list if available
5. **Filter**: Remove terminated employees (or flag separately)
6. **Output**: Export to standard HR format

### Common Nuances
- Organizational changes mid-year
- Department name variations
- Role title inconsistencies
- Multiple positions per employee
- Effective dates for changes

## Time Tracking Workflow Template

### Standard Fields to Extract
- Employee ID
- Project/Task Code
- Hours
- Date/Period
- Department
- Activity Description

### Common Transformations
1. **Input**: Read time tracking data
2. **Select**: Standardize field names
3. **Summarize**: Aggregate hours by employee/project
4. **Join**: Connect to project codes or Q/NQ classification
5. **Formula**: Calculate total qualifying hours
6. **Output**: Export to standard TT format

### Common Nuances
- Multiple time tracking systems
- Project code changes
- Missing or incomplete entries
- Billable vs non-billable distinction
- Overhead vs project time

## Expense Workflow Template

### Standard Fields to Extract
- Account Number
- Account Description
- Amount
- Department/Cost Center
- Vendor
- Date/Period
- GL Category

### Common Transformations
1. **Input**: Read GL or Trial Balance
2. **Filter**: Extract R&D-relevant accounts
3. **Select**: Standardize field names
4. **Join**: Apply Q/NQ percentages
5. **Formula**: Calculate qualified amounts
6. **Summarize**: Aggregate by category/department
7. **Output**: Export to expense format

### Common Nuances
- Account mapping between years
- Consolidated vs detailed GL
- Inter-company eliminations
- Overhead allocation methods
- Capitalized vs expensed items

## General Workflow Best Practices

1. **Start with Schema Review**
   - Open PBC file and review structure
   - Identify all available fields
   - Note any unusual formats

2. **Build Incrementally**
   - Start with Input and Select tools
   - Add transformations one at a time
   - Run and validate at each step

3. **Document Assumptions**
   - Add comments to workflow
   - Note any client-specific rules
   - Document nuances discovered

4. **Standard Output Format**
   - Use wireframe field names
   - Include metadata (source file, run date)
   - Add row count and total checks

## Example Triggers

- "Help me build a W2 workflow"
- "Alteryx template for HR data"
- "What transformations do I need for time tracking?"
- "Set up expense workflow"

## Output

Provide:
1. Step-by-step Alteryx tool sequence
2. Field mapping template
3. List of nuances to watch for
4. QA checklist
