# Express.js 5.2 - Documentation (April 2026)

Version: **5.2.1** | Node 22 Compatible: ✅

## Overview

Express is a fast, unopinionated, minimalist web framework for Node.js.

## What's New in Express 5

### Async Error Handling (Automatic)

Express 5 automatically catches errors in async route handlers:

```typescript
// Express 5 - No try/catch needed!
app.get('/users/:id', async (req, res, next) => {
  const user = await getUser(req.params.id);
  res.json(user);
  // If getUser throws, Express 5 catches it automatically
});
```

### Improved Error Handling

Error-handling middleware must have 4 parameters and is defined after all routes:

```javascript
// Error-handling middleware (must have 4 parameters)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`Error ${status}: ${message}`);
  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});
```

## Middleware

### Application-level Middleware

```javascript
const express = require('express');
const app = express();

// Application-level middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  req.requestTime = Date.now();
  next();
});
```

### Built-in Middleware

```javascript
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
```

### Path-specific Middleware

```javascript
app.use('/api', (req, res, next) => {
  const apiKey = req.query['api-key'];
  if (!apiKey || apiKey !== 'secret123') {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});
```

### Multiple Middleware on Single Route

```javascript
const validateUser = (req, res, next) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  next();
};

app.post('/users', validateUser, (req, res) => {
  res.status(201).json({ name: req.body.name });
});
```

## Routing

### Basic Routes

```javascript
// GET
app.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

// POST
app.post('/users', (req, res) => {
  res.status(201).json(req.body);
});

// PUT
app.put('/users/:id', (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

// DELETE
app.delete('/users/:id', (req, res) => {
  res.status(204).send();
});
```

### Router Module

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

router.post('/', (req, res) => {
  res.status(201).json(req.body);
});

module.exports = router;

// app.js
const userRoutes = require('./routes/users');
app.use('/users', userRoutes);
```

## Error Handling

### Custom Error Class

```javascript
class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
```

### Throwing Errors in Async Routes

```javascript
// Express 5 - Async errors are automatically caught
app.get('/users/:id', async (req, res, next) => {
  const user = await getUser(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json(user);
});
```

### 404 Handler

```javascript
// Must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});
```

## Request & Response

### Request Object

```javascript
app.get('/search', (req, res) => {
  // Query parameters
  const query = req.query.q;

  // URL parameters
  const id = req.params.id;

  // Headers
  const auth = req.get('Authorization');

  // Body (parsed by express.json())
  const data = req.body;
});
```

### Response Methods

```javascript
// JSON response
res.json({ message: 'Hello' });

// Status + JSON
res.status(201).json({ id: 1 });

// Send text
res.send('Hello World');

// Set headers
res.set('X-Custom-Header', 'value');
res.json({ data });
```

---

**Source:** Context7 - /expressjs/express
**Last Updated:** 2026-04-10
