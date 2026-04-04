# Merge Into `develop` Helper

This helper gives TripBazarBD a repeatable local workflow for merging a finished task branch into `develop`.

It is a project-local starter version. Later, the same workflow can be promoted into a reusable Codex skill if the team keeps using it.

The repository also includes a modular project-local skill entry under [project-skills/merge-into-develop/SKILL.md](/home/al-amin72b/Desktop/Trip_Bazar_Bd/project-skills/merge-into-develop/SKILL.md). That skill-like structure keeps the Codex workflow instructions in the repo while the shell script remains the deterministic execution path.

## 1. When To Use It

Use the helper when:
- the current branch is a normal task branch such as `feature/...`, `fix/...`, `docs/...`, or `chore/...`
- the branch work is complete
- you want to update local `develop` and optionally push it to `origin`

Do not use the helper when:
- you are already on `develop`
- you are on `main`
- you are doing release promotion from `develop` to `main`
- your working tree has uncommitted changes

If the user asks for a merge while there are uncommitted changes, the correct response is not to stop at that warning alone. The workflow should also provide the exact next commands for one of these paths:
- commit and push the pending work on the current task branch
- stash the pending work temporarily, complete the merge, then restore the stash

## 2. Script Location

Run the helper from the repository root:

```bash
bash scripts/merge-into-develop.sh
```

The script uses the current branch as the source branch automatically. It always targets `develop`.

## 3. Preconditions

Before running the helper:
- review the current branch changes
- make sure the working tree is clean
- make sure the source branch name uses one of the allowed prefixes
- make sure `develop` is the intended merge target

The script refuses to continue if those safety checks fail.

If the working tree is not clean, give the user the exact recovery commands in the same response. Example patterns:

```bash
git add <files>
git commit -m "feat(scope): short summary"
git push origin <current-branch>
```

or

```bash
git stash push -u -m "temp before merge to develop"
git checkout develop
git pull origin develop
git merge <current-branch>
git push origin develop
git checkout <current-branch>
git stash pop
```

## 4. Exact Merge Flow

The helper runs this flow:

1. Detect the current branch.
2. Refuse `develop` and `main`.
3. Refuse unsupported branch names.
4. Confirm the working tree is clean.
5. Checkout `develop`.
6. Pull the latest `develop` from `origin`.
7. Merge the original task branch into `develop` with a merge commit.
8. Run validation if a safe project command is available.
9. Ask for confirmation before pushing `develop`.

This keeps the merge process consistent and prevents accidental branch switching with local changes still pending.

## 5. Conflict Behavior

If the merge creates conflicts, the helper stops immediately.

At that point:
- the repository stays on `develop`
- Git marks the conflicted files
- you must resolve the conflicts manually before continuing

Suggested commands after a conflict:

```bash
git status
git add <resolved-files>
git commit
git push origin develop
```

If needed, run your normal verification commands before the final push.

## 6. Validation Behavior

The helper looks for a safe backend validation path in `apps/backend`.

Current validation sequence:

```bash
npm test
npm run build
```

Why this is the default:
- `npm test` checks behavior
- `npm run build` checks that the NestJS app still compiles
- `npm run lint` is intentionally skipped because the current lint script uses `--fix` and would rewrite files automatically

If `package.json` or `npm` is not available, the helper prints that validation was not auto-run and continues to the push confirmation step.

If validation fails, the helper stops before push so `develop` is not pushed in a broken state.

## 7. Push Confirmation

The helper never pushes automatically.

After a successful merge and successful validation, it asks:

```text
Push 'develop' to origin now? [y/N]:
```

- answer `y` or `yes` to push
- answer anything else to keep the merge local only

If you skip the push, the helper prints the exact `git push origin develop` command.

## 8. Why This Helper Exists

This project keeps a simple `main` and `develop` workflow. A local helper makes the integration step easier to repeat and easier to explain, especially for beginner-friendly project workflows.
