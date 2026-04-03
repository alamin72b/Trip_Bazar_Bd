# Technical Specification: Backend Foundation

## 1. Summary
This feature establishes the first backend foundation for TripBazarBD using NestJS.

It creates the minimum technical base needed before real business features are added.

## 2. Scope

### In Scope
- NestJS backend scaffold inside `apps/backend/`
- environment configuration and validation
- global validation pipe
- global exception handling
- Swagger documentation
- basic health endpoint
- beginner-friendly project run instructions

### Out of Scope
- offers business logic
- authentication and authorization
- reviews module
- database integration
- frontend dashboard

## 3. Goals
- create a clean backend-first starting point
- enforce simple structure for future modules
- make local development easy to understand
- expose a minimal documented API for early testing

## 4. Non-Goals
- shipping production business features
- designing final database schema
- building client-facing UI

## 5. Users And Roles
- `Admin`: will later manage offers through backend APIs
- `User`: will later review offers after authentication
- `Guest`: will later browse public offers without login

## 6. Functional Requirements
- the backend must boot successfully
- the backend must validate environment configuration on startup
- the backend must expose a health endpoint
- the backend must expose Swagger documentation
- the backend must apply global request validation for future DTO-based endpoints

## 7. Proposed Design

### Affected Modules
- `AppModule`: root composition
- `HealthModule`: runtime health endpoint
- `config`: environment defaults and validation
- `common`: shared exception handling

### Request Flow
Incoming requests enter NestJS, pass through global pipes and filters, then reach the controller and service layers.

### Data Flow
Environment values are loaded at startup, validated once, and then read through the NestJS config service.

### Validation Rules
- input validation: enabled globally through `ValidationPipe`
- business validation: not yet implemented in this phase
- error cases: invalid environment setup and HTTP exceptions return structured responses

## 8. API Impact

### Endpoints
- Method: `GET`
- Path: `/`
- Purpose: expose basic backend metadata

- Method: `GET`
- Path: `/api/v1/health`
- Purpose: verify the backend is running

- Method: `GET`
- Path: `/docs`
- Purpose: expose Swagger API documentation

### Auth And Access Rules
- all current endpoints are public in this phase
- authentication is intentionally deferred to a later feature

## 9. Database Impact
- no database changes in this phase

## 10. Scalability And Operational Notes
- Swagger improves contract visibility during early development
- health endpoint supports local verification and future monitoring hooks
- global validation prevents loose request contracts from spreading later

## 11. Security Considerations
- input validation is enabled globally
- CORS is enabled for future frontend integration
- auth and role checks are not yet implemented

## 12. Testing Strategy

### Unit Tests
- verify root metadata response shape

### Integration Tests
- verify root endpoint returns application metadata
- verify health endpoint returns healthy status

### Manual Test Steps
1. Start the backend with `npm run start:dev` inside `apps/backend/`
2. Open `http://localhost:3000/docs`
3. Open `http://localhost:3000/api/v1/health`

## 13. Documentation Updates
- architecture docs updated
- feature technical spec added
- root project README updated
- ADR needed: `no`

## 14. Rollout Plan
- copy `.env.example` to `.env` if customization is needed
- install dependencies
- start backend locally

## 15. Risks And Mitigations
- Risk:
  Future modules could become inconsistent if structure is not enforced.
  Mitigation:
  Establish shared folders and global configuration from the start.

- Risk:
  Beginners may find NestJS bootstrap concepts confusing.
  Mitigation:
  Keep the first module set very small and document each part clearly.

## 16. Open Questions
- Which database should be introduced first?
- Which auth strategy should be adopted for admin and user flows?
