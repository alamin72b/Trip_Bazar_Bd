# Git Workflow

This document defines the standard Git workflow for TripBazarBD.

The goal is to keep work isolated, reviewable, and easy to understand for both beginners and future contributors.

## 1. Branch Strategy

### Main Branches
- `main`: stable, release-ready branch
- `develop`: active integration branch for ongoing work

TripBazarBD uses a simple `main` + `develop` workflow. `develop` is where normal work is integrated. `main` is reserved for approved, stable milestones that are ready to represent the project publicly or be handed to a client.

### Working Branches
Create one branch per task.

Use these prefixes:
- `feature/<name>` for new features
- `fix/<name>` for bug fixes
- `docs/<name>` for documentation work
- `chore/<name>` for tooling or maintenance

Examples:
- `feature/auth-foundation`
- `feature/offers-module`
- `fix/review-validation`
- `docs/project-workflow`
- `chore/project-setup`

## 2. Standard Rules
- Never commit directly to `main`.
- Do not use `main` as the base branch for normal feature work.
- Start feature, fix, docs, and chore branches from `develop`.
- Merge normal task branches back into `develop`.
- Merge `develop` into `main` only when the integrated work is stable and intentionally promoted.
- Keep one branch focused on one task only.
- Write or update a Technical Spec before major feature work.
- Create an ADR when making an important architecture decision.
- Update related docs as part of the same task.
- Use Conventional Commits for every commit.
- Prefer small, reviewable commits over large mixed commits.

## 3. Recommended Task Flow

### For Documentation Or Small Setup Tasks
1. Start from the latest `develop`.
2. Create a focused branch.
3. Make the change.
4. Review the diff.
5. Commit with a Conventional Commit message.
6. Push the branch to GitHub.
7. Open a pull request into `develop`.

### For Major Feature Work
1. Start from the latest `develop`.
2. Create a `feature/...` branch.
3. Write or update the Technical Spec.
4. Identify affected modules, request flow, and data flow.
5. Explain the plan before implementation.
6. During planning, suggest any relevant Codex skills, built-in features, or workflow helpers that could speed up or improve the task.
7. Build the feature in small focused commits.
8. Update related docs.
9. Push the branch and open a pull request into `develop`.

### Planning Reminder
When discussing implementation plans, proactively call out useful Codex capabilities when they fit the task.

Examples:
- suggest a relevant skill when the task matches one
- suggest a GitHub or workflow helper when PR, review, or CI work is involved
- suggest built-in verification steps such as tests, builds, or documentation updates when they should be part of the plan

### For Release Promotion
1. Confirm `develop` is in a stable state.
2. Review the integrated changes.
3. Merge `develop` into `main`.
4. Tag or document the milestone if needed.

## 4. Conventional Commit Format

Use this format:

```text
type(scope): short summary
```

Common types:
- `feat`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`

Examples:
- `docs(workflow): add repository git workflow guide`
- `feat(auth): add JWT access token strategy`
- `fix(reviews): validate rating range`

## 5. Pull Request Expectations
- The branch should solve one clear problem.
- The title should match the main purpose of the work.
- The description should explain what changed and why.
- Normal task pull requests should target `develop`.
- Release promotion pull requests should merge `develop` into `main`.
- Docs should be updated when the change affects workflow, architecture, API, or database design.
- Review the changed files before opening the PR.

## 6. Local Git Commands

### Create A New Branch
```bash
git checkout develop
git pull origin develop
git checkout -b docs/project-workflow
```

### Create `develop` For The First Time
```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

### Review Changes
```bash
git status
git diff
```

### Commit Changes
```bash
git add AGENTS.md docs/00-templates/ADR_TEMPLATE.md docs/00-templates/TECH_SPEC_TEMPLATE.md docs/05-workflows/git-workflow.md
git commit -m "docs(workflow): standardize repository templates and git process"
```

### Write A Detailed Commit Message
Use the first line as the Conventional Commit summary.

Use additional `-m` blocks for a short body when the task is larger and you want the commit history to explain the main changes clearly.

Example:

```bash
git commit \
  -m "feat(auth): add email/password auth foundation" \
  -m "- add auth module with combined signup-or-login endpoint
- add refresh token rotation and current-user endpoint
- add shared users model and refresh token persistence
- add tests and supporting technical documentation"
```

Recommended body style:
- one bullet per major change area
- keep each bullet short and factual
- mention behavior or module changes, not tiny file-by-file details
- include docs or tests if they were part of the task

### Finish The Current Task Branch
Use this sequence when the implementation is done and tests pass:

```bash
git status
git add apps/backend docs
git commit \
  -m "feat(scope): short summary" \
  -m "- main change 1
- main change 2
- tests and docs updates"
git push -u origin <current-branch>
```

For the current branch, replace the placeholders with the real scope, summary, and branch name.

### Push Branch
```bash
git push -u origin docs/project-workflow
```

## 7. Why This Workflow Fits TripBazarBD
- It keeps each task isolated and easier to review.
- It gives a clear separation between active work and stable milestones.
- It supports backend-first planning with specs before implementation.
- It encourages documentation as part of normal development work.
- It remains simpler than full GitFlow while still matching a more disciplined industry-standard setup.
