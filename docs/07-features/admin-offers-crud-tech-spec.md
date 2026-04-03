# Technical Specification: Admin Offers CRUD Completion

## 1. Summary
This feature completes the first admin CRUD flow for offers by adding hard delete and improving the admin list endpoint with filtering and pagination.

It keeps the existing offers foundation intact while making admin offer management more practical for real back-office usage.

This change helps:
- `Admin` users who need to search, filter, review, and remove offers
- the backend codebase by keeping the offers module consistent and easier to extend later

## 2. Scope

### In Scope
- add admin offer delete endpoint
- add admin offer list filters for `status` and `search`
- add admin offer list pagination with `page` and `limit`
- update tests and documentation for the new admin behavior

### Out of Scope
- public offer search or pagination
- soft delete or archived offer states
- category, tag, or destination taxonomy work
- file uploads or media management

## 3. Goals
- complete the admin-side CRUD baseline for offers
- make the admin list more useful without redesigning the module
- keep the implementation beginner-friendly and modular

## 4. Non-Goals
- redesigning the public offers API
- introducing database migrations for this slice
- changing the existing create or update request payloads

## 5. Users And Roles
- `Admin`: can create, list, filter, page through, update, and delete offers
- `User`: cannot access admin offer routes
- `Guest`: cannot access admin offer routes

## 6. Functional Requirements
- admins must be able to delete an offer by internal `id`
- delete must remove the offer record permanently
- deleting an offer must also remove dependent reviews through the existing database cascade
- admin list must support optional filtering by `status`
- admin list must support optional text search over `title`, `destination`, `summary`, and `slug`
- admin list must support pagination with `page` and `limit`
- admin list must return `items`, `total`, `page`, and `limit`
- blank search input must behave the same as no search input

## 7. Proposed Design

### Affected Modules
- `OffersModule`
  - extend admin controller DTOs and service query logic
- `ReviewsModule`
  - no API change, but dependent review rows are removed by the existing foreign key cascade
- `common`
  - existing auth and role guards are reused without new authorization logic

### Request Flow
1. Admin caller authenticates and sends a bearer token.
2. Admin offer routes continue using `AccessTokenGuard` and `RolesGuard`.
3. Query DTOs validate and normalize admin list input.
4. `OffersService` applies filters, pagination, ordering, and delete behavior.
5. Responses return either paginated admin data or `204 No Content` for successful delete.

### Data Flow
- admin list input enters through query params
- `status` is validated against the existing offer status enum
- `search` is trimmed before query construction
- `page` and `limit` are transformed to numbers and bounded by validation
- offers are loaded in newest-first order
- delete removes the offer row directly from persistence

### Validation Rules
- input validation:
  - `status` must be `draft` or `published` when provided
  - `search` must be a string when provided
  - `page` must be at least `1`
  - `limit` must be between `1` and `50`
- business validation:
  - deleting a missing offer must return `404`
  - blank search must not trigger a text filter
- error cases:
  - `401` for missing or invalid access token
  - `403` for authenticated non-admin users
  - `404` for missing offer `id`

## 8. API Impact

### Endpoints
- `GET /api/v1/admin/offers`
  - add optional query params: `status`, `search`, `page`, `limit`
  - change response to a paginated object
- `DELETE /api/v1/admin/offers/:id`
  - add hard delete endpoint with `204 No Content`

### Auth And Access Rules
- admin routes: authenticated `admin` only
- no new guard or permission model is introduced

## 9. Database Impact
- tables affected:
  - `offers`
  - `reviews` through existing foreign key cascade
- new fields:
  - none
- relationships:
  - existing `reviews.offerId -> offers.id` cascade is relied on during delete
- indexes:
  - existing unique index on `offers.slug` remains unchanged
- migration needed: `no`

## 10. Scalability And Operational Notes
- admin pagination reduces the need to return every offer record on each request
- text search stays lightweight and database-level for now
- current filtering is enough for early admin workflows without introducing a separate search system

## 11. Security Considerations
- existing bearer authentication remains in place
- authorization stays admin-only for management routes
- validation pipe continues rejecting invalid query params and payload fields
- hard delete is intentionally restricted to admins

## 12. Testing Strategy

### Unit Tests
- list pagination metadata
- status filtering
- search filter construction
- delete success
- delete `404` behavior

### Integration Tests
- admin can delete an offer
- deleted offers are absent from admin detail and public detail
- non-admin user remains forbidden from admin routes
- admin list supports combined filter and pagination input

### Manual Test Steps
1. Start the backend with an admin seed.
2. Log in as admin.
3. Create several draft and published offers.
4. Verify admin list filtering and pagination.
5. Delete one offer and confirm it no longer appears in admin or public reads.

## 13. Documentation Updates
- API docs: update admin offers list and delete behavior
- Database docs: note hard delete behavior and review cascade impact
- Feature docs: add this technical spec
- ADR needed: `no`

## 14. Rollout Plan
- add the follow-up admin offers spec
- implement the DTO, controller, and service changes
- update tests and docs
- verify build and tests locally

## 15. Risks And Mitigations
- Risk:
  Hard delete can permanently remove published offers.
  Mitigation:
  Restrict delete to admins and keep `404` behavior consistent after removal.

- Risk:
  Text search behavior may differ across database engines later.
  Mitigation:
  Keep the search logic isolated in the offers service so it can be refined when PostgreSQL is introduced.

## 16. Open Questions
- When the admin panel grows, should sorting options be added beyond newest-first?
- When offer volume increases, should public list pagination be introduced too?
