# Backend Foundation Overview

## Purpose
This document describes the initial backend architecture for TripBazarBD.

The goal of this phase is to create a clean NestJS foundation before building business modules such as offers, auth, and reviews.

## Current Structure
The backend lives in the `apps/backend/` folder.

This gives the repository a cleaner multi-app layout and makes it easier to add a future frontend in `apps/` without reorganizing the project later.

## Module Boundaries
- `AppModule`
  - root application module
  - wires together global configuration and foundational modules
- `HealthModule`
  - first non-business module
  - provides a simple health endpoint for runtime verification
- `config`
  - central place for environment defaults and validation
- `common`
  - shared technical infrastructure such as exception filters

## Bootstrap Responsibilities
Application bootstrap is responsible for:
- loading validated environment configuration
- enabling global validation
- enabling CORS
- registering a global exception filter
- exposing Swagger documentation
- applying the global API prefix

## API Baseline
- Root endpoint `/`
  - returns application metadata
- Health endpoint `/api/v1/health`
  - confirms the backend is running
- Swagger endpoint `/docs`
  - documents the current API contract

## Why This Design
- It is simple enough for a beginner to understand.
- It keeps business logic out of the bootstrap layer.
- It creates clear extension points for future modules.
- It supports backend-first development without premature frontend work.

## Next Planned Modules
- `offers`
- `auth`
- `reviews`
- `users`

These modules are intentionally not implemented in this phase.
