# Monitoring API Spec

## Liveness Probe

Endpoint : GET /api/v1/healthz

Response Status : **200 OK**

Response Body (Success) :
```
OK
```

## Health Check

Endpoint : GET /api/v1/health

Response Status : **200 OK**

Response Body (Success) :
```json
{
  "status": "healthy"
}
```

Response Body (Failed — DB Unreachable) :
```json
{
  "status": "unhealthy",
  "errors": [{"message": "dependency unavailable"}]
}
```

## Prometheus Metrics

Endpoint : GET /api/v1/metrics

Response Status : **200 OK**

Response Body (Success) :
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/v1/contacts",status="200"} 150

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/v1/contacts",status="200"} 120
```

### Available Metrics

| Metric | Type | Deskripsi |
|--------|------|-----------|
| `http_requests_total` | Counter | Total request dengan label method, route, status |
| `http_request_duration_seconds` | Histogram | Durasi request dalam seconds |
| `process_resident_memory_bytes` | Gauge | Memori yang digunakan proses |
| `nodejs_eventloop_lag_seconds` | Summary | Event loop lag |
