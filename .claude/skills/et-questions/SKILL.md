---
name: et-questions
description: Draft professional questions to send to Engagement Teams. Use when you need ET clarification, have data issues, or need to communicate blockers professionally.
---

# Engagement Team Question Drafter

## Instructions

Transform rough notes into professional ET communications:

1. Ask what question or issue needs to be communicated
2. Understand the context and urgency
3. Gather relevant data examples
4. Format into professional email
5. Suggest alternative approaches if applicable
6. Include clear ask and timeline

## Question Types

### Data Clarification
- Schema interpretation
- Handling missing data
- Unexpected values
- Format inconsistencies

### Process Guidance
- Treatment decisions
- Qualifying percentage applications
- Edge case handling
- Approach confirmation

### Blockers
- Missing files or information
- Access issues
- System problems
- Timeline impacts

### Validation
- Reconciliation discrepancies
- Unexpected results
- QA findings
- Confirmation needed before proceeding

## Professional Email Template

```
Subject: [Project Name] - [Brief Issue Description]

Hi [ET Contact],

I'm working on [specific workflow/deliverable] for [Project Name] and need your guidance on [issue type].

📋 SITUATION
[Brief context about what you're working on and where you encountered the issue]

❓ QUESTION/ISSUE
[Clear, specific description of what you need help with]

📊 WHAT WE'RE SEEING
[Concrete examples with sanitized data if applicable]
Example:
- Expected: [what you thought you'd see]
- Actual: [what you're actually seeing]
- Sample data: [small example]

🤔 POTENTIAL APPROACHES
We've considered the following options:

Option A: [Description]
- Pros: [benefits]
- Cons: [drawbacks]

Option B: [Description]
- Pros: [benefits]
- Cons: [drawbacks]

Which approach would you prefer, or is there another way you'd like us to handle this?

⏰ TIMELINE IMPACT
[If applicable: how this affects deliverable timeline]
- This is blocking: [specific next step]
- If we don't hear back by [date], we'll proceed with [approach] to stay on schedule

Please let me know your preference or if you need any additional information.

Thanks,
[Your Name]
```

## Tone Guidelines

### Professional Language

**Instead of:** "The data is messed up"
**Use:** "We've identified some inconsistencies in the data that need clarification"

**Instead of:** "I don't know what to do with this"
**Use:** "We've encountered a scenario not covered in our initial discussion and need your guidance"

**Instead of:** "This file is wrong"
**Use:** "The file appears to have a format different from what we expected - can you help us confirm the structure?"

**Instead of:** "You didn't give us..."
**Use:** "To complete [task], we'll also need [item]. Is this available?"

### Solution-Oriented Framing

- Always suggest 2-3 potential approaches
- Show you've thought through the problem
- Make it easy for ET to make a quick decision
- Provide enough context but stay concise

### Urgency Without Panic

**Non-urgent:** "When you have a moment, could you clarify..."
**Moderate:** "To stay on track, we'll need guidance by end of week..."
**Urgent:** "This is blocking our next steps - could we discuss today or tomorrow?"

## Common ET Question Scenarios

### Scenario 1: Missing Data

```
Subject: [Project] - Missing Department Codes in HR File

Hi [Name],

We're building the HR workflow for [Project] and noticed that about 15% of employee records don't have department codes populated.

What we're seeing:
- Total employees: 1,247
- Missing dept codes: 187 employees
- These represent ~$8.5M in W2 amounts

Options we've considered:
A) Exclude these employees from qualifying calculations
B) Assign them to "Unallocated" and apply a conservative Q%
C) Flag for manual review and classification

Which approach aligns with your methodology for this engagement?

Timeline: We're aiming to have WF2 complete by Friday - if we could get direction by Wednesday that would be helpful.

Thanks,
[Name]
```

### Scenario 2: Reconciliation Discrepancy

```
Subject: [Project] - W2 Total Reconciliation Question

Hi [Name],

Quick question on the W2 data for [Project]. We're seeing a reconciliation difference and want to confirm the expected treatment.

What we're seeing:
- Sum of detail W2 amounts: $45,287,332
- Total per client's summary: $45,850,000
- Difference: $562,668 (1.24%)

Our hypothesis:
This could be due to:
1. Terminated employees not included in detail file
2. Equity compensation reported separately
3. Certain entities excluded from detail

Should we:
A) Proceed with the $45.3M detail file amount
B) Request additional data to close the gap
C) Use the $45.8M summary figure and note the limitation

Please advise on your preference.

Thanks,
[Name]
```

### Scenario 3: Approach Confirmation

```
Subject: [Project] - Confirm Multi-Entity Treatment

Hi [Name],

Before finalizing WF4 for [Project], wanted to confirm our approach for employees who worked at multiple entities.

Scenario:
We have 23 employees with time at both EntityA and EntityB during the year (due to the July acquisition). Each has:
- W2 from EntityA
- W2 from EntityB
- Time tracking records from both systems

Proposed approach:
1. Combine W2 amounts for total employee comp
2. Merge time tracking from both systems
3. Apply blended Q% based on primary assignment
4. Flag these employees in a separate tab for review

Does this align with your methodology, or would you prefer a different treatment?

Thanks,
[Name]
```

### Scenario 4: Timeline/Priority Check

```
Subject: [Project] - Prioritization Question for This Week

Hi [Name],

We're making good progress on [Project] and want to confirm priorities for this week.

Status:
✅ WF1 (W2): Complete
✅ WF2 (HR): Complete
🔄 WF3 (Time Tracking): In progress (80% done)
⏸️ WF4 (Consolidation): Waiting on Q/NQ file

We can either:
A) Finish WF3 and have all inputs ready for WF4 once Q/NQ arrives
B) Start WF4 with placeholder Q% to validate logic
C) Pivot to another project while waiting

What's your preference given the timeline?

Thanks,
[Name]
```

## Data Example Guidelines

### When to Include Examples

✅ Include examples when:
- Showing format inconsistencies
- Demonstrating unexpected values
- Illustrating edge cases
- Proving data quality issues

❌ Don't include examples when:
- Question is purely conceptual
- Data is highly sensitive (summarize instead)
- Issue is obvious without proof

### How to Sanitize Data

```
Original:
Employee ID: 123-45-6789
Name: John Smith
Salary: $125,000

Sanitized:
Employee ID: XXX-XX-6789 (last 4 for reference)
Name: [Employee A]
Salary: $125,000 (amount ranges are OK)

Or even more generic:
Employee ID: [ID 1]
Name: [Employee 1]
Salary: $12X,XXX
```

## Example Triggers

- "Draft question for ET"
- "How do I ask the engagement team about..."
- "Write professional email about [issue]"
- "Need to ask ET for clarification"

## Output

Provide:
1. Complete, professional email ready to send
2. Clear subject line
3. Alternative approaches suggested
4. Appropriate urgency framing
5. Sanitized data examples if applicable
