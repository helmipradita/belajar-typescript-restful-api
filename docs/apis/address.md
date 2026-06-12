# Address API Spec

> **Catatan:** Parameter `:contactId` dan `:addressId` hanya menerima nilai numerik (angka). Request dengan parameter non-numerik akan menghasilkan 404.

## Create Address

Endpoint : POST /api/v1/contacts/:contactId/addresses

Response Status : **201 Created**

Request Header :
- Authorization: Bearer \<jwt-token\>

Request Body :
```json
{
  "street" : "Jalan Apa",
  "city" : "Kota Apa",
  "province" : "Provinsi Apa",
  "country" : "Negara Apa",
  "postal_code" : "23123"
}
```

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "street" : "Jalan Apa",
    "city" : "Kota Apa",
    "province" : "Provinsi Apa",
    "country" : "Negara Apa",
    "postal_code" : "23123"
  }
}
```

Response Body (Failed — Validation) :
```json
{
  "errors" : [{"path": "postal_code", "message": "Required"}]
}
```

Response Body (Failed — Contact Not Found) :
```json
{
  "errors" : [{"message": "Contact not found"}]
}
```

## Get Address

Endpoint : GET /api/v1/contacts/:contactId/addresses/:addressId

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "street" : "Jalan Apa",
    "city" : "Kota Apa",
    "province" : "Provinsi Apa",
    "country" : "Negara Apa",
    "postal_code" : "23123"
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Address is not found"}]
}
```

## Update Address

Endpoint : PUT /api/v1/contacts/:contactId/addresses/:addressId

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Request Body :
```json
{
  "street" : "Jalan Apa",
  "city" : "Kota Apa",
  "province" : "Provinsi Apa",
  "country" : "Negara Apa",
  "postal_code" : "23123"
}
```

Response Body (Success) :
```json
{
  "data" : {
    "id" : 1,
    "street" : "Jalan Apa",
    "city" : "Kota Apa",
    "province" : "Provinsi Apa",
    "country" : "Negara Apa",
    "postal_code" : "23123"
  }
}
```

## Remove Address

Endpoint : DELETE /api/v1/contacts/:contactId/addresses/:addressId

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
  "errors" : [{"message": "Address is not found"}]
}
```

## List Address

Endpoint : GET /api/v1/contacts/:contactId/addresses?page=1&size=10

Response Status : **200 OK**

Request Header :
- Authorization: Bearer \<jwt-token\>

Query Parameter :
- page : number, default 1
- size : number, default 10

Response Body (Success) :
```json
{
  "data" : [
    {
      "id" : 1,
      "street" : "Jalan Apa",
      "city" : "Kota Apa",
      "province" : "Provinsi Apa",
      "country" : "Negara Apa",
      "postal_code" : "23123"
    }
  ],
  "paging" : {
    "current_page" : 1,
    "total_page" : 1,
    "size" : 10
  }
}
```

Response Body (Failed) :
```json
{
  "errors" : [{"message": "Contact not found"}]
}
```
