# Express.js 4.19 - Documentation (April 2026)

Version: **4.19.2** | Node 22 Compatible: ✅

## Overview

Express is a fast, unopinionated, minimalist web framework for Node.js.

## Middleware

### Application-level Middleware

Runs on every request to the application.

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

const logUser = (req, res, next) => {
    console.log('Creating user:', req.body.name);
    next();
};

app.post('/users', validateUser, logUser, (req, res) => {
    res.status(201).json({ name: req.body.name });
});
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

### Error-handling Middleware

**Must have 4 parameters:** `(err, req, res, next)`

```javascript
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

### 404 Handler

**Must be after all routes:**

```javascript
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});
```

### Async Error Handling

```javascript
// Express 4: Handle async errors manually
app.get('/users/:id', async (req, res, next) => {
    try {
        const user = await getUser(req.params.id);
        res.json(user);
    } catch (err) {
        next(err); // Pass to error handler
    }
});

// Express 5 will handle async errors automatically
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
    const user = req.body;
    res.status(201).json(user);
});

// PUT
app.put('/users/:id', (req, res) => {
    const updatedUser = updateUser(req.params.id, req.body);
    res.json(updatedUser);
});

// DELETE
app.delete('/users/:id', (req, res) => {
    deleteUser(req.params.id);
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

    // IP address
    const ip = req.ip;
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

// Send status only
res.sendStatus(204);

// Set headers
res.set('X-Custom-Header', 'value');
res.json({ data });
```

## Common Patterns

### CORS Configuration

```javascript
const cors = require('cors');

// Simple (allow all)
app.use(cors());

// Specific origin
app.use(cors({ origin: 'http://example.com' }));

// Dynamic origin
app.use(cors({
    origin: (origin, callback) => {
        const allowed = ['http://example.com', 'https://example.com'];
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per window
    message: 'Too many requests'
});

app.use('/api', limiter);
```

### File Upload

```javascript
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
});
```

---

**Source:** Context7 - /expressjs/express
**Last Updated:** 2026-04-07
