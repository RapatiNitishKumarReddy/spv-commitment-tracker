# SPV Commitment Tracker

A web app for importing investor commitments from a CSV file and tracking how
well each SPV (special purpose vehicle) is funded against its target.

- **Import** a commitments CSV. Every row is validated, normalized and either
  accepted, flagged for review or rejected with a clear reason.
- **SPV list** (`/`): each SPV's target, total committed and percentage of
  target, sorted by percentage funded (highest first).
- **SPV detail** (`/spvs/[slug]`): every investor's commitment for one SPV, plus
  the rows for that SPV that need review.
- **Warnings** for over-subscribed SPVs and for SPVs whose target is stated
  inconsistently in the CSV.

**Production:** https://spv-commitment-tracker.vercel.app

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Vitest for unit tests
- Deployed on Vercel (Hobby)

## Getting started

Requires Node.js 20.19 or later.

```bash
npm ci
cp .env.example .env.local   # optional, see "Environment variables"
npm run dev
```

Open <http://localhost:3000>, go to **Import**, and upload a CSV. A sample file
is included at [`public/sample-commitments.csv`](public/sample-commitments.csv)
and can be downloaded from the import page.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check (run `npx next typegen` first on a fresh clone) |

## Testing

Unit tests use Vitest and sit next to the code (`lib/**/*.test.ts`,
`app/**/*.test.ts`). They cover CSV parsing, amount and email normalization,
duplicate and conflict detection, SPV totals, sorting, detail-page lookup,
browser storage handling and an end-to-end import of the sample CSV.

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests, lint and the
type check on every pull request to `main`.

## CSV import

### Format

The header row must contain these columns (case and surrounding spaces are
ignored, column order does not matter, extra columns are ignored):

```text
spv_name,spv_target_usd,investor_name,investor_email,commitment
```

### Amounts

Amounts are in USD. `spv_target_usd` and `commitment` accept:

| Input | Value |
| --- | --- |
| `50000`, `50,000`, `$50,000` | 50,000 |
| `1,50,000`, `12,34,567`, `1,00,00,000` | 150,000 / 1,234,567 / 10,000,000 (Indian digit grouping) |
| `100k` | 100,000 (k = × 1,000) |
| `1.5L` | 150,000 (L = lakh, × 100,000) |

Both international (`1,250,000`) and Indian (`12,50,000`) digit grouping are
accepted, but each number must use one system consistently. In a CSV, amounts
containing commas must be quoted (`"1,50,000"`).

Negative values (`-10000`, `$-5,000`, `(5000)`), blank values, zero, malformed
or mixed grouping (`5,0,00`, `123,45,678`) and unknown suffixes (`10m`) are
rejected, never guessed.

### Row outcomes

Every row ends up in exactly one group, and nothing is dropped silently:

- **Accepted:** valid; counts toward the SPV's total.
- **Rejected:** invalid data (missing fields, invalid email, invalid,
  negative or zero amount, wrong number of columns). Every problem on the row is
  listed with its CSV line number.
- **Flagged for review:** valid data that needs a human decision (duplicates,
  below). Flagged rows do not count toward totals.

Problems with the file itself (empty file, missing or duplicated required
columns, broken quoting) stop the import with a clear message and do not
replace previously imported data.

### Duplicate handling

A duplicate is a row with the same **investor email** (trimmed, lowercased) and
the same **SPV name** (trimmed, lowercased, inner spaces collapsed) as an
earlier valid row.

The first valid row is accepted. Later rows are **flagged for review, not
merged**. A second row could be a top-up, a correction or a data-entry
mistake, and the file alone can't tell which. Adding them together
automatically could double-count a financial commitment, so the decision is
left to a person. In the sample file, `RIYA@example.com` on line 4 is flagged
as a duplicate of line 2.

### SPV target conflicts

If rows for the same SPV state different targets (e.g. Gamma Health SPV at
300,000 on one row and 350,000 on another), the conflict is flagged and **no
target is picked**. That SPV shows "Unresolved" with every stated target and its
line numbers. Its percentage funded is not calculated, and it is listed last on
the SPV list. Its valid commitments still count toward its total committed.

