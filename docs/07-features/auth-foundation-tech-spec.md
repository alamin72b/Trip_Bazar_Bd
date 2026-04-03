# Technical Specification: Auth Foundation

## 1. Summary
This feature adds the first real business capability for TripBazarBD: email/password authentication.

It introduces a single public auth entrypoint for v1 that can either create a new account or log in an existing account, while still keeping registration logic and login logic separate inside the backend.

The feature helps:
- `Guest` users create an account or sign in
- `User` accounts become identifiable for future review and profile features
- `Admin` work later build on the same shared user model with role-based access

## 2. Scope

### In Scope
- `POST /api/v1/auth/email` for signup-or-login orchestration
- `POST /api/v1/auth/refresh` for refresh-token rotation
- `GET /api/v1/auth/me` for authenticated profile lookup
- user persistence with a shared `users` table
- refresh-token persistence with hashed stored values
- password hashing with `argon2`
- JWT access tokens for bearer authentication
- unit and e2e tests for the main auth flows

### Out of Scope
- email verification
- forgot-password and reset-password flows
- Google or social login
- admin self-signup
- frontend dashboard work

## 3. Goals
- introduce a clean auth foundation without mixing in unrelated features
- keep controller logic thin and move business rules into services
- make future role-based authorization straightforward
- keep the initial auth flow beginner-friendly to understand and extend

## 4. Non-Goals
- building a complete account-management system
- finalizing long-term authorization policies
- supporting every session-management use case in v1

## 5. Users And Roles
- `Admin`: created through a separate controlled flow later; not self-registered here
- `User`: default role for newly created accounts
- `Guest`: can call the public auth endpoints without prior login

## 6. Functional Requirements
- the backend must normalize incoming email addresses to lowercase before lookup and storage
- the backend must create a new user when the email does not already exist
- the backend must log in an existing user when the password matches
- the backend must return `401` when an existing user provides the wrong password
- the backend must issue an access token and refresh token after successful auth
- the backend must rotate refresh tokens on `POST /auth/refresh`
- the backend must never return `passwordHash`
- the backend must protect `GET /auth/me` with bearer access-token authentication

## 7. Proposed Design

### Affected Modules
- `DatabaseModule`
  - configures TypeORM and the initial SQLite-backed persistence layer
- `UsersModule`
  - owns user lookup, creation, and persistence rules
- `AuthModule`
  - owns signup-or-login orchestration, token issuance, refresh, and profile lookup
- `common`
  - shared auth decorators and request typing

### Request Flow
1. A client sends `POST /api/v1/auth/email` with `email` and `password`.
2. The auth controller validates the DTO and forwards it to `AuthService`.
3. `AuthService` normalizes the email and asks `UsersService` for an existing user.
4. If no user exists, `AuthService` hashes the password, creates the user through `UsersService`, then issues tokens.
5. If a user exists, `AuthService` verifies the password, then issues tokens.
6. When tokens are issued, the refresh token is hashed and stored in the refresh-token table.
7. `GET /api/v1/auth/me` uses the bearer access token, resolves the current user, and returns a safe profile DTO.

### Data Flow
- input enters through DTOs and is validated by the global validation pipe
- email is normalized before persistence work starts
- passwords are hashed with `argon2`
- refresh tokens are signed as JWTs, then hashed before storage
- response DTOs return user-safe fields and token strings, never the password hash

### Validation Rules
- input validation:
  - `email` must be a valid email string
  - `password` must meet a minimum length requirement
- business validation:
  - normalized email must be unique
  - inactive users cannot authenticate successfully
  - revoked or expired refresh tokens cannot be reused
- error cases:
  - wrong password returns `401`
  - invalid refresh token returns `401`
  - missing bearer token for protected routes returns `401`

## 8. API Impact

