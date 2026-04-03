---
name: merge-into-develop
description: Project-local TripBazarBD merge workflow for integrating the current task branch into develop. Use when the user wants Codex to merge a feature, fix, docs, or chore branch into develop while following this repository's Git rules and safety checks.
---

# Merge Into `develop`

This is a project-local skill definition for TripBazarBD.

It is stored in the repository so the workflow stays visible and versioned with the project. Treat it as repo guidance for Codex, not as a globally installed Codex skill.

## When To Use

Use this skill when:
- the user wants to merge the current task branch into `develop`
- the source branch is expected to be `feature/...`, `fix/...`, `docs/...`, or `chore/...`
- the work should follow TripBazarBD Git safety rules

Do not use this skill for:
- release promotion from `develop` to `main`
- rebasing workflows
- squash policy changes

## Workflow

1. Read [references/prechecks.md](./references/prechecks.md) before taking any Git action.
2. Read [references/execution.md](./references/execution.md) before running the merge.
3. Prefer the project script `bash scripts/merge-into-develop.sh` when it matches the requested workflow.
4. If the script cannot be used, follow the same guarded flow manually.
5. Read [references/failures.md](./references/failures.md) if the worktree is dirty, the branch is unsupported, validation fails, or merge conflicts occur.

## Notes

- Keep explanations beginner-friendly.
- Do not bypass the clean-worktree rule.
- Do not push automatically without user confirmation unless the user explicitly asks for it.
- If the remote `develop` branch does not exist, explain that clearly before pushing.
