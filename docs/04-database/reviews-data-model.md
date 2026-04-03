# Reviews Database Design

## Overview
The reviews foundation introduces one new persistence model:
- `reviews`

This model links authenticated users to offers they reviewed.

## Reviews Table

### Fields
- `id`
  - UUID primary key
- `offerId`
  - foreign key to `offers.id`
- `userId`
  - foreign key to `users.id`
- `rating`
  - numeric rating between `1` and `5`
- `comment`
  - review text
- `status`
  - enum value with `published` or `hidden`
- `createdAt`
  - creation timestamp
- `updatedAt`
  - update timestamp

## Notes
- multiple reviews by the same user for the same offer are allowed in v1
- public review routes do not expose `userId`
- reviewer display value is derived at the service layer, not stored as a separate database field
- admin moderation can hide a review without changing the original comment or rating payload

## Relationships
- many `reviews` belong to one `offers` record
- many `reviews` belong to one `users` record

## Migration Strategy
- TypeORM synchronization remains acceptable for the current project phase
- formal migrations can be added once schema changes become more frequent
