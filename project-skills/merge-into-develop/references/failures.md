# Failure Handling

## Dirty Worktree

Stop before switching branches. Ask the user to commit or stash changes, or clean the tree as requested.

## Unsupported Branch

Stop and explain that TripBazarBD only allows merging normal task branches into `develop` through this workflow.

## Merge Conflict

Stop immediately after the failed merge and explain that the conflicted files must be resolved on `develop` before continuing.

Useful commands:

```bash
git status
git add <resolved-files>
git commit
git push origin develop
```

## Validation Failure

Do not push `develop`. Report which validation step failed and keep the branch local until the failure is fixed.

## Missing Remote `develop`

Explain that local `develop` can still be merged, but the first push may create `origin/develop` instead of updating an existing remote branch.
