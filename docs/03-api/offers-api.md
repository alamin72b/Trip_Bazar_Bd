# Offers API

## Overview
The offers foundation adds:
- admin offer management endpoints under `/api/v1/admin/offers`
- public offer browsing endpoints under `/api/v1/offers`

Admin routes require a bearer token for an authenticated `admin`.

Public routes expose only `published` offers.

If a published offer has an `expiryDate`, it remains public only until the end
of that server-local day. After that moment, public list and detail routes hide
it automatically while admin routes still return it.

## Admin Offer Routes

### POST /api/v1/admin/offers
Create a new offer.

Request notes:
- `expiryDate` is optional and uses `YYYY-MM-DD`
- the backend converts `expiryDate` into `expiresAt` at `23:59:59.999` in the server timezone

### GET /api/v1/admin/offers
Return all offers, including drafts.

### GET /api/v1/admin/offers/:id
Return one offer by internal `id`.

### PATCH /api/v1/admin/offers/:id
Update an existing offer, including its status.

Request notes:
- `expiryDate` can be added, changed, or cleared with `null`

### Admin Request Notes
- `slug` is optional on create and update
- if `slug` is omitted, it is generated from the title
- image URLs are simple strings in an array
- activation and deactivation still use the existing `status` values:
  - `published` = active
  - `draft` = deactivated

## Public Offer Routes

### GET /api/v1/offers
Return only published offers that are not expired.

### GET /api/v1/offers/:slug
Return one published, non-expired offer by `slug`.

## Example Admin Create Or Update Payload
```json
{
  "title": "Cox's Bazar Weekend Escape",
  "summary": "A short beach getaway package.",
  "description": "Three days and two nights in Cox's Bazar with hotel stay included.",
  "destination": "Cox's Bazar",
  "durationNights": 2,
  "price": 12500,
  "currency": "BDT",
  "status": "published",
  "expiryDate": "2026-04-30",
  "imageUrls": [
    "https://example.com/offers/coxs-bazar-1.jpg"
  ],
  "contactWhatsApp": "+8801700000000"
}
```

## Example Public Offer Response
```json
{
  "id": "uuid",
  "title": "Cox's Bazar Weekend Escape",
  "slug": "coxs-bazar-weekend-escape",
  "summary": "A short beach getaway package.",
  "description": "Three days and two nights in Cox's Bazar with hotel stay included.",
  "destination": "Cox's Bazar",
  "durationNights": 2,
  "price": 12500,
  "currency": "BDT",
  "status": "published",
  "expiresAt": "2026-04-30T17:59:59.999Z",
  "imageUrls": [
    "https://example.com/offers/coxs-bazar-1.jpg"
  ],
  "contactWhatsApp": "+8801700000000",
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

## Error Cases
- admin routes:
  - `401` for missing or invalid access token
  - `403` for authenticated non-admin users
  - `404` for missing offer `id`
  - `400` for invalid `expiryDate` values
- public routes:
  - `404` for missing, unpublished, or expired slug
