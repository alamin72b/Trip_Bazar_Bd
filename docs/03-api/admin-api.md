# Admin API

## Overview
The admin authorization foundation adds one proof endpoint:
- `GET /api/v1/admin/ping`

This endpoint exists to verify that bearer authentication and admin role authorization are wired correctly before larger admin modules are built.

## GET /api/v1/admin/ping

### Purpose
- verify that the caller is authenticated
- verify that the caller has the `admin` role

### Headers
```text
Authorization: Bearer <access-token>
```

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

## Admin Seed Notes
- first admin creation is controlled through startup environment variables
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not public API inputs
- if the admin email already exists, startup seed logic does not overwrite the account automatically
