# Technical Specification: Reviews Module Foundation

## 1. Summary
This feature adds the first user-generated content module for TripBazarBD: reviews.

It lets authenticated users create reviews for offers and lets guests or authenticated users list reviews for an offer publicly.

The first version stays intentionally simple:
- reviews are auto-published
- multiple reviews from the same user for the same offer are allowed
- public responses expose only a privacy-safe reviewer display value

## 2. Scope

### In Scope
- authenticated review creation for offers
- public review listing per offer
- review persistence linked to offers and users
- masked reviewer display helper
- Swagger and feature/API/database docs
- unit and integration tests

### Out of Scope
- review moderation
- admin review management
- edit or delete review flows
- spam prevention
- rating aggregation on offers

## 3. Goals
- complete the core product loop after offers and auth
- let authenticated users leave feedback on offers
- expose reviews publicly without leaking private user data
- keep the first review implementation small and easy to extend

## 4. Non-Goals
- building a full moderation or trust system
- introducing review reply threads
- computing offer-level aggregates in this task

## 5. Users And Roles
- `User`: can create reviews when authenticated
- `Admin`: can also create reviews through the same authenticated flow unless separate restrictions are added later
- `Guest`: can list reviews publicly but cannot create them

## 6. Functional Requirements
- authenticated users must be able to create a review for an existing offer
- guests must be able to list published reviews for an offer
- review creation must validate rating and comment
- review creation must reject missing offers
- multiple reviews by the same user for the same offer are allowed in v1
- public review responses must not expose full reviewer email

## 7. Proposed Design

### Affected Modules
- `ReviewsModule`
  - owns review persistence, review business logic, and review controllers
- `OffersModule`
  - reused only to confirm the offer exists
- `AuthModule`
  - reused for bearer authentication and current-user extraction
- `UsersModule`
  - reused to load reviewer data for display shaping

### Request Flow
1. A logged-in user calls `POST /api/v1/offers/:offerId/reviews` with rating and comment.
2. `AccessTokenGuard` validates the token and `@CurrentUser()` resolves the authenticated user.
3. The reviews controller validates the DTO and forwards the request to `ReviewsService`.
4. `ReviewsService` confirms the offer exists, confirms the user still exists, creates a published review, and returns a safe public review DTO.
5. Public callers use `GET /api/v1/offers/:offerId/reviews` to list only published reviews for that offer.

### Data Flow
- request body enters through DTO validation
- reviewer display name is derived from the reviewer email in a privacy-safe way
- `userId` and raw user email stay internal
- public list and create responses use the same safe review DTO shape

### Validation Rules
- rating must be between `1` and `5`
- comment must be present and bounded by a reasonable length
- the referenced offer must exist
- the authenticated user must still exist

## 8. API Impact

### Endpoints
- `POST /api/v1/offers/:offerId/reviews`
- `GET /api/v1/offers/:offerId/reviews`

### Auth And Access Rules
- create review: authenticated users only
- list reviews: public

## 9. Database Impact
- tables affected:
  - `reviews`
- new fields:
  - `id`
  - `offerId`
  - `userId`
  - `rating`
  - `comment`
  - `status`
  - timestamps
- relationships:
  - many reviews to one offer
  - many reviews to one user
- migration needed: `no`

## 10. Scalability And Operational Notes
- review listing is scoped per offer only in v1
- moderation and aggregation can be layered on later without changing the initial public route shape

## 11. Security Considerations
- review creation requires bearer authentication
- public responses do not expose full reviewer email
- internal `userId` is not returned in public review DTOs

## 12. Testing Strategy

### Unit Tests
- rating and comment validation
- reviewer display masking helper
- offer existence enforcement
- listing reviews for one offer only
- allowing multiple reviews from the same user for the same offer

### Integration Tests
- authenticated user can create a review
- guest cannot create a review
- public can list reviews for an offer
- review listing is offer-scoped
- public responses contain a masked reviewer display value

### Manual Test Steps
1. Log in as a normal user.
2. Use an existing published offer.
3. Submit one review for the offer.
4. Submit a second review for the same offer.
5. Verify both appear in the public review list with masked reviewer identity.
6. Verify guest review creation is rejected.

## 13. Documentation Updates
- API docs: add offer review endpoints
- Database docs: add reviews data model
- Feature docs: add the reviews technical spec
- ADR needed: `no`

## 14. Rollout Plan
- add the reviews module and entity
- verify review creation and listing locally
- run build, lint, unit tests, and integration tests

## 15. Risks And Mitigations
- Risk:
  Multiple reviews from the same user may later need aggregation or deduplication.
  Mitigation:
  Keep the service logic isolated so the duplicate policy can change later without rewriting controllers.

- Risk:
  Reviewer identity could leak too much user information.
  Mitigation:
  Return only a masked display value in public responses.

## 16. Open Questions
- When should moderation be added?
- When should offer-level average rating be computed and exposed?
