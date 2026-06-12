# Scaling API — Naikin RPS

## Kondisi Saat Ini

- Express + Prisma + MySQL (1 container)
- Prisma default connection pool: **10**
- Max throughput: **~300 RPS**
- Bottleneck: connection pool MySQL, single process Node.js

---

## Level 1: Connection Pool ✅ (Sudah Terimplementasi)

Prisma default pool size = 10. Sudah ditambah `connection_limit=30` di DATABASE_URL.

**Status:** ✅ Done — `docker-compose.yaml` sudah `connection_limit=30` + `max_connections=200`

**Estimasi:** ~600-800 RPS

---

## Level 2: Node.js Cluster (1 container, multi-proses)

PM2 cluster mode — 1 instance per CPU core, shared port.

```bash
npx pm2-runtime start dist/main.js -i max
```

Ubah CMD di Dockerfile atau docker-entrypoint.sh.

**Bedanya dengan horizontal scale:**

| | Cluster | Horizontal |
|---|---|---|
| Jumlah container | 1 | Banyak |
| Port | Shared (1 port) | Tiap container beda |
| Load balancer | Tidak perlu | Perlu (nginx/DNS) |
| Resource isolation | Shared dalam 1 container | Terpisah |
| Complexity | Rendah | Sedang |

**Estimasi (4 core):** ~1.500-2.000 RPS

---

## Level 3: Horizontal Scale (multi-container + load balancer)

Banyak container `rest-api` di belakang **nginx** atau docker DNS round-robin.

Docker compose:

```yaml
rest-api-1:
  build: .
  # ...

rest-api-2:
  build: .
  # ...

rest-api-3:
  build: .
  # ...

nginx:
  image: nginx:alpine
  ports:
    - "3030:80"
  volumes:
    - ./config/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
```

Nginx config:

```nginx
upstream rest-api {
    server rest-api-1:3000;
    server rest-api-2:3000;
    server rest-api-3:3000;
}
server {
    listen 80;
    location / {
        proxy_pass http://rest-api;
    }
}
```

**Estimasi (3 container):** ~3.000-4.000 RPS

---

## Estimasi Perbandingan

| Skenario | Estimasi RPS | Complexity |
|---|---|---|
| Saat ini | ~300 RPS | - |
| + Pool MySQL 30 | ~600-800 RPS | Sangat Rendah |
| + PM2 cluster 4 core | ~1.500-2.000 RPS | Rendah |
| + Horizontal 3 container | ~3.000-4.000 RPS | Sedang |
| Pool + Cluster + Horizontal | ~5.000-8.000 RPS | Sedang |
