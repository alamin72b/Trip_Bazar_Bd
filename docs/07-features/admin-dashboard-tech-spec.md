# Technical Specification: Admin Dashboard

## 1. Summary
This feature adds the first real admin dashboard to TripBazarBD.

It extends the existing backend admin foundation and the existing Next.js frontend so admins can manage offers, moderate reviews, and manage user access from one protected internal workspace.

It helps the admin team operate the platform without changing the public browsing or traveler review experience.

## 2. Scope

### In Scope
- protected `/admin` route in the existing frontend app
- admin-aware login redirect behavior
- full admin offer CRUD including delete
- admin offer image upload with drag-and-drop or file picker UX
- admin review list, visibility moderation, and delete
- admin user list, role update, and active-status update
- API and feature documentation updates

### Out of Scope
- password reset or password change flows
- public search/filter redesign
- separate admin app or separate admin auth mechanism
- fine-grained RBAC beyond `admin` and `user`

## 3. Goals
- give admins one practical internal dashboard
- reuse the existing auth/session foundation
- keep public browsing and review submission behavior intact
- keep module boundaries simple and beginner-friendly

## 4. Non-Goals
- building a full enterprise admin suite
- introducing soft-delete for offers in this phase
- adding review analytics or reporting

## 5. Users And Roles
- `Admin`: can access `/admin` and all admin API routes
- `User`: can browse public pages and submit reviews, but cannot access admin routes
- `Guest`: can browse public pages only

## 6. Functional Requirements
- admins must land on `/admin` after successful login
- non-admin users trying to access `/admin` must be redirected away from the admin area
- admin dashboard must support create, list, read, update, and delete for offers
- admin offer forms must generate slugs automatically from titles in the normal dashboard flow
- admin offer forms must support drag-and-drop and file picker image upload
- admin dashboard must support listing reviews, toggling review visibility, and deleting reviews
- admin dashboard must support listing users, changing roles, and activating/deactivating accounts
- admin updates must not expose or modify passwords
- the system must prevent an admin from removing their own admin dashboard access
- the system must prevent removal of the last active admin account

## 7. Proposed Design

### Affected Modules
- `offers`
  - add admin delete support
- `admin`
  - add local image upload support for offer media
- `reviews`
  - add admin review endpoints and moderation status handling
- `users`
  - add admin user endpoints and user-management rules
- `frontend`
  - add protected admin dashboard UI and admin API client helpers

### Request Flow
1. Admin signs in through the existing `/auth/email` flow.
2. Frontend auth state restores and recognizes the `admin` role.
3. Frontend sends the admin to `/admin`.
4. Admin dashboard fetches admin offers, reviews, and users with the bearer access token.
5. When an admin uploads images, the frontend sends multipart form-data to the admin upload endpoint.
6. Backend validates image count, size, and mime type, stores the files locally, and returns public URLs.
7. The dashboard includes those URLs in offer create or update payloads.
8. Backend protects each admin route with `AccessTokenGuard` and `RolesGuard`.
9. Controllers delegate to services for CRUD, upload, and moderation logic.

### Data Flow
- offer forms submit the existing offer DTO shape from the dashboard
- uploaded offer images are saved first and then included as `imageUrls`
- review moderation submits only the `status` field
- user management submits `role` and/or `isActive`
- frontend retries admin calls after token refresh when possible

### Validation Rules
- input validation:
  - use DTO validation for offer, review status, and admin user updates
  - validate uploaded image type, file size, and file count
- business validation:
  - offer delete must fail for missing records
  - review moderation only accepts known enum values
  - admin cannot remove their own admin access
  - at least one active admin must remain
- error cases:
  - `401` for invalid or expired access token
  - `403` for authenticated non-admin access
  - `404` for missing offer, review, or user targets
  - `400` for invalid admin self-lockout or last-admin changes

## 8. API Impact

### Endpoints
- `GET /api/v1/admin/ping`
- `GET /api/v1/admin/offers`
- `POST /api/v1/admin/offers`
- `GET /api/v1/admin/offers/:id`
- `PATCH /api/v1/admin/offers/:id`
- `DELETE /api/v1/admin/offers/:id`
- `POST /api/v1/admin/uploads/images`
- `GET /api/v1/admin/reviews`
- `GET /api/v1/admin/reviews/:id`
- `PATCH /api/v1/admin/reviews/:id`
- `DELETE /api/v1/admin/reviews/:id`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id`

### Auth And Access Rules
- all `/admin/*` routes require authenticated `admin` access
- frontend `/admin` route requires authenticated `admin` session state

## 9. Database Impact
- tables affected:
  - `offers`
  - `reviews`
  - `users`
- new fields:
  - none
- relationships:
  - unchanged
- indexes:
  - unchanged
- migration needed: `no`

## 10. Scalability And Operational Notes
- admin endpoints remain small and synchronous for the current platform phase
- list endpoints are unpaginated in v1 and suitable for early internal use
- uploaded images are stored on the backend server in local storage for the current phase
- future growth can add pagination and filtering without changing role protection patterns

## 11. Security Considerations
- authentication uses the existing JWT access and refresh flow
- authorization uses the existing `RolesGuard`
- admin-only operations remain isolated under `/admin/*`
- offer uploads accept only JPG, PNG, and WebP images
- user management avoids password mutation in this phase
- self-lockout and last-admin rules reduce accidental operator lockout

## 12. Testing Strategy

### Unit Tests
- offer delete success and not-found handling
- local image upload validation and stored URL generation
- review moderation list/update/delete behavior
- user role/status update rules including self-lockout protection

### Integration Tests
- admin can create, update, and delete offers
- admin can upload offer images and receive public URLs
- admin can list, hide, publish, and delete reviews
- admin can list users and change user role and active status
- non-admin users are rejected by admin upload, review, and user routes

### Manual Test Steps
1. Sign in with the seeded admin account.
2. Confirm the frontend redirects to `/admin`.
3. Upload one or more offer images through drag-and-drop or file picker.
4. Create, edit, and delete an offer from the dashboard without entering a slug.
5. Hide and republish a review from the dashboard.
6. Promote or deactivate a non-admin user from the dashboard.

## 13. Documentation Updates
- API docs: expand `docs/03-api/admin-api.md`
- Database docs: update review status notes in `docs/04-database/reviews-data-model.md`
- Workflow docs: no change
- Feature docs: add this admin dashboard tech spec
- ADR needed: `no`

## 14. Rollout Plan
- keep existing admin bootstrap env variables
- deploy backend and frontend together for the new admin UI
- verify admin login, dashboard loading, and guarded routes
- rollback by redeploying the prior frontend and backend versions together

## 15. Risks And Mitigations
- Risk:
  Unpaginated admin lists may become heavy as data grows.
  Mitigation:
  Treat this as an internal v1 and add pagination later when volumes justify it.

- Risk:
  Admins may accidentally remove important access.
  Mitigation:
  Block self-lockout and prevent removal of the last active admin.

## 16. Open Questions
- When should admin list views gain pagination and filters?
- When should review moderation gain audit history?
