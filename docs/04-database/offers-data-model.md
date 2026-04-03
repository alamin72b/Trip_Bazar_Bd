# Offers Database Design

## Overview
The offers foundation introduces one new persistence model:
- `offers`

The first version intentionally stores image URLs directly on the offer record to keep the model simple and beginner-friendly.

## Offers Table

### Fields
- `id`
  - UUID primary key
- `title`
  - offer title
- `slug`
  - unique public identifier used in public routes
- `summary`
  - short user-facing summary
- `description`
  - fuller offer description
- `destination`
  - destination label
- `durationNights`
  - positive number of nights
- `price`
  - numeric offer price
- `currency`
  - currency code such as `BDT`
- `status`
  - enum value: `draft` or `published`
- `imageUrls`
  - simple JSON array of image URL strings
- `contactWhatsApp`
  - WhatsApp number or link for contact
- `createdAt`
  - creation timestamp
- `updatedAt`
  - update timestamp

## Notes
- public detail uses `slug`, not internal `id`
- drafts are stored normally but hidden from public routes
- admin routes can view both drafts and published offers
- admin list supports filtering by `status` and text search over `title`, `destination`, `summary`, and `slug`
- admin list supports pagination with `page` and `limit`
- deleting an offer is a hard delete
- related reviews are removed by the existing `reviews.offerId -> offers.id` cascade

## Indexes
- unique index on `offers.slug`

## Migration Strategy
- TypeORM synchronization remains acceptable for the current project phase
- formal migrations can be added once the schema begins changing more often
