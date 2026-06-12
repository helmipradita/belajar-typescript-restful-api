# Port Mapping Summary

| Service | Host Port | Container Port | Protocol | Source Config |
|---|---|---|---|---|
| **MySQL** | `3306` | `3306` | TCP | `docker-compose.yaml:10` |
| **Express API** | `3030` | `3000` | TCP | `docker-compose.yaml:30`, `src/main.ts:4` |
| **Prometheus** | `9090` | `9090` | TCP | `docker-compose.yaml:41` |
| **Grafana** | `4000` | `3000` | TCP | `docker-compose.yaml:60` |
| **Loki** | `3100` | `3100` | TCP | `docker-compose.yaml:79` |
| **Tempo** | `3200` | `3200` | TCP | `docker-compose.yaml:130` |
| **Tempo (gRPC OTLP)** | — (internal `4317`) | `4317` | gRPC | `docker-compose.yaml:131`, `tempo.yml:22` |
| **Tempo (HTTP OTLP)** | — (internal `4318`) | `4318` | TCP | `docker-compose.yaml:132` |
| **Alloy (HTTP)** | `12345` | `12345` | TCP | `docker-compose.yaml:101` |
| **Alloy (gRPC OTLP)** | `4317` | `4317` | gRPC | `docker-compose.yaml:102`, `alloy/config.alloy:12` |
| **Alloy (HTTP OTLP)** | `4318` | `4318` | TCP | `docker-compose.yaml:103`, `alloy/config.alloy:16` |
