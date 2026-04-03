# TripBazarBD Backend

This application contains the backend foundation for TripBazarBD.

It is built with NestJS and currently provides the technical base for future modules such as offers, auth, reviews, and users.

## Why It Lives In `apps/backend`
- The repository is moving toward a multi-app structure.
- This makes it easier to add a future frontend inside `apps/` without another large folder reorganization.
- It stays clearer than introducing a full monorepo tool too early.

## Current Capabilities
- validated environment configuration
- global request validation
- global exception handling
- Swagger documentation
- health endpoint
- basic application metadata endpoint
- SQLite-backed user persistence through TypeORM
- email/password auth with JWT access and rotating refresh tokens
- authenticated current-user endpoint
- admin bootstrap from environment variables
- admin-only proof endpoint with role guard protection
- offer persistence with admin management and public browsing routes

## Project Setup
```bash
npm install
```

## Run The Backend
```bash
npm run start:dev
```

## Environment Setup
Create a local env file from the example if you want to override defaults:

```bash
cp .env.example .env
```

Important auth variables:
- `DATABASE_PATH`
- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRES_IN`
- `JWT_REFRESH_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Verify The Backend
- App info: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/v1/health`
- Auth email endpoint: `POST http://localhost:3000/api/v1/auth/email`
- Auth refresh endpoint: `POST http://localhost:3000/api/v1/auth/refresh`
- Current user endpoint: `GET http://localhost:3000/api/v1/auth/me`
- Admin proof endpoint: `GET http://localhost:3000/api/v1/admin/ping`
- Admin offers endpoint: `GET http://localhost:3000/api/v1/admin/offers`
- Public offers endpoint: `GET http://localhost:3000/api/v1/offers`
- Swagger docs: `http://localhost:3000/docs`

## Run Tests
```bash
npm test
npm run test:e2e
```

## Next Planned Modules
- reviews
- admin-only management flows on top of the shared users model
- richer offer browsing features such as filters and pagination
