# Technical Specification: Frontend Foundation

## 1. Summary
This feature adds the first frontend foundation for TripBazarBD using Next.js.

It creates the initial public customer experience on top of the existing backend contracts for offers, auth, and reviews.

## 2. Scope

### In Scope
- Next.js frontend scaffold inside `apps/frontend/`
- public home page
- public offers list page
- public offer detail page by slug
- WhatsApp-first conversion UI
- one auth page for email/password sign-up-or-login
- authenticated review submission
- public review listing on offer detail pages
- shared frontend API helpers and auth session handling
- frontend run instructions and architecture documentation

### Out of Scope
- admin dashboard
- offer search, filters, and pagination
- booking engine integration
- review moderation UI
- user profile management UI

## 3. Goals
- create a public-facing frontend that matches the backend contracts already in place
- let guests browse offers and reviews without login
- let authenticated users submit reviews
- keep WhatsApp as the direct lead path
- keep the frontend foundation simple enough for future public and admin expansion

## 4. Non-Goals
- building the final long-term design system
- introducing complex state management
- adding admin-only screens in this phase

## 5. Users And Roles
- `Guest`: can browse offers and reviews
- `User`: can browse offers and reviews and submit reviews after authentication
- `Admin`: uses the same public frontend in this phase; no special admin UI is added yet

## 6. Functional Requirements
- the frontend must render published offers from the backend
- the frontend must render public offer detail pages by slug
- the frontend must surface WhatsApp contact actions prominently
- the frontend must allow users to sign up or sign in through the shared email endpoint
- the frontend must restore auth state on reload when tokens are still valid
- the frontend must attempt token refresh before dropping the session
- guests must be prevented from submitting reviews
- authenticated users must be able to submit reviews on an offer detail page
- public review lists must remain visible to guests and users

## 7. Proposed Design

### Affected Apps And Modules
- `apps/frontend`
  - App Router pages
  - shared client-side auth provider
  - typed API helper layer
- `apps/backend`
  - reused as-is through existing public and auth endpoints

### Request Flow
1. A guest opens the home page or offers pages.
2. The frontend fetches public offer data from the backend.
3. If the user signs in, the auth page calls the shared email endpoint.
4. Tokens are stored in frontend storage and the current session is restored with `/auth/me`.
5. On offer detail pages, public reviews are fetched for all users.
6. Authenticated users submit reviews through the protected reviews endpoint.

### Data Flow
- public pages use offer and review DTO shapes directly from the backend
- auth responses provide access token, refresh token, and user profile
- session data is stored client-side for v1
- review submission uses the current access token and retries after refresh if needed

### Validation Rules
- auth form requires email and password
- review form requires rating and comment before submit
- unauthorized review attempts must route the user toward authentication
- API failures should render clear UI messages instead of blank pages

## 8. API Impact

### Reused Endpoints
- `GET /api/v1/offers`
- `GET /api/v1/offers/:slug`
- `GET /api/v1/offers/:offerId/reviews`
- `POST /api/v1/offers/:offerId/reviews`
- `POST /api/v1/auth/email`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### Auth And Access Rules
- public browsing routes remain open to guests
- review creation remains authenticated-only
- no backend contract changes are required in this phase

## 9. Database Impact
- no database changes in this phase

## 10. Scalability And Operational Notes
- the app structure leaves room for a later admin area under the same frontend or a separate app
- the API helper layer keeps backend integration centralized
- public pages can later adopt richer data fetching strategies without changing the route structure

## 11. Security Considerations
- bearer tokens are required only for review creation and current-user restore
- the frontend should clear session data when refresh fails
- public routes must not expose admin-only controls

## 12. Testing Strategy

### Frontend Checks
- lint the frontend app
- build the frontend app

### Integration Scenarios
- guest can load home, offers list, and offer detail
- guest can read reviews but cannot submit one
- user can authenticate and then submit a review
- auth session restores correctly after reload
- expired sessions fall back to logged-out state

### Manual Test Steps
1. Start the backend in `apps/backend/`
2. Start the frontend in `apps/frontend/`
3. Open the home page and confirm offers load
4. Open an offer detail page and confirm WhatsApp CTA and reviews render
5. Sign in on `/auth`
6. Return to an offer detail page and submit a review

## 13. Documentation Updates
- root README updated with frontend instructions
- frontend architecture overview added
- frontend technical spec added
- ADR needed: `no`

## 14. Rollout Plan
- add the frontend app scaffold
- wire public pages to backend contracts
- add auth session handling and review submission
- run frontend checks and backend tests

## 15. Risks And Mitigations
- Risk:
  Backend API availability may block frontend development.
  Mitigation:
  Keep API access centralized and show clear UI fallback states.

- Risk:
  Client-side token storage is simpler but not the final long-term auth approach.
  Mitigation:
  Keep auth logic isolated so a later cookie-based approach can replace it.

## 16. Open Questions
- When should public filtering and search be added?
- Should the future admin experience live in the same app or a dedicated frontend app?
