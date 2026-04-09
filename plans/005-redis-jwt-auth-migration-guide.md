# Redis + JWT Authentication Migration Guide

> Complete guide for migrating from UUID tokens to JWT with Redis

---

## Table of Contents

1. [Redis for Node.js/Express](#1-redis-for-nodejsexpress)
2. [JWT Authentication Best Practices](#2-jwt-authentication-best-practices)
3. [Database Table Design](#3-database-table-design)
4. [Migration Plan](#4-migration-plan)
5. [Implementation Example](#5-implementation-example)

---

## 1. Redis for Node.js/Express

### Redis Client Libraries Comparison

| Library | Popularity | Features | Recommendation |
|---------|------------|----------|----------------|
| **redis** (official) | ⭐⭐⭐⭐⭐ | Full features, stable | ✅ **Recommended** |
| **ioredis** | ⭐⭐⭐⭐ | Auto-reconnect, clustering | ✅ Also good |
| **connect-redis** | ⭐⭐⭐ | Session store only | For sessions only |

### Installation

```bash
# Redis client
npm install redis

# OR ioredis
npm install ioredis

# For JWT
npm install jsonwebtoken

# Type definitions
npm install -D @types/jsonwebtoken
```

### Basic Redis Setup

```typescript
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD
});

// Connection handling
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));
redisClient.on('ready', () => console.log('Redis Ready'));
redisClient.on('reconnecting', () => console.log('Redis Reconnecting'));

// Connect
await redisClient.connect();

export default redisClient;
```

### Best Practices: Connection Management

```typescript
// redis.ts - Production-ready Redis setup
import { createClient, RedisClientType } from 'redis';

class RedisManager {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed');
            return new Error('Redis reconnection failed');
          }
          console.log(`Redis reconnecting... attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        }
      },
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || '0')
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  get Client(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis not connected');
    }
    return this.client;
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.Client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

export const redisManager = new RedisManager();
```

---

## 2. JWT Authentication Best Practices

### JWT vs UUID Token Comparison

| Aspect | UUID Token (Current) | JWT (Recommended) |
|--------|---------------------|-------------------|
| **Storage** | Database lookup required | Self-contained |
| **Scalability** | ❌ Database query per request | ✅ No database needed |
| **Revocation** | ✅ Easy (delete from DB) | ⚠️ Need blacklist/Redis |
| **Size** | Small (36 chars) | Larger (200-500 chars) |
| **Info in token** | ❌ None | ✅ Can include user data |

### Access Token vs Refresh Token Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT AUTH FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LOGIN → Access Token (15m) + Refresh Token (7d)        │
│                                                              │
│  2. API REQUEST → Authorization: Bearer <access_token>     │
│                  └─> Validate JWT → Allow/Deny             │
│                                                              │
│  3. ACCESS TOKEN EXPIRED → Use Refresh Token               │
│                          └─> Verify in DB/Redis            │
│                          └─> Issue new tokens              │
│                                                              │
│  4. REFRESH TOKEN EXPIRED → Force re-login                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Token Expiration Best Practices

| Token Type | Lifetime | Use Case |
|------------|----------|----------|
| **Access Token** | 15 minutes | API requests |
| **Refresh Token** | 7 days | Get new access token |
| **Remember Me Token** | 30 days | Extended sessions |

### JWT Payload Structure

```json
{
  "sub": "user_123",           // Subject (user ID) - REQUIRED
  "iat": 1640995200,           // Issued At - REQUIRED
  "exp": 1641001200,           // Expiration - REQUIRED
  "iss": "my-api",             // Issuer
  "aud": "my-api-users",       // Audience
  "jti": "unique_token_id",    // JWT ID - for revocation
  "type": "access",            // Token type
  "role": "user",              // Custom claims
  "permissions": ["read:write"]
}
```

### JWT Libraries for Node.js

**jsonwebtoken** (Classic):
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: '123', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**jose** (Modern, Recommended):
```typescript
import { SignJWT, jwtVerify } from 'jose';

const token = await new SignJWT({ userId: '123', role: 'user' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('15m')
  .setSubject('user_123')
  .sign(secretKey);

const { payload } = await jwtVerify(token, secretKey);
```

### Signing Algorithms

| Algorithm | Type | Use Case |
|-----------|------|----------|
| **HS256** | Symmetric | Single server, shared secret |
| **RS256** | Asymmetric | Microservices, API gateways |

**Recommendation:** Start with HS256, upgrade to RS256 when scaling.

### Token Storage Best Practices

| Method | Security | XSS Safe | CSRF Safe | Recommendation |
|--------|----------|----------|-----------|----------------|
| **HttpOnly Cookie** | ✅ High | ✅ Yes | ⚠️ Need SameSite | ✅ **Web Apps** |
| **Authorization Header** | ✅ High | ✅ Yes | ✅ Yes | ✅ **APIs/Mobile** |
| **localStorage** | ❌ Low | ❌ No | ✅ Yes | ❌ Avoid |

---

## 3. Database Table Design

### Industry-Standard Naming Conventions

Based on Laravel, Django, Rails best practices:

#### Rule 1: Use Plural, Snake_case

✅ **GOOD:** `auth_tokens`, `refresh_tokens`, `users`
❌ **BAD:** `authToken`, `AuthToken`, `auth_token`

#### Rule 2: Boolean Columns Use `is_` Prefix

✅ **GOOD:** `is_revoked`, `is_active`, `is_expired`
❌ **BAD:** `revoked`, `active`, `status`

#### Rule 3: Standard Timestamps

✅ **GOOD:** `created_at`, `updated_at`, `expires_at`, `last_used_at`
❌ **BAD:** `createdAt`, `updated`, `expiry`

---

### Recommended Schema: refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hashed refresh token',
    jti VARCHAR(255) NOT NULL COMMENT 'JWT ID for revocation',
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_jti (jti),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Column Explanations

| Column | Purpose | Why |
|--------|---------|-----|
| `id` | Primary key | Standard practice |
| `user_id` | Foreign key | Link to user |
| `token_hash` | Hashed token | Security (don't store plain) |
| `jti` | JWT ID | For token revocation |
| `expires_at` | Expiration | Auto-cleanup |
| `is_revoked` | Revocation status | Boolean with `is_` prefix |
| `created_at` | Creation time | Audit trail |
| `updated_at` | Last update | Audit trail |
| `last_used_at` | Usage tracking | Security monitoring |

### Alternative: Combined auth_tokens Table

```sql
CREATE TABLE auth_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_type ENUM('access', 'refresh') NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    jti VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,

    INDEX idx_user_type (user_id, token_type),
    INDEX idx_jti (jti),
    INDEX idx_expires_at (expires_at),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. Migration Plan

### Phase 1: Preparation (Day 1)

1. **Install Dependencies**
   ```bash
   npm install redis jsonwebtoken
   npm install -D @types/jsonwebtoken
   ```

2. **Create Database Table**
   ```sql
   -- Run migration to create refresh_tokens table
   ```

3. **Update Environment Variables**
   ```env
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # JWT
   JWT_SECRET=your-super-secret-key-min-32-chars
   JWT_ACCESS_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   ```

### Phase 2: Implementation (Day 2-3)

1. **Create JWT Service**
2. **Create Redis Manager**
3. **Update Auth Middleware**
4. **Create Auth Controller Endpoints**:
   - POST /api/auth/login
   - POST /api/auth/refresh
   - POST /api/auth/logout
   - POST /api/auth/logout-all

### Phase 3: Testing (Day 4)

1. Unit tests for JWT service
2. Integration tests for auth endpoints
3. Test token expiration
4. Test token revocation

### Phase 4: Deployment (Day 5)

1. Deploy to staging
2. Run smoke tests
3. Deploy to production
4. Monitor for issues

---

## 5. Implementation Example

### JWT Service

```typescript
// src/service/jwt-service.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;        // User ID
  type: 'access' | 'refresh';
  role?: string;
}

interface GenerateTokensResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export class JWTService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
    this.accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.accessSecret,
      { expiresIn: this.accessExpiry }
    );
  }

  generateRefreshToken(payload: Omit<TokenPayload, 'type'>): { token: string; jti: string } {
    const jti = this.generateJTI();
    const token = jwt.sign(
      { ...payload, type: 'refresh', jti },
      this.refreshSecret,
      { expiresIn: this.refreshExpiry }
    );
    return { token, jti };
  }

  generateTokens(userId: string, userRole?: string): GenerateTokensResult {
    const basePayload = { sub: userId, role: userRole };

    const accessToken = this.generateAccessToken(basePayload);
    const { token: refreshToken, jti } = this.generateRefreshToken(basePayload);

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: 15 * 60,  // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60  // 7 days in seconds
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload & { jti: string } {
    return jwt.verify(token, this.refreshSecret) as TokenPayload & { jti: string };
  }

  private generateJTI(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const jwtService = new JWTService();
```

### Redis Token Storage

```typescript
// src/service/redis-token-service.ts
import redisManager from './redis-manager';
import crypto from 'crypto';

interface TokenData {
  userId: string;
  jti: string;
  expiresAt: number;
}

export class RedisTokenService {
  private readonly ACCESS_PREFIX = 'access_token:';
  private readonly REFRESH_PREFIX = 'refresh_token:';
  private readonly USER_TOKENS_PREFIX = 'user_tokens:';

  async storeAccessToken(jti: string, userId: string, expiresIn: number): Promise<void> {
    const key = this.ACCESS_PREFIX + jti;
    const data = JSON.stringify({ userId, jti });

    await redisManager.Client.setEx(key, expiresIn, data);
  }

  async storeRefreshToken(jti: string, userId: string, expiresIn: number): Promise<void> {
    const key = this.REFRESH_PREFIX + jti;
    const data = JSON.stringify({ userId, jti, expiresAt: Date.now() + expiresIn * 1000 });

    await redisManager.Client.setEx(key, expiresIn, data);

    // Track user's refresh tokens
    await this.addUserRefreshToken(userId, jti);
  }

  async isTokenRevoked(jti: string, type: 'access' | 'refresh'): Promise<boolean> {
    const prefix = type === 'access' ? this.ACCESS_PREFIX : this.REFRESH_PREFIX;
    const exists = await redisManager.Client.exists(prefix + jti);
    return exists === 0;  // If not in Redis, it's revoked/expired
  }

  async revokeToken(jti: string, type: 'access' | 'refresh'): Promise<void> {
    const prefix = type === 'access' ? this.ACCESS_PREFIX : this.REFRESH_PREFIX;
    await redisManager.Client.del(prefix + jti);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const userKey = this.USER_TOKENS_PREFIX + userId;
    const jtiList = await redisManager.Client.sMembers(userKey);

    const pipeline = redisManager.Client.multi();
    for (const jti of jtiList) {
      pipeline.del(this.REFRESH_PREFIX + jti);
      pipeline.del(this.ACCESS_PREFIX + jti);
    }
    pipeline.del(userKey);
    await pipeline.exec();
  }

  private async addUserRefreshToken(userId: string, jti: string): Promise<void> {
    const userKey = this.USER_TOKENS_PREFIX + userId;
    await redisManager.Client.sAdd(userKey, jti);
    await redisManager.Client.expire(userKey, 7 * 24 * 60 * 60);  // 7 days
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const redisTokenService = new RedisTokenService();
```

### Auth Controller with JWT

```typescript
// src/controller/auth-controller.ts
import { Request, Response } from 'express';
import { jwtService } from '../service/jwt-service';
import { redisTokenService } from '../service/redis-token-service';
import { UserService } from '../service/user-service';

export class AuthController {

  static async login(req: Request, res: Response) {
    const { username, password } = req.body;

    // Validate credentials (existing logic)
    const user = await UserService.login({ username, password });

    // Generate JWT tokens
    const { accessToken, refreshToken, accessExpiresIn } = jwtService.generateTokens(
      user.id.toString(),
      user.role
    );

    // Decode refresh token to get JTI
    const { jti } = jwtService.verifyRefreshToken(refreshToken);

    // Store tokens in Redis
    await redisTokenService.storeAccessToken(jti, user.id.toString(), accessExpiresIn);
    await redisTokenService.storeRefreshToken(
      jti,
      user.id.toString(),
      7 * 24 * 60 * 60  // 7 days
    );

    // Store refresh token hash in database (for revocation)
    await prismaClient.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: redisTokenService.hashToken(refreshToken),
        jti: jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      data: {
        accessToken,
        refreshToken,
        expiresIn: accessExpiresIn,
        tokenType: 'Bearer'
      }
    });
  }

  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(refreshToken);

      // Check if token is revoked
      const isRevoked = await redisTokenService.isTokenRevoked(payload.jti, 'refresh');
      if (isRevoked) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Check database for additional revocation check
      const tokenRecord = await prismaClient.refreshToken.findUnique({
        where: { jti: payload.jti }
      });

      if (!tokenRecord || tokenRecord.isRevoked) {
        return res.status(401).json({ error: 'Token revoked' });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken, accessExpiresIn } =
        jwtService.generateTokens(payload.sub, payload.role);

      const { jti: newJti } = jwtService.verifyRefreshToken(newRefreshToken);

      // Revoke old refresh token
      await redisTokenService.revokeToken(payload.jti, 'refresh');
      await prismaClient.refreshToken.update({
        where: { jti: payload.jti },
        data: { isRevoked: true }
      });

      // Store new tokens
      await redisTokenService.storeAccessToken(newJti, payload.sub, accessExpiresIn);
      await redisTokenService.storeRefreshToken(newJti, payload.sub, 7 * 24 * 60 * 60);

      // Store new refresh token in database
      await prismaClient.refreshToken.create({
        data: {
          userId: parseInt(payload.sub),
          tokenHash: redisTokenService.hashToken(newRefreshToken),
          jti: newJti,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: accessExpiresIn,
          tokenType: 'Bearer'
        }
      });

    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  static async logout(req: Request, res: Response) {
    const user = req.user!;
    const { refreshToken } = req.body;

    try {
      const { jti } = jwtService.verifyRefreshToken(refreshToken);

      // Revoke tokens
      await redisTokenService.revokeToken(jti, 'refresh');

      // Mark as revoked in database
      await prismaClient.refreshToken.updateMany({
        where: { jti, userId: user.id },
        data: { isRevoked: true }
      });

      res.json({ data: 'OK' });
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  }

  static async logoutAll(req: Request, res: Response) {
    const user = req.user!;

    // Revoke all user tokens
    await redisTokenService.revokeAllUserTokens(user.id.toString());

    // Mark all as revoked in database
    await prismaClient.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true }
    });

    res.json({ data: 'OK' });
  }
}
```

### Updated Auth Middleware

```typescript
// src/middleware/auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../service/jwt-service';
import { redisTokenService } from '../service/redis-token-service';
import { ResponseError } from '../error/response-error';

export interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
  role?: string;
  jti?: string;
}

export interface UserRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ResponseError(401, 'Unauthorized');
  }

  const token = authHeader.substring(7);

  try {
    // Verify token
    const payload = jwtService.verifyAccessToken(token) as TokenPayload;

    // Check token type
    if (payload.type !== 'access') {
      throw new ResponseError(401, 'Invalid token type');
    }

    // Check if revoked (Redis)
    if (payload.jti) {
      const isRevoked = await redisTokenService.isTokenRevoked(payload.jti, 'access');
      if (isRevoked) {
        throw new ResponseError(401, 'Token revoked');
      }
    }

    // Attach user to request
    req.user = payload;
    next();

  } catch (error) {
    throw new ResponseError(401, 'Unauthorized');
  }
};
```

---

## Summary Checklist

### Pre-Migration
- [ ] Redis server installed and running
- [ ] Dependencies installed (redis, jsonwebtoken)
- [ ] Environment variables configured
- [ ] refresh_tokens table created

### Implementation
- [ ] JWT service created
- [ ] Redis token service created
- [ ] Auth controller updated
- [ ] Auth middleware updated
- [ ] Old UUID token code removed

### Testing
- [ ] Login flow tested
- [ ] Token refresh tested
- [ ] Token revocation tested
- [ ] Logout all tested
- [ ] Token expiration tested

### Deployment
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## References

- [Redis Documentation](https://redis.io/docs/)
- [JWT.io](https://jwt.io/)
- [RFC 7519 - JWT](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
