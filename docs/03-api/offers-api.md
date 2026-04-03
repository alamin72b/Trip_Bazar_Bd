# Offers API

## Overview
The offers foundation adds:
- admin offer management endpoints under `/api/v1/admin/offers`
- public offer browsing endpoints under `/api/v1/offers`

Admin routes require a bearer token for an authenticated `admin`.

Public routes expose only `published` offers.

## Admin Offer Routes

### POST /api/v1/admin/offers
Create a new offer.

### GET /api/v1/admin/offers
Return a paginated list of offers, including drafts.

### Admin List Query Parameters
- `status`
  - optional
  - allowed values: `draft`, `published`
- `search`
  - optional free-text search over `title`, `destination`, `summary`, and `slug`
- `page`
  - optional
  - default: `1`
- `limit`
  - optional
  - default: `10`
  - maximum: `50`

### Example Admin List Response
```json
{
  "items": [
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
      "imageUrls": [
        "https://example.com/offers/coxs-bazar-1.jpg"
      ],
      "contactWhatsApp": "+8801700000000",
      "createdAt": "2026-04-03T10:00:00.000Z",
      "updatedAt": "2026-04-03T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### GET /api/v1/admin/offers/:id
Return one offer by internal `id`.

### PATCH /api/v1/admin/offers/:id
Update an existing offer, including its status.

### DELETE /api/v1/admin/offers/:id
Permanently delete an offer by internal `id`.

### Admin Request Notes
- `slug` is optional on create and update
- if `slug` is omitted, it is generated from the title
- image URLs are simple strings in an array
- delete is a hard delete
- deleting an offer also removes dependent reviews through the existing database cascade

## Public Offer Routes

### GET /api/v1/offers
Return only published offers.

### GET /api/v1/offers/:slug
Return one published offer by `slug`.

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
  - `204` for successful delete with no response body
- public routes:
  - `404` for missing or unpublished slug
