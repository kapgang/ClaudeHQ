---
name: tool-idea
description: Generate and document automation tool ideas for the R&D Data Team. Use when brainstorming tools, identifying automation opportunities, or documenting improvement ideas.
---

# Tool/Automation Idea Generator

## Instructions

Help generate well-structured tool ideas:

1. Ask about the pain point or repetitive process
2. Understand current manual steps
3. Consider firm compliance constraints
4. Suggest automation approaches
5. Estimate complexity and impact
6. Create structured idea document

## Discovery Questions

### Pain Point Understanding
- What task takes the most time?
- What do you do repeatedly?
- What causes the most errors?
- What requires manual data entry?
- What needs multiple approvals?

### Current Process
- Walk through current manual steps
- How often is this done? (daily, per project, weekly)
- How long does it take currently?
- Who else is involved?
- What tools are used now?

### Constraints
- Must work within firm network?
- Client data involved? (confidentiality)
- Needs partner/manager approval?
- Integration with existing systems?
- Approved tools only?

## Automation Approach Assessment

### Tool Selection Criteria

**Power Automate** - Best for:
- Office 365 integrations (Outlook, SharePoint, Excel)
- Approval workflows
- Email automation
- Document routing
- Scheduled tasks

**Power Apps** - Best for:
- Custom data entry forms
- Team collaboration interfaces
- Mobile access needs
- Simple CRUD operations
- Frontend for Power Automate flows

**Python** - Best for:
- Complex data transformations
- API integrations
- Advanced analytics
- File parsing (especially PDFs)
- Batch processing

**Azure Services** - Best for:
- AI/ML capabilities (Document Intelligence)
- Large-scale processing
- Cloud storage needs
- Secure data handling
- Enterprise integrations

**Alteryx Macros/Apps** - Best for:
- Reusable workflow components
- Team-wide standardization
- Complex data logic
- Integration with existing WFs

## Complexity Estimation

### Low Complexity (1-2 days)
- Simple Power Automate flows
- Basic data parsing
- Template generation
- Single-system automation

### Medium Complexity (3-5 days)
- Multi-step workflows
- Custom Power Apps
- API integration (single source)
- Moderate data transformation

### High Complexity (1-2 weeks)
- AI/ML model training
- Multi-system integration
- Complex business logic
- Custom UI development

## Impact Assessment

### Time Savings
- Hours saved per use
- Frequency of use
- Number of team members affected
- Annual hours saved calculation

### Quality Improvement
- Reduced error rate
- Consistency gains
- Better documentation
- Enhanced auditability

### Strategic Value
- Enables new capabilities?
- Improves client experience?
- Differentiates from competitors?
- Scalable to other engagements?

## Idea Document Template

```
# [Tool Name]

## Problem Statement
[Clear description of the pain point - 2-3 sentences]

## Current Process
1. [Manual step 1]
2. [Manual step 2]
3. [...]

**Current Time:** [X] hours per [frequency]
**Error Rate:** [percentage or description]

## Proposed Solution

### Approach
[Technology choice and high-level design - 1 paragraph]

### Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

### User Workflow
1. [Step 1]
2. [Step 2]
3. [...]

## Technical Details

**Technology Stack:**
- Primary: [Power Automate / Python / etc]
- Supporting: [Excel, SharePoint, etc]
- Integration: [APIs, databases, etc]

**Data Sources:**
- Input: [What data is needed]
- Output: [What the tool produces]
- Storage: [Where data is kept]

## Compliance Considerations
- ✅ Uses firm-approved tools
- ✅ Client data handling: [approach]
- ✅ Audit trail: [how tracked]
- ⚠️ Requires approval: [if applicable]

## Implementation Estimate

**Complexity:** [Low / Medium / High]
**Estimated Time:** [X days/weeks]
**Dependencies:** [What's needed before starting]

**Development Phases:**
1. [Phase 1 - e.g., MVP with core features]
2. [Phase 2 - e.g., UI polish and testing]
3. [Phase 3 - e.g., team rollout]

## Impact Analysis

**Time Savings:**
- Per use: [X] hours saved
- Frequency: [X] times per [period]
- Team members: [number]
- **Annual savings: [total hours]**

**Quality Improvements:**
- [Specific improvement 1]
- [Specific improvement 2]

**Strategic Value:**
- [Strategic benefit 1]
- [Strategic benefit 2]

## MVP Scope
[What should be included in a minimum viable version]

## Future Enhancements
[Nice-to-have features for later iterations]

## Next Steps
1. [Immediate action 1]
2. [Immediate action 2]
3. [Immediate action 3]
```

## Example Ideas (Reference)

### Example 1: PBC Schema Validator
**Problem:** Checking if client files have expected columns is manual
**Solution:** Power Automate flow that compares uploaded file headers to expected schema
**Complexity:** Low
**Impact:** 30 min saved per project × 50 projects = 25 hours/year

### Example 2: Status Email Composer
**Problem:** Weekly status emails take 20-30 minutes to write
**Solution:** Power App that collects bullet points and generates formatted email
**Complexity:** Low
**Impact:** 20 min saved weekly × 20 team members = 347 hours/year

### Example 3: Nuance Database
**Problem:** Team doesn't know if similar data issues were solved before
**Solution:** SharePoint list with searchable nuances, solutions, and tags
**Complexity:** Low (setup) / Ongoing (maintenance)
**Impact:** Faster problem-solving, knowledge retention

## Example Triggers

- "Generate a tool idea for [process]"
- "How can I automate [task]?"
- "Tool idea for my team"
- "Brainstorm automation"

## Output

Provide:
1. Complete idea document using template
2. Technology recommendation with rationale
3. Complexity and impact estimates
4. Next steps for prototyping
