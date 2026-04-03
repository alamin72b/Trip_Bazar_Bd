# Reviews API

## Overview
The reviews foundation adds:
- `POST /api/v1/offers/:offerId/reviews`
- `GET /api/v1/offers/:offerId/reviews`

Authenticated users can create reviews.

Guests and authenticated users can list published reviews for an offer.

## POST /api/v1/offers/:offerId/reviews

### Purpose
- create a published review for an existing offer

### Headers
```text
Authorization: Bearer <access-token>
```

### Request Body
```json
{
  "rating": 5,
  "comment": "The trip was well organized and worth the price."
}
```

### Success Response
```json
{
  "id": "uuid",
  "rating": 5,
  "comment": "The trip was well organized and worth the price.",
  "reviewerDisplayName": "tra***",
  "createdAt": "2026-04-03T10:00:00.000Z"
}
```

### Error Cases
- `401` for missing or invalid access token
- `404` for missing offer

## GET /api/v1/offers/:offerId/reviews

### Purpose
- list published reviews for one offer

### Success Response
Array of the same public review response shape.

### Error Cases
- `404` for missing offer

## Notes
- multiple reviews from the same user for the same offer are allowed in v1
- public responses do not expose full reviewer email or internal user identifiers
