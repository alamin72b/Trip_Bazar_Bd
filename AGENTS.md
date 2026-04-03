# TripBazarBD Agent Rules

## Project Context
- TripBazarBD is a scalable travel-offer platform.
- We are building the backend first.
- Admin manages offers.
- Users can browse offers without login.
- Users must log in to leave reviews.
- Users contact admin through WhatsApp instead of booking APIs.

## Working Rules
- Explain the plan before major changes.
- Keep changes modular, focused, and beginner-friendly.
- Explain important coding choices in simple language.
- Do not mix unrelated work in one task.
- Do not delete files unless clearly requested.

## Backend Standards
- Use TypeScript and clean NestJS module structure.
- Keep controllers thin and business logic in services.
- Separate DTOs, entities, guards, validators, and services.
- Add validation and clear error handling.

## Documentation Policy
- Update documentation when architecture, APIs, database design, or workflows change.
- Write a Technical Spec before major feature work.
- Record important architecture decisions as ADRs.
- Use templates from `docs/00-templates` when available.
- Store docs in the correct folders:
  - `docs/02-architecture`
  - `docs/03-api`
  - `docs/04-database`
  - `docs/05-workflows`
  - `docs/06-decisions`
  - `docs/07-features`

## Git Workflow Policy
- Use one branch per task.
- Never commit directly to `main`.
- Use branch names such as `feature/...`, `fix/...`, `docs/...`, and `chore/...`.
- Use Conventional Commits.
- Keep commits small and focused.

## Definition Of Done
- Code and docs are clean and consistent.
- Run and test steps are explained.
- Related docs are updated.
- A Conventional Commit message is suggested.
