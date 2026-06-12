# User API Spec

## Register User

Endpoint : POST /api/v1/users

Response Status : **201 Created**

Request Body :
```json
{
  "username" : "khannedy",
  "password" : "rahasia",
  "name" : "Eko Khannedy"
}
```

Response Body (Success) :
```json
{
  "data" : {
    "username" : "khannedy",
    "name" : "Eko Khannedy"
  }
}
```

Response Body (Failed — Validation Error) :
```json
{
  "errors" : [{"path": "username", "message": "String must contain at least 1 character(s)"}]
}
```

Response Body (Failed — Duplicate) :
```json
{
  "errors" : [{"message": "Username already exists"}]
}
```

## Login User

Endpoint : POST /api/v1/users/login

Response Status : **200 OK**

Request Body :
```json
{
  "username" : "khannedy",
  "password" : "rahasia"
}
```

Response Body (Success) :
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs... (JWT)",
    "refresh_token": "uuid"
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Username or password is wrong"}]
}
```

## Refresh Token

Endpoint : POST /api/v1/users/refresh

Response Status : **200 OK**

Request Body :
```json
{
  "refresh_token" : "uuid-dari-login"
}
```

Response Body (Success) :
```json
{
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-uuid"
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Invalid refresh token"}]
}
```

## Get User

Endpoint : GET /api/v1/users/current

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>
- X-API-TOKEN : token (fallback)

Response Body (Success) :
```json
{
  "data" : {
    "username" : "khannedy",
    "name" : "Eko Khannedy"
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Unauthorized"}]
}
```

## Update User

Endpoint : PATCH /api/v1/users/current

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Request Body :
```json
{
  "password" : "rahasia",    // tidak wajib
  "name" : "Eko Khannedy"    // tidak wajib
}
```

Response Body (Success) :
```json
{
  "data" : {
    "username" : "khannedy",
    "name" : "Eko Khannedy"
  }
}
```

Response Body (Failed — Validation) :
```json
{
  "errors" : [{"path": "name", "message": "String must contain at least 1 character(s)"}]
}
```

## Logout User

Endpoint : DELETE /api/v1/users/current

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Response Body (Success) :
```json
{
  "data" : "OK"
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Unauthorized"}]
}
```
