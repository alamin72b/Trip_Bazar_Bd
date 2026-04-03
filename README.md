# TripBazarBD

TripBazarBD is a backend-first travel-offer platform.

The current repository phase focuses on building a clean NestJS backend foundation before business modules such as offers, auth, reviews, and any frontend dashboard.

## Repository Structure
- `apps/backend/`
  - NestJS backend application
- `docs/`
  - templates, workflows, architecture notes, and feature specs

## Current Backend Foundation
The backend foundation currently includes:
- NestJS application scaffold
- environment configuration and validation
- global validation pipe
- global exception filter
- Swagger API documentation
- health endpoint

## Quick Start

### 1. Install backend dependencies
```bash
cd apps/backend
npm install
```

### 2. Start the backend
```bash
npm run start:dev
```

### 3. Check the running app
- API metadata: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/v1/health`
- Swagger docs: `http://localhost:3000/docs`

## What Comes Next
- offers module
- admin auth foundation
- review and user flows
- public offer browsing APIs
- minimal frontend only after backend contracts are stable
