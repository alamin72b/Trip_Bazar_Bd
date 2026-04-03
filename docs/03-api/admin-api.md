# Admin API

## Overview
The admin dashboard foundation exposes protected admin endpoints for:
- admin proof
- offer management
- review moderation
- user management

All endpoints in this document require:

```text
Authorization: Bearer <access-token>
```

The caller must also have the `admin` role.

## GET /api/v1/admin/ping

### Purpose
- verify that the caller is authenticated
- verify that the caller has the `admin` role

### Success Response
```json
{
  "message": "Admin access confirmed.",
  "role": "admin"
}
```

### Error Cases
- `401` for missing or invalid access token
- `403` for authenticated users without the `admin` role

## Admin Offers

### GET /api/v1/admin/offers
- list all offers, including drafts and published offers

### POST /api/v1/admin/offers
- create a new offer using the same DTO shape as the backend offer module

### GET /api/v1/admin/offers/:id
- fetch one offer by internal ID

### PATCH /api/v1/admin/offers/:id
- update one offer by internal ID

### DELETE /api/v1/admin/offers/:id
- delete one offer permanently
- success response: `204 No Content`

## Admin Reviews

### GET /api/v1/admin/reviews
- list all reviews with internal moderation context
- response fields include:
  - `id`
  - `offerId`
  - `offerTitle`
  - `userId`
  - `userEmail`
  - `rating`
  - `comment`
  - `status`
  - `createdAt`
  - `updatedAt`

### GET /api/v1/admin/reviews/:id
- fetch one review by internal ID

### PATCH /api/v1/admin/reviews/:id
- update review moderation status

Example body:
```json
{
  "status": "hidden"
}
```

Allowed status values:
- `published`
- `hidden`

### DELETE /api/v1/admin/reviews/:id
- delete one review permanently
- success response: `204 No Content`

## Admin Users

### GET /api/v1/admin/users
- list all users

### GET /api/v1/admin/users/:id
- fetch one user by internal ID

### PATCH /api/v1/admin/users/:id
- update user role and/or active status

Example body:
```json
{
  "role": "admin",
  "isActive": false
}
```

Notes:
- password updates are not supported here
- admins cannot remove their own dashboard access
- the last active admin cannot be deactivated or demoted

## Admin Seed Notes
- first admin creation is controlled through startup environment variables
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not public API inputs
- if the admin email already exists, startup seed logic does not overwrite the account automatically

## Shared Error Cases
- `401` for missing or invalid access token
- `403` for authenticated users without the `admin` role
- `404` for missing target records on detail, update, or delete routes
- `400` for invalid admin self-lockout or last-admin update attempts
