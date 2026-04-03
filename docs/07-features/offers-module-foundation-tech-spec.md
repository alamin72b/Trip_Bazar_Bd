# Technical Specification: Offers Module Foundation

## 1. Summary
This feature adds the first real product data module for TripBazarBD: offers.

It introduces admin-side offer management and public offer browsing in one backend slice so the platform can start storing and exposing actual travel offers.

The first version stays intentionally simple:
- text-based offer fields
- image URLs stored directly on the offer record
- WhatsApp contact preserved as the conversion path

## 2. Scope

### In Scope
- admin offer create, list, detail, and update endpoints
- public offer list and detail endpoints
- offer persistence and validation
- slug generation and uniqueness handling
- Swagger and feature/API/database documentation updates
- unit and integration tests for the offers module

### Out of Scope
- reviews
- categories and tags
- itinerary sub-models
- file uploads
- search, pagination, and advanced filtering
- booking engine integration

## 3. Goals
- establish the offer data model for future business features
- allow admins to manage offers through protected endpoints
- allow guests to browse published offers through public endpoints
- keep the first release beginner-friendly and easy to extend

## 4. Non-Goals
- building the final long-term offer schema
- designing review relationships in this task
- optimizing public browsing for large datasets yet

## 5. Users And Roles
- `Admin`: can create and update offers through admin-only routes
- `User`: can browse published offers through public routes
- `Guest`: can browse published offers through public routes without login

## 6. Functional Requirements
- admins must be able to create offers in `draft` or `published` state
- admins must be able to list all offers, including drafts
- admins must be able to fetch one offer by internal `id`
- admins must be able to update offer fields and status
- public routes must expose only `published` offers
- public offer detail must resolve by `slug`
- slugs must be unique
- image URLs must be stored directly on the offer model

## 7. Proposed Design

### Affected Modules
- `OffersModule`
  - owns offer persistence, business logic, admin controllers, and public controllers
- `AdminModule`
  - existing admin auth/role foundation is reused by admin offer routes
- `common`
  - existing auth and role guards are reused without new auth behavior

### Request Flow
1. Admin caller authenticates and receives a bearer token.
2. Admin offer routes use `AccessTokenGuard` and `RolesGuard`.
3. DTOs validate the request body.
4. `OffersService` handles slug generation, uniqueness, persistence, and response shaping.
5. Public routes query only `published` offers and return safe public fields.

### Data Flow
- create/update data enters through DTOs
- slug is normalized and made unique before save
- image URLs are stored as a simple JSON array
- admin responses return offer details for management
- public responses return only published offer data

### Validation Rules
- required fields:
  - `title`
  - `summary`
  - `description`
  - `destination`
  - `durationNights`
  - `price`
  - `currency`
  - `contactWhatsApp`
- business validation:
  - `price` must be positive
  - `durationNights` must be positive
  - `slug` must be unique
  - public routes must reject missing or unpublished slugs with `404`

## 8. API Impact

### Endpoints
- `POST /api/v1/admin/offers`
- `GET /api/v1/admin/offers`
- `GET /api/v1/admin/offers/:id`
- `PATCH /api/v1/admin/offers/:id`
- `GET /api/v1/offers`
- `GET /api/v1/offers/:slug`

### Auth And Access Rules
- admin routes: authenticated `admin` only
- public routes: open to guests and authenticated users

## 9. Database Impact
- tables affected:
  - `offers`
- new fields:
  - `id`
  - `title`
  - `slug`
  - `summary`
  - `description`
  - `destination`
  - `durationNights`
  - `price`
  - `currency`
  - `status`
  - `imageUrls`
  - `contactWhatsApp`
  - timestamps
- indexes:
  - unique index on `offers.slug`
- migration needed: `no`

## 10. Scalability And Operational Notes
- public browsing stays simple in v1 and returns all published offers
- the offer module is structured so search, filters, and pagination can be added later
- storing image URLs directly avoids introducing upload infrastructure too early

## 11. Security Considerations
- admin offer management is protected by existing access-token and role guards
- public routes do not reveal drafts
- internal offer IDs are not used in public detail URLs

## 12. Testing Strategy

### Unit Tests
- slug uniqueness handling
- create/update validation behavior
- public queries return only published offers

### Integration Tests
- admin can create and update an offer
- normal user cannot access admin offer management
- guest can list published offers
- guest cannot see drafts
- public detail resolves by slug

### Manual Test Steps
1. Start the backend with an admin seed.
2. Log in as admin.
3. Create a draft offer.
4. Confirm the draft is hidden from public routes.
5. Publish the offer.
6. Confirm it appears in public list and detail endpoints.

## 13. Documentation Updates
- API docs: add admin and public offer endpoints
- Database docs: add the offers data model
- Feature docs: add the offers technical spec
- ADR needed: `no`

## 14. Rollout Plan
- add the offers module and entity
- verify admin and public offer flows locally
- run build, lint, unit tests, and integration tests

## 15. Risks And Mitigations
- Risk:
  The first offer model may be too simple for later rich travel-package data.
  Mitigation:
  Keep the service and DTO boundaries clean so the schema can evolve later.

- Risk:
  Public browsing may later need search or pagination.
  Mitigation:
  Start with a straightforward list/detail contract and extend it when actual browsing needs are clear.

## 16. Open Questions
- When should categories or destination-based filters be added?
- When should reviews be linked directly to offers?
