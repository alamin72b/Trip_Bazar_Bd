# Git Workflow

This document defines the standard Git workflow for TripBazarBD.

The goal is to keep work isolated, reviewable, and easy to understand for both beginners and future contributors.

## 1. Branch Strategy

### Main Branches
- `main`: stable branch

TripBazarBD is still in an early backend-first phase, so a single stable main branch is enough for now. A separate `develop` branch can be added later if the team needs a longer integration cycle.

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
- Keep one branch focused on one task only.
- Write or update a Technical Spec before major feature work.
- Create an ADR when making an important architecture decision.
- Update related docs as part of the same task.
- Use Conventional Commits for every commit.
- Prefer small, reviewable commits over large mixed commits.

## 3. Recommended Task Flow

### For Documentation Or Small Setup Tasks
1. Start from the latest `main`.
2. Create a focused branch.
3. Make the change.
4. Review the diff.
5. Commit with a Conventional Commit message.
6. Push the branch to GitHub.
7. Open a pull request.

### For Major Feature Work
1. Start from the latest `main`.
2. Create a `feature/...` branch.
3. Write or update the Technical Spec.
4. Identify affected modules, request flow, and data flow.
5. Explain the plan before implementation.
6. Build the feature in small focused commits.
7. Update related docs.
8. Push the branch and open a pull request.

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
- Docs should be updated when the change affects workflow, architecture, API, or database design.
- Review the changed files before opening the PR.

## 6. Local Git Commands

### Create A New Branch
```bash
git checkout main
git pull origin main
git checkout -b docs/project-workflow
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

### Push Branch
```bash
git push -u origin docs/project-workflow
```

## 7. Why This Workflow Fits TripBazarBD
- It keeps each task isolated and easier to review.
- It supports backend-first planning with specs before implementation.
- It encourages documentation as part of normal development work.
- It remains simple enough for a beginner-friendly project without losing industry-standard discipline.
