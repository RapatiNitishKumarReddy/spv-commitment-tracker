# SPV Commitment Tracker

## Project Overview

SPV Commitment Tracker is a web application for tracking and managing SPV commitments.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- App Router
- Tailwind CSS

## Folder Layout

- `app/` - application pages, layouts, and routes
- `public/` - static assets
- `package.json` - project dependencies and scripts
- `README.md` - project documentation
- `AGENTS.md` - Next.js-generated development instructions
- `CLAUDE.md` - project-specific instructions for Claude Code

## Development Commands

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - start the production server
- `npm run lint` - run ESLint

## Testing

- No automated test framework is currently configured.
- Run `npm run lint` to check code quality.
- Run `npm run build` to verify the project builds successfully.
- When automated tests are added, update this section with the appropriate test command.
- Add tests for important business logic when a test framework is introduced.

## Development Rules

- Use TypeScript.
- Follow the existing Next.js App Router structure.
- Keep components small and reusable.
- Use meaningful variable, function, and component names.
- Validate user input and imported CSV data.
- Never silently accept invalid data.
- Handle loading, error, and empty states properly.
- Do not hardcode secrets or sensitive information.
- Avoid unnecessary dependencies.
- Do not modify unrelated files.
- Follow existing project conventions before introducing new patterns.
- Prefer simple and maintainable solutions.

## CSV Data

- Validate imported CSV data before using it.
- Handle missing or invalid values explicitly.
- Never silently accept malformed CSV data.
- Provide clear feedback when imported data is invalid.

## Git Workflow

- Use feature branches for development.
- Do not work directly on `main`.
- Keep commits small and meaningful.
- Use clear and descriptive commit messages.
- Open a pull request before merging changes into `main`.

## Claude Code Workflow

- Read this file before making changes.
- Read `AGENTS.md` and follow its instructions.
- Inspect the existing code before creating or modifying files.
- Before implementing a significant feature, first explain the proposed approach and plan.
- Do not start implementation until the plan has been reviewed.
- Keep changes focused on the requested feature.
- Do not introduce unnecessary dependencies.
- After implementation, report:
  - files changed
  - important implementation details
  - commands executed
  - validation results

## Next.js Instructions

Follow the instructions in `AGENTS.md` for the installed version of Next.js.

@AGENTS.md