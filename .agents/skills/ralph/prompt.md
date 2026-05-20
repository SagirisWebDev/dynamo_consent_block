# ISSUES

Local issue files from `issues/` are provided at start of context. Parse them to understand the open issues.

You will work on the AFK issues only, not the HITL ones.

You've also been passed a file containing the last few commits. Review these to understand what work has been done.

If all AFK tasks are complete, output <promise>NO MORE TASKS</promise>.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure

Getting development infrastructure like tests and types and dev scripts ready is an important precursor to building features.

3. Tracer bullets for new features

Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

4. Polish and quick wins
5. Refactors

# EXPLORATION

Explore the repo.

# IMPLEMENTATION

**You (the main agent) write all implementation code.**
Do NOT spawn a general-purpose agent to run this workflow.
Only spawn a subagent for testing — it must be the QA specialist
(load `.agents/roles/qa-specialist.md`), never a general-purpose agent.

Follow this exact TDD cycle — do not skip or reorder steps:

**Step 1 — QA writes tests (red phase)**
Spawn the QA specialist. Pass it the issue number, acceptance criteria, and working directory. The QA specialist reads the acceptance criteria and writes all unit/integration tests BEFORE any implementation exists. It then runs the tests and confirms they fail. It reports back the test file it wrote and the failure output.

**Step 2 — You implement**
Read the test file the QA specialist wrote. Write the implementation code to satisfy the tests. Do not run the tests yourself.

**Step 3 — QA validates (green phase)**
Spawn the QA specialist again. Pass it the issue number, acceptance criteria, and the fact that implementation is now complete. The QA specialist runs the tests. If any fail, it returns the exact failure output to you.

**Step 4 — Fix and repeat if needed**
If QA reports failures, fix only what is broken and send your fixes back to QA (continue the same agent via SendMessage if possible). Repeat until QA reports all tests passing.

**Step 5 — QA issues final sign-off**
QA runs the full test suite to check for regressions and produces a QA report with status QA APPROVED or QA BLOCKED.

# FEEDBACK LOOPS

After QA APPROVED, run the feedback loops yourself to confirm:

- `npm run test` to run the tests
- `npm run typecheck` to run the type checker

# MANUAL UI TESTING

If the issue had Playwright tests written for it, the automated tests do not substitute for real human testing. After the feedback loops pass:

1. Open the frontend page that contains the UI elements created in this issue. Use the browser tools available to you (Firefox DevTools MCP or Playwright MCP) to navigate to the relevant page on the local WordPress site.
2. Stop and present the user with explicit step-by-step manual testing instructions tailored to the acceptance criteria — what to click, what to look for, what edge cases to try.
3. Wait for the user to confirm the UI behaves correctly before proceeding to COMMIT.

Do not skip this step for any issue that produced Playwright tests.

# COMMIT

Make a git commit. The commit message must:

1. Include key decisions made
2. Include files changed
3. Blockers or notes for next iteration

# THE ISSUE

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
