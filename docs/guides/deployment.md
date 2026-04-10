# Deployment Guide

Guide for deploying the belajar-typescript-restful-api to production.

## Prerequisites

- Node.js 20+
- MySQL 5.7+ or MariaDB 10.3+
- Redis (optional, for caching/sessions)
- Domain name (optional)

## Environment Variables

Create `.env` file for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/production_db
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://yourdomain.com
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
```

## Build for Production

```bash
# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Verify build
ls -la dist/
```

## Running with PM2

### Install PM2

```bash
npm install -g pm2
```

### Start with PM2

```bash
# Start application
pm2 start dist/main.js --name "belajar-api"

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'belajar-api',
    script: './dist/main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with:

```bash
pm2 start ecosystem.config.js
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### docker-compose.yml for Production

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

## Nginx Reverse Proxy

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Security Checklist

Before deploying to production:

- [ ] Update `.env` with strong secrets
- [ ] Set `CORS_ORIGIN` to specific domain
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Run database migrations
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Test all endpoints
- [ ] Remove development dependencies

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-04-10T00:00:00.000Z"
}
```

### PM2 Monitoring

```bash
# Show logs
pm2 logs belajar-api

# Show monitoring
pm2 monit

# Show info
pm2 info
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to server
        run: |
          ssh user@server "cd /app && git pull && npm ci --only=production && npm run build && pm2 restart belajar-api"
```

## Troubleshooting

### Server Not Starting

```bash
# Check logs
pm2 logs belajar-api

# Check port usage
lsof -ti:3000
```

### Database Connection Issues

```bash
# Test connection
mysql -h localhost -u user -p database_name

# Check DATABASE_URL
echo $DATABASE_URL
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart belajar-api
```
