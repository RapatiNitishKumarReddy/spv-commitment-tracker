# AI Log

How I used an AI coding agent (Claude Code) on this project. Each entry has the prompt I gave, what the agent did, and what I accepted, changed or rejected, and why.

---

## Entry 1: Pick the next issue and plan it (Issue #2, CSV import and validation)

**Prompt (summarized):**

> Inspect the existing project and read CLAUDE.md, AGENTS.md, README.md, package.json and the current `app/` directory. Do not modify any files. Review the GitHub issues and identify the most appropriate next issue to implement. Provide a detailed implementation plan: requirements, files, UI approach, data model, validation and error handling, testing, dependencies, risks and questions. Do not implement anything yet.

**What the agent did:**
- Read the project files and listed the GitHub issues with `gh`.
- Chose Issue #2 because #3 (SPV pages) and #4 (CSV tests) both depend on its parsing and validation logic.
- Proposed a plan: pure parsing and validation functions in `lib/`, an `/import` page, and Vitest for tests.
- Raised several open questions, including that the sample CSV wasn't in the repo.

**What I accepted:**
- Choosing Issue #2.
- Keeping parsing and validation framework-independent in `lib/`.
- A small hand-written CSV parser instead of a new runtime dependency.
- Vitest for tests.

**⚠️ Where the AI was wrong or over-engineered, and how I noticed:**
- **It invented the CSV schema.** It couldn't find the sample file, so it assumed columns named `spv_target` and `commitment_amount`. I noticed by checking the plan against the assignment document. The real headers are `spv_name,spv_target_usd,investor_name,investor_email,commitment`. To its credit, it flagged the schema as an assumption and asked for the file.
- **Its recommended SPV conflict rule broke an explicit requirement.** It recommended "first-seen target wins" for an SPV listed with different targets. The assignment explicitly says to flag the Gamma Health conflict (300,000 vs 350,000) and not silently pick one.
- **It added requirements nobody asked for.** It proposed a 1 MB / 5,000-row file limit with no basis in the assignment.

**What I changed:**
- Required the exact headers and the exact sample CSV.
- Required conflicts to be flagged with no target picked.
- Removed the arbitrary limits, with the rule that any assumption the assignment doesn't specify must be documented.
- Defined a duplicate as the same normalized email plus normalized SPV name, flagged for review rather than merged.
- Required the Beta Infra over-subscription warning (140%) to be visible in the UI.
- Kept persistence out of Issue #2.

---

## Entry 2: Revise the plan, then implement Issue #2

**Prompt (summarized):**

> Revise the plan with these corrections: exact headers and sample CSV; amount rules for `$50,000`, `100k`, `1.5L`, negative and blank values; duplicates flagged, not merged; Gamma Health conflict flagged, not resolved; Beta Infra over-subscription visible; no arbitrary limits; no database; logic framework-independent; the listed test cases. Then (after approval): implement Issue #2 only, in small steps, running tests after each step. Do not commit.

**What the agent did:**
- Produced a revised plan, and before implementing, a table of the expected outcome for every sample row:
  - 6 accepted, 1 flagged, 3 rejected, 1 conflict
  - Beta Infra 140%, over-subscribed
  - Gamma Health target unresolved
- Implemented it in steps (parser → normalizers → import, conflicts and summaries → UI), running the tests after each step. The suite finished at 52 passing tests, including an end-to-end test against the real sample file.
- Also ran lint, the TypeScript check and the production build, and rendered the results page against the sample to confirm the conflict and over-subscription warnings appear.

**What I accepted:**
- The data model, and the accepted / flagged / rejected classification.
- The expected-results table, which the end-to-end test asserts exactly.
- Rejecting `0` commitments (documented assumption: a commitment must be a positive amount).

**⚠️ Where the AI was incomplete or over-reaching, and how I noticed:**
- **Conflict detection could have been hidden by unrelated row errors.** The first revised plan ran cross-row checks only on fully valid rows. If one Gamma row also had a blank commitment, the target conflict would have disappeared. I noticed while reviewing the validation flow against the "never silently pick a target" requirement. The final plan widened this, and I required it to be implemented as a separate validation concern: any row with a valid SPV name and target takes part. A dedicated test covers this case.
- **It reached outside the issue's scope.** It proposed rewriting the boilerplate home page and layout metadata as part of Issue #2. I rejected this to keep the issue focused; navigation belongs to a later issue.

**What came up during implementation:**
- **Vitest wouldn't install as planned.** Vitest 5 conflicted with the project's `@types/node` ^20, and Vitest 4 hit an npm resolver crash triggered by Vite 8's optional peer dependency on `@vitejs/devtools`.
- **The agent's workaround was reasonable.** It didn't force the install. It pinned Vitest 4 and added a scoped `overrides` entry so Vitest uses Vite 7. It also checked that no existing package versions changed in `package-lock.json`, and confirmed the 5 `npm audit` warnings were already there (from `eslint-config-next`).
- _Decision on the override vs. upgrading `@types/node`: to confirm during PR review._
