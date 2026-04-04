# Offers Database Design

## Overview
The offers foundation introduces one new persistence model:
- `offers`

The first version intentionally stores image URLs directly on the offer record to keep the model simple and beginner-friendly.

In the admin dashboard, those URLs are now typically created through local backend image upload rather than manual URL entry.

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
- `expiresAt`
  - nullable timestamp for the public expiry cutoff
  - derived from admin `expiryDate` input and stored as end-of-day in server local time
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
- admin UI generates `slug` automatically from the title by default
- drafts are stored normally but hidden from public routes
- expired published offers are stored normally but hidden from public routes
- admin routes can view both drafts and published offers
- admin routes can also view expired offers for editing and audit purposes
- uploaded offer media is stored locally on the backend in v1, but the offer still stores only public image URLs

## Indexes
- unique index on `offers.slug`

## Migration Strategy
- TypeORM synchronization remains acceptable for the current project phase
- formal migrations can be added once the schema begins changing more often
