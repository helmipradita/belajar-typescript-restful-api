# API Documentation

Complete RESTful API specification for Contact Management.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require `X-API-TOKEN` header:

```
X-API-TOKEN: <your_token>
```

---

## User API

### Register User

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "khannedy",
  "password": "rahasia",
  "name": "Eko Khannedy"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy"
  }
}
```

**Response (Failed - 400):**
```json
{
  "errors": "Username must not blank, ..."
}
```

---

### Login User

**Endpoint:** `POST /api/users/login`

**Request Body:**
```json
{
  "username": "khannedy",
  "password": "rahasia"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy",
    "token": "uuid-token-here"
  }
}
```

**Response (Failed - 401):**
```json
{
  "errors": "Username or password wrong"
}
```

---

### Get Current User

**Endpoint:** `GET /api/users/current`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": {
    "username": "khannedy",
    "name": "Eko Khannedy"
  }
}
```

**Response (Failed - 401):**
```json
{
  "errors": "Unauthorized"
}
```

---

### Update Current User

**Endpoint:** `PATCH /api/users/current`

**Headers:**
```
X-API-TOKEN: <token>
```

**Request Body:**
```json
{
  "password": "new_password",  // optional
  "name": "New Name"            // optional
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "username": "khannedy",
    "name": "New Name"
  }
}
```

**Response (Failed - 401):**
```json
{
  "errors": "Unauthorized"
}
```

---

### Logout User

**Endpoint:** `DELETE /api/users/current`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": "OK"
}
```

**Response (Failed - 401):**
```json
{
  "errors": "Unauthorized"
}
```

---

## Contact API

### Create Contact

**Endpoint:** `POST /api/contacts`

**Headers:**
```
X-API-TOKEN: <token>
```

**Request Body:**
```json
{
  "first_name": "Eko Kurniawan",
  "last_name": "Khannedy",
  "email": "eko@example.com",
  "phone": "089999999"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "contact-id",
    "first_name": "Eko Kurniawan",
    "last_name": "Khannedy",
    "email": "eko@example.com",
    "phone": "089999999"
  }
}
```

**Response (Failed - 400):**
```json
{
  "errors": "first_name must not blank, ..."
}
```

---

### Get Contact

**Endpoint:** `GET /api/contacts/:id`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "contact-id",
    "first_name": "Eko Kurniawan",
    "last_name": "Khannedy",
    "email": "eko@example.com",
    "phone": "089999999"
  }
}
```

**Response (Failed - 404):**
```json
{
  "errors": "Contact is not found"
}
```

---

### Update Contact

**Endpoint:** `PUT /api/contacts/:id`

**Headers:**
```
X-API-TOKEN: <token>
```

**Request Body:**
```json
{
  "first_name": "Eko Kurniawan",
  "last_name": "Khannedy",
  "email": "eko@example.com",
  "phone": "089999999"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "contact-id",
    "first_name": "Eko Kurniawan",
    "last_name": "Khannedy",
    "email": "eko@example.com",
    "phone": "089999999"
  }
}
```

**Response (Failed - 400):**
```json
{
  "errors": "first_name must not blank, ..."
}
```

---

### Delete Contact

**Endpoint:** `DELETE /api/contacts/:id`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": "OK"
}
```

**Response (Failed - 404):**
```json
{
  "errors": "Contact is not found"
}
```

---

### Search Contacts

**Endpoint:** `GET /api/contacts`

**Headers:**
```
X-API-TOKEN: <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by first or last name (optional) |
| `phone` | string | Filter by phone (optional) |
| `email` | string | Filter by email (optional) |
| `page` | number | Page number (default: 1) |
| `size` | number | Items per page (default: 10) |

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "contact-id-1",
      "first_name": "Eko Kurniawan",
      "last_name": "Khannedy",
      "email": "eko@example.com",
      "phone": "089999999"
    },
    {
      "id": "contact-id-2",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane@example.com",
      "phone": "088888888"
    }
  ],
  "paging": {
    "current_page": 1,
    "total_page": 10,
    "size": 10
  }
}
```

**Response (Failed - 401):**
```json
{
  "errors": "Unauthorized"
}
```

---

## Address API

### Create Address

**Endpoint:** `POST /api/contacts/:contactId/addresses`

**Headers:**
```
X-API-TOKEN: <token>
```

**Request Body:**
```json
{
  "street": "Jalan Apa",
  "city": "Kota Apa",
  "province": "Provinsi Apa",
  "country": "Negara Apa",
  "postal_code": "23123"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "address-id",
    "street": "Jalan Apa",
    "city": "Kota Apa",
    "province": "Provinsi Apa",
    "country": "Negara Apa",
    "postal_code": "23123"
  }
}
```

**Response (Failed - 400):**
```json
{
  "errors": "postal_code is required"
}
```

---

### Get Address

**Endpoint:** `GET /api/contacts/:contactId/addresses/:addressId`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "address-id",
    "street": "Jalan Apa",
    "city": "Kota Apa",
    "province": "Provinsi Apa",
    "country": "Negara Apa",
    "postal_code": "23123"
  }
}
```

**Response (Failed - 404):**
```json
{
  "errors": "Address is not found"
}
```

---

### Update Address

**Endpoint:** `PUT /api/contacts/:contactId/addresses/:addressId`

**Headers:**
```
X-API-TOKEN: <token>
```

**Request Body:**
```json
{
  "street": "Jalan Baru",
  "city": "Kota Baru",
  "province": "Provinsi Baru",
  "country": "Negara Baru",
  "postal_code": "54321"
}
```

**Response (Success - 200):**
```json
{
  "data": {
    "id": "address-id",
    "street": "Jalan Baru",
    "city": "Kota Baru",
    "province": "Provinsi Baru",
    "country": "Negara Baru",
    "postal_code": "54321"
  }
}
```

**Response (Failed - 400):**
```json
{
  "errors": "postal_code is required"
}
```

---

### Remove Address

**Endpoint:** `DELETE /api/contacts/:contactId/addresses/:addressId`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": "OK"
}
```

**Response (Failed - 404):**
```json
{
  "errors": "Address is not found"
}
```

---

### List Addresses

**Endpoint:** `GET /api/contacts/:contactId/addresses`

**Headers:**
```
X-API-TOKEN: <token>
```

**Response (Success - 200):**
```json
{
  "data": [
    {
      "id": "address-id-1",
      "street": "Jalan Apa",
      "city": "Kota Apa",
      "province": "Provinsi Apa",
      "country": "Negara Apa",
      "postal_code": "23123"
    },
    {
      "id": "address-id-2",
      "street": "Jalan Dua",
      "city": "Kota Dua",
      "province": "Provinsi Dua",
      "country": "Negara Dua",
      "postal_code": "54321"
    }
  ]
}
```

**Response (Failed - 404):**
```json
{
  "errors": "Contact is not found"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "errors": "Error message description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
