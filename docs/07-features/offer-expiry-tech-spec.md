# Technical Specification: Offer Expiry And Activation Mapping

## 1. Summary
This feature adds an optional expiry date to offers so TripBazarBD can stop
showing outdated travel packages automatically without deleting them from the
admin system.

It helps admins keep old offers for editing and record-keeping while ensuring
public visitors only see currently active packages.

## 2. Scope

### In Scope
- add optional expiry input to admin offer create and update flows
- store offer expiry as a nullable `expiresAt` timestamp
- hide expired published offers from public list and detail endpoints
- keep expired offers visible in admin APIs and admin UI
- reuse existing `draft` and `published` status values for deactivate and activate behavior
- update backend tests, integration tests, frontend admin UI, and docs

### Out of Scope
- scheduled background jobs for expiring offers
- new status values or a separate active boolean
- public UI badges for expiry dates
- timezone configuration per admin user

## 3. Goals
- let admins define when an offer should stop being publicly visible
- keep public offer visibility rules simple and automatic
- avoid introducing a second activation model beside `draft` and `published`

## 4. Non-Goals
- adding archive workflows
- changing how WhatsApp contact works
- redesigning the public offer pages

## 5. Users And Roles
- `Admin`: can set or clear offer expiry dates and still view expired offers
- `User`: can browse only published, non-expired offers
- `Guest`: can browse only published, non-expired offers without login

## 6. Functional Requirements
- admins must be able to submit an optional `expiryDate` in `YYYY-MM-DD` format
- the backend must convert `expiryDate` into `expiresAt` at `23:59:59.999` in server local time
- admin create and update responses must include `expiresAt`
- public offer list must return only offers where `status = published` and `expiresAt` is null or in the future
- public offer detail must return `404` for expired offers
- admin list and detail routes must remain unaffected by expiry filtering
- admin UI must expose an expiry date field in the offer form
- admin UI must show expiry information in the offer list
- activation and deactivation must continue using `published` and `draft`

## 7. Proposed Design

### Affected Modules
- `apps/backend/src/offers`
- `apps/frontend/src/components/admin-dashboard.tsx`
- `apps/frontend/src/lib`
- `docs/03-api`
- `docs/04-database`
- `docs/07-features`

### Request Flow
1. Admin submits offer create or update input with optional `expiryDate`.
2. DTO validation checks the date-only format.
3. `OffersService` converts the date-only value into an end-of-day `Date`.
4. TypeORM persists the value in `offers.expiresAt`.
5. Admin reads continue returning all offers.
6. Public reads add the expiry rule before returning offers.

### Data Flow
- input enters as `expiryDate`
- the service translates it to `expiresAt`
- the entity stores `expiresAt` as a nullable datetime
- response DTOs expose `expiresAt` as an ISO string or `null`
- frontend admin state sends `expiryDate` and renders `expiresAt`

### Validation Rules
- Input validation:
  - `expiryDate` must match `YYYY-MM-DD` when provided
- Business validation:
  - impossible calendar dates are rejected before persistence
  - expired offers stay stored but are excluded from public queries
- Error cases:
  - invalid `expiryDate` returns `400`
  - expired public slug lookup returns `404`

## 8. API Impact

### Endpoints
- Method: `POST`
- Path: `/api/v1/admin/offers`
- Purpose: create an offer with optional expiry
- Request DTO: `CreateOfferDto` with optional `expiryDate`
- Response DTO: `OfferResponseDto` with nullable `expiresAt`
- Error responses: `400`, `401`, `403`

- Method: `PATCH`
- Path: `/api/v1/admin/offers/:id`
- Purpose: update offer fields, status, and expiry
- Request DTO: `UpdateOfferDto` with optional `expiryDate`
- Response DTO: `OfferResponseDto` with nullable `expiresAt`
- Error responses: `400`, `401`, `403`, `404`

- Method: `GET`
- Path: `/api/v1/offers`
- Purpose: list only published, non-expired offers
- Request DTO: none
- Response DTO: array of `OfferResponseDto`
- Error responses: standard transport errors only

- Method: `GET`
- Path: `/api/v1/offers/:slug`
- Purpose: fetch one published, non-expired offer
- Request DTO: none
- Response DTO: `OfferResponseDto`
- Error responses: `404`

### Auth And Access Rules
- Who can call it:
  - admin offer routes: authenticated `admin`
  - public offer routes: guest, user, or admin
- Guard or auth strategy:
  - admin routes reuse `AccessTokenGuard` and `RolesGuard`
  - public routes remain open
- Permission rules:
  - expiry filtering applies only to public reads

## 9. Database Impact
- Tables or collections affected:
  - `offers`
- New fields:
  - `expiresAt`
- Relationships:
  - none
- Indexes:
  - no new index in this iteration
- Migration needed: `no`

## 10. Scalability And Operational Notes
- Expected traffic:
  - same as current public offer browsing
- Pagination or filtering:
  - no new pagination in this task
- Caching:
  - public frontend offer fetch should avoid stale caching so expiry takes effect immediately
- Queue or async work:
  - none
- Logging and monitoring:
  - existing application logging remains sufficient for this change

## 11. Security Considerations
- Authentication:
  - unchanged
- Authorization:
  - unchanged for admin-only routes
- Input validation:
  - `expiryDate` format and calendar validity are enforced
- Rate limiting:
  - unchanged
- Sensitive data handling:
  - unchanged

## 12. Testing Strategy

### Unit Tests
- `createOffer` stores `expiresAt` as end-of-day
- `updateOffer` stores `expiresAt` as end-of-day
- `getPublishedOffers` builds filters that exclude expired offers
- `getPublishedOfferBySlug` rejects expired offers

### Integration Tests
- admin can create and update an offer with `expiryDate`
- public list excludes expired published offers
- public detail returns `404` for expired published offers

### Manual Test Steps
1. Open the admin dashboard and create a published offer with a future expiry date.
2. Confirm the expiry date appears on the admin offer card.
3. Open the public offers page and verify the offer is visible.
4. Change the offer to a past expiry date from the admin form.
5. Confirm the offer still appears in admin but disappears from public list and detail.

## 13. Documentation Updates
- API docs: update offer request and response shapes with `expiryDate` and `expiresAt`
- Database docs: update the offers data model with `expiresAt`
- Workflow docs: none
- Feature docs: add this technical specification
- ADR needed: `no`

## 14. Rollout Plan
- add the nullable `expiresAt` field to the offer entity
- update service filtering and response mapping
- update admin UI form and list rendering
- run targeted tests for offers backend behavior
- verify the admin and public flows manually

## 15. Risks And Mitigations
- Risk:
  Frontend caching could keep expired offers visible briefly after expiry.
  Mitigation:
  Fetch public offers without stale caching so the backend expiry rule is reflected immediately.

- Risk:
  Date-only parsing can drift if treated as UTC instead of server local time.
  Mitigation:
  Convert `expiryDate` with the JavaScript local `Date` constructor and set end-of-day explicitly in the service utility.

## 16. Open Questions
- Should a future iteration show an explicit expired badge in admin status pills?
- Should public offer browsing later support filtering by “expiring soon” offers?
