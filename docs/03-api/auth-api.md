# Auth API

## Overview
The auth foundation introduces three endpoints:
- `POST /api/v1/auth/email`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

The v1 design intentionally uses one email/password entrypoint for both signup and login.

Internally, registration logic and login logic remain separate so the API can be split later if needed.

## POST /api/v1/auth/email

### Purpose
- create a new user when the email does not exist
- log in an existing user when the password matches

### Request Body
```json
{
  "email": "traveler@example.com",
  "password": "strong-password-123"
}
```

### Success Response
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "traveler@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2026-04-03T10:00:00.000Z",
    "updatedAt": "2026-04-03T10:00:00.000Z"
  }
}
```

### Error Cases
- `400` for invalid request shape
- `401` for an existing user with the wrong password

## POST /api/v1/auth/refresh

### Purpose
- validate the submitted refresh token
- rotate the refresh token
- return a new access token and refresh token

### Request Body
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### Success Response
Same shape as `POST /api/v1/auth/email`.

### Error Cases
- `400` for invalid request shape
- `401` for expired, invalid, or revoked refresh tokens

## GET /api/v1/auth/me

### Purpose
- return the authenticated user profile for the bearer access token

### Headers
```text
Authorization: Bearer <access-token>
```

### Success Response
```json
{
  "id": "uuid",
  "email": "traveler@example.com",
  "role": "user",
  "isActive": true,
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

### Error Cases
- `401` for missing or invalid access tokens

## Notes
- email addresses are normalized to lowercase before lookup and storage
- `passwordHash` is never returned
- newly created accounts default to role `user`
- admin account creation is not part of this flow
- admin-only route protection is documented separately in `docs/03-api/admin-api.md`
