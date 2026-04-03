# Backend Foundation Overview

## Purpose
This document describes the backend architecture baseline for TripBazarBD.

The project started with a clean NestJS foundation and now extends that foundation with the first business feature: email/password authentication.

## Current Structure
The backend lives in the `apps/backend/` folder.

This gives the repository a cleaner multi-app layout and makes it easier to add a future frontend in `apps/` without reorganizing the project later.

## Module Boundaries
- `AppModule`
  - root application module
  - wires together global configuration and foundational modules
- `DatabaseModule`
  - centralizes TypeORM configuration and entity loading
- `UsersModule`
  - owns user persistence and user lookup logic
- `AuthModule`
  - owns auth orchestration, JWT handling, refresh-token rotation, and current-user retrieval
- `AdminModule`
  - owns startup admin bootstrap and admin-only proof routes
- `OffersModule`
  - owns offer persistence, admin offer management, and public offer browsing
- `ReviewsModule`
  - owns review persistence, authenticated review submission, and public review listing
- `HealthModule`
  - first non-business module
  - provides a simple health endpoint for runtime verification
- `config`
  - central place for environment defaults and validation
- `common`
  - shared technical infrastructure such as exception filters, auth decorators, and request typing

## Bootstrap Responsibilities
Application bootstrap is responsible for:
- loading validated environment configuration
- enabling global validation
- enabling CORS
- registering a global exception filter
- exposing Swagger documentation
- applying the global API prefix
- registering bearer-auth documentation for protected routes

## API Baseline
- Root endpoint `/`
  - returns application metadata
- Health endpoint `/api/v1/health`
  - confirms the backend is running
- Auth endpoint `/api/v1/auth/email`
  - signs in existing users or creates a new account for first-time users
- Refresh endpoint `/api/v1/auth/refresh`
  - rotates refresh tokens and issues a new token pair
- Current-user endpoint `/api/v1/auth/me`
  - returns the authenticated user profile
- Admin proof endpoint `/api/v1/admin/ping`
  - verifies admin-only authorization wiring
- Admin offer routes `/api/v1/admin/offers`
  - allow authenticated admins to manage offers
- Public offer routes `/api/v1/offers`
  - expose published offers for guest and user browsing
- Offer review routes `/api/v1/offers/:offerId/reviews`
  - allow authenticated users to create reviews and public users to list reviews
- Swagger endpoint `/docs`
  - documents the current API contract

## Why This Design
- It is simple enough for a beginner to understand.
- It keeps business logic out of the bootstrap layer.
- It creates clear extension points for future modules.
- It supports backend-first development without premature frontend work.
- It keeps authentication concerns separate from user persistence so later authorization work can build on a clean base.

## Next Planned Modules

`auth`, `users`, `admin`, `offers`, and `reviews` now define the backend foundation plus the first user-generated content flow.

Future work should build on this base by adding:
- offer rating aggregation
- review moderation and admin review management
- richer offers browsing features such as filters, search, and pagination

These modules are intentionally not implemented in this phase.
