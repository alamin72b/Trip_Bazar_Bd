# Auth Foundation Database Design

## Overview
The auth foundation introduces two persistence models:
- `users`
- `refresh_token_records`

The first backend version uses SQLite through TypeORM to keep local development and testing simple.

Business logic stays inside services so the persistence layer can be replaced later if TripBazarBD moves to PostgreSQL.

## Users Table

### Fields
- `id`
  - UUID primary key
- `email`
  - unique normalized email
- `passwordHash`
  - `argon2` hash of the user password
- `role`
  - enum value: `user` or `admin`
- `isActive`
  - boolean flag for account availability
- `createdAt`
  - creation timestamp
- `updatedAt`
  - update timestamp

### Notes
- email is always stored in lowercase
- default role is `user`
- admin records are not self-created from the public auth endpoint

## Refresh Token Records Table

### Fields
- `id`
  - UUID primary key
- `userId`
  - foreign key to `users.id`
- `tokenId`
  - unique token identifier from the refresh JWT payload
- `tokenHash`
  - SHA-256 hash of the refresh token string
- `expiresAt`
  - token expiry timestamp
- `revokedAt`
  - nullable timestamp set after token rotation or revocation
- `createdAt`
  - creation timestamp
- `updatedAt`
  - update timestamp

### Notes
- raw refresh tokens are never stored
- refresh token rotation invalidates the previous refresh-token record before issuing a new one
- the table supports future audit and revoke flows

## Relationship
- one `users` record can have many `refresh_token_records`

## Indexes
- unique index on `users.email`
- unique index on `refresh_token_records.tokenId`

## Migration Strategy
- TypeORM synchronization is acceptable for this early phase
- formal migrations should be added once schema changes become more frequent or production promotion begins
