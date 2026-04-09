# Security Packages Guide: Express Rate Limit, Helmet, CORS

> Learning guide for production security packages in Express.js

---

## Table of Contents

1. [Express Rate Limit](#1-express-rate-limit)
2. [Helmet](#2-helmet)
3. [CORS](#3-cors-cross-origin-resource-sharing)
4. [Implementation Example](#4-complete-implementation-example)

---

## 1. Express Rate Limit

### Apa itu Rate Limiting?

**Rate limiting** adalah security measure yang membatasi jumlah request yang bisa dilakukan client ke API dalam waktu tertentu.

**Kenapa Penting?**
- ✅ Mencegah DoS (Denial of Service) attacks
- ✅ Melindungi dari brute force password attacks
- ✅ Mencegah API abuse
- ✅ Distribusi resource yang fair
- ✅ Mengurangi server load

**HTTP Response:** `429 Too Many Requests`

---

### Cara Kerja express-rate-limit

```
Request → Middleware → Check IP/User → Count in Window
                                  ↓
                            Count > Limit?
                                  ↓
                         YES → 429 Response
                         NO  → Next Handler
```

**Storage Options:**
- **Memory** (default) - Untuk single server
- **Redis** - Untuk distributed systems (multiple servers)

---

### Apa yang Di-Limit?

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **IP-based** | Limit by client IP address | Default, public APIs |
| **User-based** | Limit by user ID | Authenticated endpoints |
| **API Key-based** | Limit by API key | Public API with keys |
| **Route-specific** | Different limits per route | Auth vs regular endpoints |

---

### Konfigurasi Utama

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  // Window waktu (milliseconds)
  windowMs: 15 * 60 * 1000,  // 15 menit

  // Max request per window
  max: 100,  // 100 request per 15 menit

  // Pesan custom saat limit terlewati
  message: "Too many requests, please try again later",

  // Standard headers (baru)
  standardHeaders: true,  // X-RateLimit-* headers

  // Legacy headers (lama)
  legacyHeaders: false,  // X-RateLimit-Reset (deprecated)

  // Custom handler saat limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

app.use(limiter);
```

---

### Berapa Limit yang Harus Dipakai?

| Endpoint Type | Window | Max Requests | Alasan |
|---------------|--------|--------------|--------|
| **General API** | 15 min | 100-1000 | Normal usage |
| **Auth (Login)** | 15 min | 5-10 | Mencegah brute force |
| **Public API** | 15 min | 1000+ | Lebih longgar |
| **Admin** | 15 min | 5000+ | Trusted users |
| **File Upload** | 1 hour | 10-20 | Resource intensive |

---

### Strategy: IP-based vs User-based

```javascript
// 1. IP-based (DEFAULT)
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  // Otomatis pakai req.ip
});

// 2. User-based (authenticated)
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,  // Lebih longgar untuk authenticated user
  keyGenerator: (req) => {
    // Pakai user ID instead of IP
    return req.user?.id || req.ip;
  },
  skip: (req) => !req.user  // Skip untuk non-auth
});

// 3. Route-specific
app.use('/api/', apiLimiter);      // General API
app.use('/api/auth/', authLimiter); // Auth endpoints
app.post('/api/upload', uploadLimiter); // Upload routes
```

---

### Strategy: Tiered User Limits

```javascript
const tieredLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 jam
  max: (req) => {
    const user = req.user;
    if (!user) return 10;           // Default

    switch (user.tier) {
      case 'free':      return 100;
      case 'premium':   return 1000;
      case 'enterprise': return 10000;
      default:          return 100;
    }
  }
});
```

---

### Strategy: Redis untuk Distributed Systems

```javascript
const RedisStore = require('rate-limit-redis');

const redisLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    expiry: 15 * 60  // 15 menit
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**Kenapa Redis?**
- Multiple servers share the same rate limit
- Persistent across restarts
- Better performance for high traffic

---

### Best Practices

```javascript
// 1. Environment-based config
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production'
    ? 15 * 60 * 1000   // Production: 15 min
    : 60 * 1000,       // Dev: 1 min (faster testing)

  max: process.env.NODE_ENV === 'production'
    ? 100
    : 1000  // Dev: lebih longgar
});

// 2. Skip for certain users/roles
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  skip: (req) => req.user?.isAdmin  // Admin unlimited
});

// 3. Proper logging
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: 900
    });
  }
});
```

---

## 2. Helmet

### Apa itu Helmet?

**Helmet** adalah middleware untuk Express yang mengamankan aplikasi dengan menambahkan HTTP security headers.

**Apa yang Dilakukan?**
- Mencegah XSS attacks
- Mencegah clickjacking
- Mencegah MIME-sniffing
- Memastikan HTTPS-only connections
- Dan lainnya...

---

### Security Headers dari Helmet

| Header | Nama Helmet | Fungsi |
|--------|-------------|--------|
| `X-DNS-Prefetch-Control` | dnsPrefetchControl | Kontrol DNS prefetching |
| `X-Frame-Options` | frameguard | Mencegah clickjacking |
| `Strict-Transport-Security` | hsts | Force HTTPS only |
| `X-Download-Options` | ieNoOpen | Proteksi IE downloads |
| `X-Content-Type-Options` | noSniff | Mencegah MIME-sniffing |
| `X-XSS-Protection` | xssFilter | XSS filter browser |
| `Content-Security-Policy` | contentSecurityPolicy | Mencegah XSS, injection |

---

### Basic Usage

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');

