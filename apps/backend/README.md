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

## Project Setup
```bash
npm install
```

## Run The Backend
```bash
npm run start:dev
```

## Verify The Backend
- App info: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/v1/health`
- Swagger docs: `http://localhost:3000/docs`

## Run Tests
```bash
npm test
npm run test:e2e
```

## Next Planned Modules
- offers
- auth
- reviews
- users
