# Frontend Foundation Overview

## Purpose
This document describes the first frontend foundation for TripBazarBD.

It introduces a public-facing Next.js application that consumes the existing NestJS backend contracts for offers, auth, and reviews.

## Current Structure
- `apps/backend/`
  - NestJS backend
- `apps/frontend/`
  - Next.js public frontend

This keeps the repository aligned with the intended multi-app structure without introducing heavier monorepo tooling too early.

## Frontend Responsibilities
- render the public home page and offers list
- render public offer detail pages by slug
- keep WhatsApp as the primary conversion action
- provide one auth page for email/password sign-up-or-login
- restore the user session from frontend storage when possible
- allow authenticated review submission
- show public reviews for each offer

## Frontend And Backend Interaction
- public offer list:
  - frontend calls `GET /api/v1/offers`
- public offer detail:
  - frontend calls `GET /api/v1/offers/:slug`
- public reviews:
  - frontend calls `GET /api/v1/offers/:offerId/reviews`
- auth:
  - frontend calls `POST /api/v1/auth/email`
  - frontend calls `POST /api/v1/auth/refresh`
  - frontend calls `GET /api/v1/auth/me`
- authenticated review creation:
  - frontend calls `POST /api/v1/offers/:offerId/reviews`

## Rendering Approach
- public data pages use server-friendly fetching where straightforward
- interactive auth and review flows use client components
- auth state is restored on the client through stored access and refresh tokens

## Why This Design
- it matches the backend-first approach already established in the project
- it keeps guest browsing simple and fast
- it preserves WhatsApp as the conversion path instead of introducing premature booking flows
- it isolates auth-dependent interactivity to the parts that need it
- it leaves room for a future admin frontend without mixing admin concerns into the first public app
