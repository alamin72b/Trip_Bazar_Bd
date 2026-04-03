# TripBazarBD

TripBazarBD is a backend-first travel-offer platform that now includes its first public frontend foundation.

The current repository phase focuses on building a clean NestJS backend foundation before business modules such as offers, auth, reviews, and any frontend dashboard.

## Repository Structure
- `apps/backend/`
  - NestJS backend application
- `apps/frontend/`
  - Next.js public frontend application
- `docs/`
  - templates, workflows, architecture notes, and feature specs

## Current Product Foundation
The current repository now includes:
- NestJS application scaffold
- environment configuration and validation
- global validation pipe
- global exception filter
- Swagger API documentation
- health endpoint
- email/password auth with current-user restore
- public offers browsing APIs
- public reviews and authenticated review creation APIs
- Next.js public storefront for offers, WhatsApp contact, auth, and reviews

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

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 4. Start the frontend
```bash
npm run dev
```

### 5. Check the running apps
- API metadata: `http://localhost:3000/`
- Health check: `http://localhost:3000/api/v1/health`
- Swagger docs: `http://localhost:3000/docs`
- Frontend home page: `http://localhost:3001/` or the Next.js dev port shown in the terminal

### Frontend Environment
Create `apps/frontend/.env.local` if you need to point the frontend at a different backend URL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

## What Comes Next
- richer offer browsing such as filters and search
- review moderation and offer rating aggregation
- an admin-facing frontend or admin area
