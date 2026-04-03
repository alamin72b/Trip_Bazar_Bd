# TripBazarBD Frontend

This app is the first public frontend for TripBazarBD.

It focuses on:
- public offer browsing
- WhatsApp-first conversion
- user authentication for reviews
- authenticated review submission

## Environment

Create a local env file if needed:

```bash
cp .env.example .env.local
```

Recommended variables:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1`

## Run

```bash
node -v
```

Use Node 22 LTS for local development. The app is tested against the current Next.js 15 toolchain on Node 20.9 through Node 22, and Node 24 may crash during `next dev` or `next build` on some Linux setups.

```bash
npm install
npm run dev
```

The app expects the NestJS backend to be running locally.
