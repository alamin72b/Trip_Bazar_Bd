# Technical Specification: Admin Authorization Foundation

## 1. Summary
This feature adds the first authorization layer on top of the existing auth foundation.

It introduces admin-only route protection, a controlled startup seed for the first admin account, and a minimal protected admin proof endpoint.

The goal is to prepare the backend for future admin-only offer management without changing the existing public email/password auth flow.

## 2. Scope

### In Scope
- role metadata through `@Roles(...)`
- role enforcement through `RolesGuard`
- startup bootstrap for one initial admin account from environment variables
- one admin-only proof endpoint
- environment validation and documentation updates
- unit and integration tests for role checks and admin bootstrap behavior

### Out of Scope
- offers CRUD
- admin dashboard work
- admin self-signup flow
- general user-management endpoints
- changing the current `/api/v1/auth/email` public flow

## 3. Goals
- add a clean role-based authorization base for future admin modules
- keep auth and authorization responsibilities separated
- keep admin creation controlled and simple for early backend development
- preserve beginner-friendly module boundaries

## 4. Non-Goals
- building a full RBAC system
- supporting multiple admin bootstrap strategies
- introducing permissions more granular than `admin` and `user`

## 5. Users And Roles
- `Admin`: seeded in a controlled way through environment variables and allowed to access admin-only endpoints
- `User`: authenticated account without admin-only access
- `Guest`: unauthenticated caller with no access to admin-only endpoints

## 6. Functional Requirements
- admin-only routes must require a valid bearer access token first
- admin-only routes must reject authenticated non-admin users with `403`
- the app must optionally seed an admin account at startup when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are present
- admin seed email must be normalized to lowercase
- admin seed logic must not create duplicates
- admin seed logic must not overwrite an existing account password automatically
- the existing public auth endpoints must remain unchanged

## 7. Proposed Design

### Affected Modules
- `common`
  - role decorator, role guard, and shared role-check helper
- `admin`
  - admin bootstrap service and proof endpoint
- `users`
  - existing user lookup reused by bootstrap logic
- `auth`
  - existing bearer auth remains the first gate before role checks

### Request Flow
1. A client authenticates through the existing auth module and receives a bearer access token.
2. A client calls `GET /api/v1/admin/ping` with the bearer token.
3. `AccessTokenGuard` validates the JWT and attaches the authenticated user payload.
4. `RolesGuard` reads `@Roles('admin')` metadata from the route.
5. If the user role is `admin`, the request proceeds to the controller.
6. If the user role is not `admin`, the request is rejected with `403`.

### Startup Flow
1. On app startup, the admin bootstrap service reads `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
2. If either value is missing, bootstrap exits without action.
3. If a user with that email already exists, bootstrap exits without overwriting the account.
4. If the user does not exist, the password is hashed and a new `admin` user is created.

### Validation Rules
- input validation:
  - admin seed env values are optional
- business validation:
  - existing seeded admin email is not duplicated
  - only `admin` role passes admin route checks
- error cases:
  - missing or invalid bearer token returns `401`
  - authenticated non-admin user returns `403`

## 8. API Impact

### Endpoints
- Method: `GET`
- Path: `/api/v1/admin/ping`
- Purpose: verify admin-only authorization wiring
- Request DTO: none
- Response DTO: `AdminPingResponseDto`
- Error responses: `401`, `403`

### Auth And Access Rules
- `GET /admin/ping`: authenticated `admin` only

## 9. Database Impact
- tables affected:
  - `users`
- new fields:
  - none
- relationships:
  - unchanged
- indexes:
  - unchanged
- migration needed: `no`

## 10. Scalability And Operational Notes
- route-level role metadata keeps future admin modules easy to extend
- startup admin bootstrap is suitable for early environments and local development
- more formal admin provisioning can replace the seed path later without changing route authorization behavior

## 11. Security Considerations
- admin creation is not exposed as a public endpoint
- admin routes require both authentication and role authorization
- seeded admin passwords are hashed with the existing password service
- the bootstrap flow does not auto-promote or overwrite an existing user record

## 12. Testing Strategy

### Unit Tests
- roles guard allows admin and rejects normal user
- admin bootstrap creates admin when env values are present
- admin bootstrap does not create duplicates
- admin bootstrap does not overwrite existing credentials

### Integration Tests
- seeded admin can access the admin proof endpoint
- normal authenticated user is blocked from the admin proof endpoint
- invalid access token is rejected before role checks
- app starts normally when admin seed env vars are absent

### Manual Test Steps
1. Start the backend with `ADMIN_EMAIL` and `ADMIN_PASSWORD` set.
2. Log in through `POST /api/v1/auth/email` with the seeded admin account.
3. Call `GET /api/v1/admin/ping` with the admin bearer token.
4. Log in as a normal user and verify the same endpoint is rejected.

## 13. Documentation Updates
- API docs: add admin proof endpoint
- Database docs: no schema change
- Workflow docs: no change
- Feature docs: add admin authorization foundation technical spec
- ADR needed: `no`

## 14. Rollout Plan
- add optional admin seed env vars
- start the backend with or without seed values
- verify admin access through the proof endpoint
- run unit and integration tests

## 15. Risks And Mitigations
- Risk:
  A startup seed path could be mistaken for a long-term admin management strategy.
  Mitigation:
  Document clearly that it is only an early controlled bootstrap mechanism.

- Risk:
  Future routes may forget to apply role metadata consistently.
  Mitigation:
  Establish a single `@Roles(...)` + `RolesGuard` pattern now and reuse it for later admin modules.

## 16. Open Questions
- When should admin bootstrap move from env seeding to a more formal provisioning flow?
- When should role checks expand beyond simple `admin` vs `user`?
