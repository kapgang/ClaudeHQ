# Role Context

## Job Title
Associate - Started in Q3 2024

## Company / Org Type
Big 4 accounting firm

## Team / Practice / Group
Specialized Tax Services (STS), Research & Development Credit Calculation, Data Team

## Who I Work With Most
I work on the Data Team which is a team of 15-20 people who service internal Engagement Teams. We treat Engagement teams as our clients - Teams come to us to help with Deliverable / Data summary preparations and data wrangling of PBC data.

## Primary Objective
My team works with Alteryx daily as our main tool for completing tasks. There are many different tasks we do with the data we receive using Alteryx. The main task that the team was built around was R&D Credit Calcs for companies that have large R&D Expenses. This task is generally taking the data that clients give us which is W2 Datasets, HR Datasets, Expense Datasets (General ledgers / Trial Balances), consolidating this data together and then applying Qualifying %'s to all expenses to ultimately present engagement teams with as close to possible client deliverables which they then take to the client.

But many teams come to us with different requests (Still related to R&D Credits) such as taking the client data and preparing outputs that help summarize data at different levels (Individual Employee level, Department level, Account level, etc).

My team has created standard processes / tools for completing many tasks, that we rely on a lot of the time but when we receive different types of requests like mentioned, we generally need to build the Alteryx workflow from scratch.

More rarely we will have specific tools requested to be built and I have built two using Power Automate / PowerApps.

---

## Core Responsibilities

### Top Recurring Tasks
- Build Alteryx Workflows (WFs)
- Roll forward WFs that were built in the past for CY data
- Build custom tools using Power Automate
- Communicate with team members (Internal Meetings)
- Draft Emails to send to Engagement Teams (ETs) we are servicing
- Meetings with ETs (External Meetings)

### Outputs I Produce

**Workflows:** Alteryx WFs based on how the data is and what it needs. Generally consolidating datasets with other datasets and standardizing it into a final output, but very common to run into nuances that:
1. Need to be found
2. Need to ask the engagement team (ET) how they want to handle them
3. Need to build the solution

**Tools Built:**
1. **WH347 Extraction Tool** - Azure Document Intelligence model trained on the WH347 to extract data from a PDF and enter it into a standard Excel format. Power App / Power Automate flow for frontend.
2. **Calendar Automation Tool** - Check timeslots over a specific date range for all intended attendees and find which timeslots are available / most available. Built with Power Automate Flow and Power App frontend.

**Emails:**
- Communicating updates of workflows and ideas
- Weekly Status Update emails every Thursday summarizing updates completed that week

---

## Standard Processes

### Standardized Alteryx Workflows
Pre-built Alteryx Workflows generally followed on large R&D Projects. WF1-3 are standard but custom built for each project. WF4 is standard with no per-project build.

**Workflow 1 - W2 Data:**
Takes PBC W2 Data and renames the fields/standardizes it to comply with standard wireframe formats. Displays every employee in one record along with their W2 amount and any other relevant data (Name, Employee ID, Company, Company Sector, etc.)

**Workflow 2 - HR Data:**
Takes PBC HR data and renames the fields/standardizes it to comply with standard wireframe formats.

**Workflow 3 - Time Tracking Data:**
Takes PBC TT Data and renames the fields/standardizes it to comply with standard wireframe formats. Sometimes grouped by projects showing hours spent per project.

**Workflow 4 - Consolidation:**
Consolidates outputs of WF1-3 + Q/NQ file and creates final outputs.

---

## Tools & Systems

### Primary Tools
| Tool | Usage |
|------|-------|
| Alteryx | 85% - Main workflow tool |
| Power Automate / Power Apps | 5% - Custom tools |
| Excel | Data analysis, workpapers |

### Data Sources (PBC - Provided by Client)
- W2 Data
- HR Data
- Time Tracking Data
- PDFs / unstructured data

---

## Constraints

### Technical Constraints
- No external APIs allowed (big company restrictions)
- Most likely no cloud tools
- Firm-approved tools only

### Compliance / Risk Constraints
- Client confidentiality rules apply
- Minimize data storage
- No AI usage restrictions

### Approval Constraints
- Can build tools independently (no partner approval needed)
- Tools can be client-facing

---

## Technical Skills

| Skill | Level (1-5) |
|-------|-------------|
| Python | 4 |
| Power Automate | 4 |
| Alteryx | 4 |
| Low-code Tools | 4 |
| Excel | 3 |
| APIs | 3 |
| Prompt Engineering | 3 |
| SQL | 2 |
| VBA | 1 |

### Enjoys Building
- Automations
- Dashboards
- Internal tools
- Client-facing tools
- AI copilots
- Documentation / templates

---

## Assistant Priorities

### Primary Use Cases (Ranked)
1. Generate ideas for internal tools
2. Identify automation opportunities
3. Improve workflows
4. Draft technical specs
5. Build MVP logic
6. Challenge existing processes

### Proactivity Level
- Very proactive, suggest any interesting ideas
- Suggest improvements when relevant
- Actively challenge inefficiencies
- Think like a consultant + product manager
