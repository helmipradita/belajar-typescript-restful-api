# Monitoring Stack

Dokumentasi ini menjelaskan arsitektur monitoring stack, alur data metrics, dan konfigurasi persistent storage untuk semua service.

## Arsitektur Monitoring Stack

```mermaid
graph TB
    subgraph Express App
        MW[Metrics Middleware]
        MM[metrics.ts]
        RL[Request Logger]
    end

    subgraph Data Collection
        P[Prometheus<br/>port 9090]
        L[Loki<br/>port 3100]
        T[Tempo<br/>port 3200]
    end

    subgraph Instrumentation
        AL[Alloy<br/>OTel Collector<br/>port 12345]
    end

    subgraph Visualization
        GF[Grafana<br/>port 4000]
    end

    subgraph Load Testing
        K6[k6 Load Test]
    end

    MW -->|/api/v1/metrics<br/>pull scrape| P
    RL -->|stdout logs<br/>push via Loki API| AL
    AL -->|forward logs| L
    AL -->|forward traces OTLP| T

    P -->|query PromQL| GF
    L -->|query LogQL| GF
    T -->|query TraceQL| GF

    K6 -->|HTTP requests<br/>port 3000| MW

    style P fill:#e85d4a,color:#fff
    style L fill:#f5a623,color:#fff
    style T fill:#4caf50,color:#fff
    style GF fill:#f47b20,color:#fff
    style AL fill:#f0c040,color:#333
    style K6 fill:#7b68ee,color:#fff
```

## Alur Data Metrics

```mermaid
sequenceDiagram
    participant Client as Client / k6
    participant Express as Express API
    participant MW as Metrics Middleware
    participant Prom as Prometheus
    participant Grafana as Grafana Dashboard

    Client->>Express: HTTP Request
    Express->>MW: request masuk middleware
    MW->>MW: catat method, route, status, duration
    MW->>MW: increment http_requests_total
    MW->>MW: observe http_request_duration_seconds
    MW-->>Express: lanjut ke handler
    Express-->>Client: HTTP Response

    Note over Prom: Setiap 15 detik (scrape_interval)
    Prom->>Express: GET /api/v1/metrics
    Express-->>Prom: expose semua metrics

    Note over Prom: Simpan time-series data<br/>ke persistent volume

    Note over Grafana: Dashboard merefresh
    Grafana->>Prom: Query PromQL<br/>sum(rate(http_requests_total[1m]))
    Prom-->>Grafana: hasil query
    Grafana->>Grafana: render chart
```

## Persistent Storage

```mermaid
graph LR
    subgraph Docker Named Volumes
        V1["prometheus-data<br/>/prometheus"]
        V2["grafana-data<br/>/var/lib/grafana"]
        V3["loki-data<br/>/tmp/loki"]
        V4["tempo-data<br/>/tmp/tempo"]
        V5["mysql-data<br/>/var/lib/mysql"]
    end

    subgraph Containers
        C1[Prometheus]
        C2[Grafana]
        C3[Loki]
        C4[Tempo]
        C5[MySQL]
    end

    C1 ---|mount| V1
    C2 ---|mount| V2
    C3 ---|mount| V3
    C4 ---|mount| V4
    C5 ---|mount| V5

    style V1 fill:#e85d4a,color:#fff
    style V2 fill:#f47b20,color:#fff
    style V3 fill:#f5a623,color:#fff
    style V4 fill:#4caf50,color:#fff
    style V5 fill:#4479a1,color:#fff
```

### Detail Volume

| Service | Volume Name | Mount Path | Isi Data | Persistent |
|---------|------------|------------|----------|-----------|
| MySQL | `typescript-restful-api-mysql-data` | `/var/lib/mysql` | Database tables, user data | Ya |
| Prometheus | `prometheus-data` | `/prometheus` | Time-series metrics (15 hari retention) | Ya |
| Grafana | `grafana-data` | `/var/lib/grafana` | Dashboard config, users, annotations | Ya |
| Loki | `loki-data` | `/tmp/loki` | Log entries, indexes | Ya |
| Tempo | `tempo-data` | `/tmp/tempo` | Distributed traces | Ya |

### Service Tanpa Volume Persistent

| Service | Alasan |
|---------|--------|
| Alloy | Collector/forwarder, tidak menyimpan data sendiri |
| k6 (all profiles) | Ephemeral load test runner, tidak butuh persistence |
| rest-api | App stateless, data di MySQL |

## Sumber Data Metrics

### RPS (Requests Per Second)

```
Metric:    http_requests_total
Tipe:      Counter
Sumber:    src/middleware/metrics-middleware.ts
Query:     sum(rate(http_requests_total[1m]))
```

Setiap request masuk, counter naik dengan label `method`, `route`, `status`.

### Latency (P95, P99)

```
Metric:    http_request_duration_seconds_bucket
Tipe:      Histogram
Sumber:    src/middleware/metrics-middleware.ts
Query:     histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

Durasi setiap request dicatat dalam histogram bucket.

### Memory & Event Loop

```
Metric:    process_resident_memory_bytes
           nodejs_eventloop_lag_mean_seconds
           nodejs_eventloop_lag_p99_seconds
Tipe:      Gauge / Summary
Sumber:    src/app/metrics.ts (collectDefaultMetrics)
```

Default metrics dari `prom-client` yang expose Node.js runtime metrics.

## Retention

| Service | Retention | Config |
|---------|----------|--------|
| Prometheus | 15 hari | `--storage.tsdb.retention.time=15d` |
| Loki | Default (bisa diubah di loki-config.yml) | `table_manager` |
| Tempo | Default (bisa diubah di tempo.yml) | `compactor` |

## Cara Menjalankan

```bash
# Start semua service
docker compose up -d

# Jalankan k6 test (pilih salah satu)
docker compose --profile k6 run --rm k6-load-test
docker compose --profile k6 run --rm k6-error-test
docker compose --profile k6 run --rm k6-functional-test

# Cek volume
docker volume ls | grep typescript-restful-api

# Cek data Prometheus
docker exec typescript-restful-api-prometheus ls -la /prometheus/
```

## Port Mapping

| Service | Host Port | Container Port | URL |
|---------|----------|---------------|-----|
| Express API | 3030 | 3000 | http://localhost:3030 |
| Prometheus | 9090 | 9090 | http://localhost:9090 |
| Grafana | 4000 | 3000 | http://localhost:4000 |
| Loki | 3100 | 3100 | http://localhost:3100 |
| Tempo | 3200 | 3200 | http://localhost:3200 |
| Alloy | 12345 | 12345 | http://localhost:12345 |
| MySQL | 3306 | 3306 | localhost:3306 |
