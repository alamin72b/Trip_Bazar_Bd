# Execution

Preferred execution path:

```bash
bash scripts/merge-into-develop.sh
```

This script already implements the guarded TripBazarBD merge flow:

1. Detect the current task branch.
2. Refuse `develop` and `main`.
3. Refuse unsupported branch names.
4. Require a clean worktree.
5. Checkout `develop`.
6. Pull `origin/develop` when available.
7. Merge the source branch into `develop`.
8. Run safe backend validation.
9. Ask before pushing `develop`.

If manual execution is required, mirror the same order and the same safety checks instead of improvising a different merge flow.
