# Contact API Spec

## Create Contact

Endpoint : POST /api/v1/contacts

Response Status : **201 Created**

Request Header :
- Authorization: Bearer \<jwt-token\>

Request Body :
```json
{
  "first_name" : "Eko Kurniawan",
  "last_name" : "Khannedy",
  "email" : "eko@example.com",
  "phone" : "089999999"
}
```

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "first_name" : "Eko Kurniawan",
    "last_name" : "Khannedy",
    "email" : "eko@example.com",
    "phone" : "089999999"
  }
}
```

Response Body (Failed — Validation) :
```json
{
  "errors" : [{"path": "first_name", "message": "String must contain at least 1 character(s)"}]
}
```

## Get Contact

Endpoint : GET /api/v1/contacts/:id

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "first_name" : "Eko Kurniawan",
    "last_name" : "Khannedy",
    "email" : "eko@example.com",
    "phone" : "089999999"
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Contact not found"}]
}
```

## Update Contact

Endpoint : PUT /api/v1/contacts/:id

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Request Body :
```json
{
  "first_name" : "Eko Kurniawan",
  "last_name" : "Khannedy",
  "email" : "eko@example.com",
  "phone" : "089999999"
}
```

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "first_name" : "Eko Kurniawan",
    "last_name" : "Khannedy",
    "email" : "eko@example.com",
    "phone" : "089999999"
  }
}
```

## Remove Contact

Endpoint : DELETE /api/v1/contacts/:id

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
  "errors" : [{"message": "Contact not found"}]
}
```

## Search Contact

Endpoint : GET /api/v1/contacts

Response Status : **200 OK**

Query Parameter :
- name : string, optional
- phone : string, optional
- email : string, optional
- page : number, default 1
- size : number, default 10

Request Header :
- Authorization: Bearer \<jwt-token\>

Response Body (Success) :
```json
{
  "data" : [
    {
      "id" : 1,
      "first_name" : "Eko Kurniawan",
      "last_name" : "Khannedy",
      "email" : "eko@example.com",
      "phone" : "089999999"
    }
  ],
  "paging" : {
    "current_page" : 1,
    "total_page" : 10,
    "size" : 10
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Unauthorized"}]
}
```