// Basic - pakai default settings
app.use(helmet());

// Atau dengan configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));
```

---

### Content Security Policy (CSP)

**CSP** adalah header paling penting untuk mencegah XSS.

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],                    // Default: hanya origin sendiri
      scriptSrc: ["'self'", "https://cdn.com"],  // Script yang diizinkan
      styleSrc: ["'self'", "'unsafe-inline'"],   // CSS inline
      imgSrc: ["'self'", "data:", "https:"],     // Images
      connectSrc: ["'self'", "https://api.com"], // AJAX/Fetch
      fontSrc: ["'self'", "https://fonts.com"],  // Fonts
      objectSrc: ["'none'"],                     // No <object>, <embed>
      mediaSrc: ["'self'"],                      // Audio/video
      frameSrc: ["'none'"],                      // No <iframe>
    }
  }
}));
```

---

### HSTS (HTTPS Only)

```javascript
app.use(helmet({
  hsts: {
    maxAge: 31536000,        // 1 tahun (dalam seconds)
    includeSubDomains: true, // Termasuk subdomains
    preload: true            // Bisa di-preload browser
  }
}));
```

**Penting:** HSTS hanya untuk production dengan HTTPS!

---

### Development vs Production

```javascript
const helmetConfig = process.env.NODE_ENV === 'production' ? {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    }
  },
  hsts: {
    maxAge: 31536000
  }
} : {
  // Development: lebih longgar
  contentSecurityPolicy: false,  // Disable CSP di dev
  hsts: false                    // Disable HSTS di dev
};

app.use(helmet(helmetConfig));
```

---

## 3. CORS (Cross-Origin Resource Sharing)

### Apa itu CORS?

**CORS** adalah mechanism yang mengizinkan restricted resources dari satu origin di-request oleh origin lain.

**Same-Origin Policy (SOP):**
Browser memblokir request dari origin A ke origin B secara default.

**Origin = Protocol + Domain + Port**
```
https://example.com:3000  ≠  https://example.com:3001
https://example.com      ≠  https://api.example.com
http://example.com       ≠  https://example.com
```

---

### Cara Kerja CORS

```
1. Simple Request (GET, POST sederhana)
   Browser → Server (dengan header Origin)
   Server → Browser (dengan header Access-Control-Allow-Origin)

2. Preflight Request (POST kompleks, PUT, DELETE, custom headers)
   Browser → Server: OPTIONS (preflight)
   Server → Browser: Access-Control-Allow-Methods, Allow-Headers
   Browser → Server: Actual request
```

---

### Konfigurasi CORS

```bash
npm install cors
```

```javascript
const cors = require('cors');

// 1. Allow all origins (HATI-HATI - hanya untuk development)
app.use(cors());

// 2. Single origin
app.use(cors({
  origin: 'https://myapp.com'
}));

// 3. Multiple origins
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com']
}));

// 4. Dynamic origin (validasi)
app.use(cors({
  origin: (origin, callback) => {
    // Allow no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = ['https://myapp.com'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

---

### Important Options

| Option | Description | Example |
|--------|-------------|---------|
| `origin` | Allowed origins | `'https://app.com'` |
| `methods` | Allowed HTTP methods | `['GET', 'POST', 'PUT']` |
| `allowedHeaders` | Allowed request headers | `['Content-Type', 'Authorization']` |
| `credentials` | Allow cookies/auth headers | `true` |
| `maxAge` | Preflight cache duration | `86400` (24 jam) |

---

### Credentials = TRUE

**PENTING:** Tidak bisa pakai `origin: '*'` dengan `credentials: true`!

```javascript
// ❌ WRONG - tidak akan jalan
app.use(cors({
  origin: '*',
  credentials: true
}));

// ✅ CORRECT - specific origin
app.use(cors({
  origin: 'https://myapp.com',
  credentials: true
}));
```

**Di client (fetch):**
```javascript
fetch('https://api.com', {
  credentials: 'include'  // Kirim cookies
});
```

---

### Environment-Specific CORS

```javascript
const corsOptions = {
  development: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },
  production: {
    origin: ['https://myapp.com', 'https://admin.myapp.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAge: 86400
  }
};

const env = process.env.NODE_ENV || 'development';
app.use(cors(corsOptions[env]));
```

---

## 4. Complete Implementation Example

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// === 1. HELMET (Security Headers) ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true
  } : false
}));

// === 2. CORS ===
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// === 3. RATE LIMITING ===

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP'
});

// Auth limiter (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // Only 5 login attempts per 15 min
  skipSuccessfulRequests: true,  // Don't count successful requests
  message: 'Too many login attempts, please try again later'
});

// Apply limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// === Routes ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(3000, () => {
  console.log('Server running with security middleware');
});
```

---

## Summary Checklist

Production Security Checklist:

- [ ] Install security packages: `helmet`, `cors`, `express-rate-limit`
- [ ] Configure helmet with CSP
- [ ] Configure CORS with specific origins (not `*`)
- [ ] Set up rate limiting for general API
- [ ] Set up stricter rate limiting for auth endpoints
- [ ] Add .env.example with CORS_ORIGIN
- [ ] Test security headers with tools like Security Headers
- [ ] Monitor rate limit violations
- [ ] Set up alerts for unusual patterns

---

## References

- [express-rate-limit docs](https://github.com/express-rate-limit/express-rate-limit)
- [Helmet docs](https://helmetjs.github.io/)
- [CORS docs](https://expressjs.com/en/resources/middleware/cors.html)