### Over-subscription

An SPV is over-subscribed when total committed is greater than its target
(exactly 100% is fully funded, not over-subscribed). This is shown as a warning
on the import results, the SPV list and the detail page. In the sample, Beta
Infra SPV has 350,000 committed against a 250,000 target (140%).

### Other assumptions

- A commitment must be a positive amount, so `0` is rejected.
- `spv_name` and `investor_name` are required.
- There is no file-size or row limit.

## Where data is stored

There is no database and no server-side storage. The import runs entirely in
the browser, and the most recent successful import is saved in the browser's
`localStorage` as the raw CSV text. The SPV pages re-validate it with the same
code on every load, so saved data always matches the current rules.

This means imported data is:

- kept across navigation and page refreshes in the same browser;
- separate for each browser, device and site address (production, each preview
  URL and localhost each have their own data);
- removed with **Clear imported data** or by clearing the browser's site data.

## Deployment

### How it is deployed

The GitHub repository is connected to a Vercel Hobby project, which detects
Next.js automatically. No `vercel.json` is needed.

- Every push to `main` deploys to **production**.
- Every pull request gets its own **preview deployment**, and Vercel posts the
  preview URL on the PR. The URL is added to the PR description, and the preview
  is checked (including importing the sample CSV) before merging.

### Environment variables

| Variable | Required | Values | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | No | `development`, `preview`, `production` | Shows a small banner on non-production deployments so reviewers know they are on a preview. Production shows no banner. A missing or unknown value shows no banner (an unknown value logs a warning). |

It is set in the Vercel dashboard (Settings → Environment Variables):
`production` for Production and `preview` for Preview. It is documented in
[`.env.example`](.env.example). Real values are never committed: `.env*` files
are gitignored, except `.env.example`.

`NEXT_PUBLIC_` variables are built into the JavaScript bundle at build time, so
**redeploy after changing the value** in the dashboard.

### What happens when Vercel starts a new instance

Nothing changes for the data. Vercel runs server code on short-lived instances
that can be replaced or scaled at any time, so anything held in server memory
would be lost. This app keeps no data in server memory: imports live in each
visitor's browser `localStorage`, so a new or restarted instance has no effect
on them. The trade-off is that data is not shared between browsers or devices.

### Deployment problem encountered

While preparing the deployment, `.env.example` turned out to be silently ignored
by git: the default `.gitignore` rule `.env*` also matched it, so it would never
have been committed even though the file existed locally. Running
`git check-ignore -v .env.example` confirmed it. The fix was adding
`!.env.example` to `.gitignore` so the example is tracked while real `.env`
files stay ignored.

If a deployment breaks, check:

1. **Build logs** in the Vercel dashboard. Run `npm run build` locally to reproduce.
2. **Letter case in file names.** Vercel builds on Linux, which is
   case-sensitive, unlike Windows and macOS.
3. **Environment variables** are set for the right environment (Production vs
   Preview), and the project was redeployed after changing them.
4. **Preview access:** Vercel Deployment Protection may ask reviewers to log in.
5. **Data looks missing:** imported data is per browser and per URL, so import
   the CSV again on the deployment being checked.

## Project structure

```text
app/
  page.tsx              SPV list (/)
  import/               CSV import page (/import)
  spvs/[slug]/          SPV detail page (/spvs/[slug])
  _components/          Shared UI components
  _lib/                 Client hooks (saved import)
lib/
  csv/                  CSV tokenizer
  commitments/          Validation, normalization, duplicates, conflicts,
                        SPV totals, sorting, slugs, browser storage
  appEnv.ts             NEXT_PUBLIC_APP_ENV parsing
public/
  sample-commitments.csv
```

## AI usage

How an AI coding agent was used on this project, including where it was wrong,
is recorded in [`AI_LOG.md`](AI_LOG.md).