### Endpoints
- Method: `POST`
- Path: `/api/v1/auth/email`
- Purpose: create a user if the email is new, or log in if the email already exists
- Request DTO: `AuthEmailDto`
- Response DTO: `AuthTokensResponseDto`
- Error responses: `400`, `401`

- Method: `POST`
- Path: `/api/v1/auth/refresh`
- Purpose: rotate the refresh token and issue a new token pair
- Request DTO: `RefreshTokenDto`
- Response DTO: `AuthTokensResponseDto`
- Error responses: `400`, `401`

- Method: `GET`
- Path: `/api/v1/auth/me`
- Purpose: return the authenticated user profile
- Request DTO: none
- Response DTO: `AuthUserProfileDto`
- Error responses: `401`

### Auth And Access Rules
- `POST /auth/email`: public
- `POST /auth/refresh`: public, but requires a valid refresh token in the request body
- `GET /auth/me`: authenticated users with a valid bearer access token

## 9. Database Impact
- tables affected:
  - `users`
  - `refresh_token_records`
- new fields:
  - users: `id`, `email`, `passwordHash`, `role`, `isActive`, timestamps
  - refresh_token_records: `id`, `userId`, `tokenId`, `tokenHash`, `expiresAt`, `revokedAt`, timestamps
- relationships:
  - one user can have many refresh-token records
- indexes:
  - unique index on normalized `users.email`
  - unique index on `refresh_token_records.tokenId`
- migration needed: `no`
  Current foundation uses TypeORM synchronization for local development and tests. Formal migrations can be introduced once the schema stabilizes.

## 10. Scalability And Operational Notes
- the code keeps auth orchestration separate from user persistence so future modules can reuse `UsersService`
- refresh-token records support future revocation and auditing work
- SQLite is acceptable for this first backend foundation because it keeps onboarding simple while the module boundaries stay database-agnostic enough for a later PostgreSQL move

## 11. Security Considerations
- passwords are hashed with `argon2`
- refresh tokens are never stored in raw form
- access tokens and refresh tokens use separate secrets
- `passwordHash` is excluded from responses
- bearer auth is required for protected routes

## 12. Testing Strategy

### Unit Tests
- new-user auth flow hashes the password and sets the default role to `user`
- existing-user auth flow issues tokens when the password is correct
- existing-user auth flow returns `401` when the password is incorrect
- refresh verification rejects invalid or revoked tokens

### Integration Tests
- `POST /auth/email` creates and logs in a new user
- `POST /auth/email` logs in an existing user
- duplicate email casing does not create a second account
- `GET /auth/me` returns the authenticated user from the bearer token
- protected routes reject missing or invalid access tokens

### Manual Test Steps
1. Start the backend from `apps/backend/`.
2. Call `POST /api/v1/auth/email` with a new email and password.
3. Call the same endpoint again with the same email and password.
4. Call it again with the same email and a wrong password.
5. Use `POST /api/v1/auth/refresh` with a valid refresh token.
6. Use `GET /api/v1/auth/me` with the returned bearer access token.

## 13. Documentation Updates
- API docs: add auth endpoint documentation
- Database docs: add initial user and refresh-token table design
- Workflow docs: no change
- Feature docs: add auth foundation technical spec
- ADR needed: `no`

## 14. Rollout Plan
- add auth and database environment variables
- install new backend dependencies
- start the backend so TypeORM creates the initial schema locally
- run unit and e2e tests

## 15. Risks And Mitigations
- Risk:
  The combined signup-or-login endpoint can be less explicit than separate register and login endpoints.
  Mitigation:
  Keep registration and login logic separate inside `AuthService` so the public API can be split later without rewriting the core business rules.

- Risk:
  SQLite is not the final long-term production database choice.
  Mitigation:
  Keep business logic in services and persistence concerns behind modules so the project can move to PostgreSQL later with limited controller changes.

## 16. Open Questions
- When should admin bootstrap or seed creation be added?
- When should auth rate limiting be introduced for brute-force protection?
