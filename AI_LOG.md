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

---

## Entry 3: Plan the SPV list and detail pages (Issue #3)

**Prompt (summarized):**

> We're starting Issue #3. Look at the codebase now that #2 is merged: the `app/` structure, `lib/commitments/`, the import data structures, how imported data is held, and the tests. Don't change anything yet. Tell me what can be reused, where the data should come from, which routes and files you'd add, how totals, percentages and sorting work, how the detail page finds its SPV, how over-subscription and conflicts show up, what tests you'd write, and a step-by-step plan.

**What the agent did:**

It spotted the real problem straight away: the import results only lived in React state on `/import`, so no other page could see them. It suggested saving the raw CSV text in `localStorage` and having each page re-run the existing importer on it. Its reason was that keeping only the CSV means the stored data can't drift away from the validation rules. It also explained why server memory or a JSON file wouldn't work once deployed on Vercel. Other parts of the plan:

- Reuse `summarizeSpvs` as-is for the maths.
- Sort conflicted SPVs to the bottom, since they have no percentage.
- Use readable slugs like `/spvs/beta-infra-spv` for detail URLs, because the Next 16 docs didn't say whether `params` arrive URL-decoded.

**What I accepted:**

- `localStorage` with the raw CSV.
- Slugs for detail URLs.
- Conflicted SPVs sorted last.
- Moving the shared components into `app/_components/`.
- The test list (sorting, slugs, detail lookup, storage).

**What I changed or rejected, and why:**

- **The agent asked whether the list should go at `/` or `/spvs`.** I picked `/`, since the issue literally calls it the main page and the boilerplate home page had to go eventually.
- **It suggested a "Load sample data" button.** I said no. It isn't in the requirements and it was starting to pull the issue off track.
- **The plan had no UI direction beyond "Tailwind".** I added specific UI requirements: consistent buttons and alerts across all three pages, tables that don't break the page on mobile, and status that doesn't rely on colour alone.

---

## Entry 4: Implementation, and the bug I found while testing it

**Prompt (summarized):**

> Go ahead: list at `/`, detail at `/spvs/[slug]`, save successful imports to `localStorage` and show a "View SPVs" link. Accepted commitments in the main table, flagged and rejected rows in a separate "Needs review" section. Don't change how `/import` behaves apart from saving and the link.

**What the agent did:**

It built the two pages, the storage layer and the shared components in small steps, running tests after each one. It finished with 81 passing tests, lint and build clean. One thing I liked: to prove `/import` hadn't changed, it rendered the import results from `main` and from the new code and compared the HTML. They were byte-for-byte identical.

**⚠️ Where the AI got it wrong, and how I noticed:**

- **Results vanished when I came back to `/import`.** During manual testing I uploaded the sample, clicked "View SPVs", browsed a few detail pages, then went back to `/import`. The results were gone and I only had the empty upload form, even though the list and detail pages still had the data.
  - The agent had said in its report that it couldn't test in a browser, and this is exactly the kind of thing that slipped through.
  - It had treated `/import` as "show results only right after an upload", and never made the page read the saved import when it loads.
  - All its tests passed, because none of them covered leaving the page and coming back.
- **One of its own tests was wrong at first.** The fake storage helper created a brand-new empty storage on every call, so a "save then read" test failed. It caught this itself from the failing test output and fixed the test rather than the code, which was the right call.

**What I asked for:**

Restore the saved results when `/import` loads, show nothing if the saved data is missing or corrupt, make "Clear imported data" wipe the results straight away, keep everything else the same, and tidy up the import page so it looks more professional.

**How the fix went:**

It explained the root cause clearly. The form kept results in its own state, which gets thrown away on navigation, and nothing read the saved import on the way back in. For the fix, `/import` now reads the saved import the same way the list page does, and only keeps in-progress work (parsing, errors) in local state. It pulled the "what should this page show" logic into a small pure function so it could be unit-tested, and added 7 tests for it, including one that saves, reopens and then clears. The page now also says whether you're looking at a fresh import or your last saved one.

**What I accepted:** the fix and the import page redesign.

**Lesson for me:** passing tests didn't mean the feature worked. I need to click through the real flow myself before signing off, especially anything involving navigation.
