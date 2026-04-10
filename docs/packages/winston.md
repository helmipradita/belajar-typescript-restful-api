# Winston 3.19 - Documentation (April 2026)

Version: **3.19.0** | Node 22 Compatible: ✅ (≥12)

## Overview

Winston is a versatile logging library for Node.js with support for multiple transports and flexible log formatting.

## Basic Setup

### Create Logger

```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

### Logging Methods

```javascript
logger.error('error message');
logger.warn('warning message');
logger.info('info message');
logger.http('HTTP log message');
logger.verbose('verbose message');
logger.debug('debug message');
logger.silly('silly message');
```

## Formats

### Combine Formats

```javascript
const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
    return `${timestamp} [${level}]: ${message} ${
        Object.keys(metadata).length ? JSON.stringify(metadata) : ''
    }`;
});

const logger = winston.createLogger({
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat
    ),
    transports: [new winston.transports.Console()]
});
```

### Common Formats

```javascript
// JSON format
winston.format.json()

// Simple text
winston.format.simple()

// Colorized
winston.format.colorize({ all: true })

// Timestamp
winston.format.timestamp({ format: 'HH:mm:ss' })

// Pretty print
winston.format.prettyPrint()

// Add error stack
winston.format.errors({ stack: true })

// Label
winston.format.label({ label: 'my-app' })

// Splat (for string interpolation)
winston.format.splat()
```

### Custom Format

```javascript
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        // Filter out internal winston properties
        const { level, message, timestamp, label, ...cleanMetadata } = metadata;
        if (Object.keys(cleanMetadata).length > 0) {
            msg += ` ${JSON.stringify(cleanMetadata)}`;
        }
    }

    return msg;
});
```

## Transports

### Console Transport

```javascript
new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
    ),
    // Send error and warn to stderr
    stderrLevels: ['error'],
    consoleWarnLevels: ['warn'],
    // Use console.log/warn/error instead of stdout/stderr
    forceConsole: false
})
```

### File Transport

```javascript
// Basic file
new winston.transports.File({
    filename: 'combined.log',
    level: 'info'
})

// With rotation
new winston.transports.File({
    filename: 'app.log',
    level: 'info',
    maxsize: 5242880,        // 5MB max file size
    maxFiles: 5,             // Keep 5 rotated files
    tailable: true,          // Always write to app.log
    zippedArchive: true,     // Compress rotated files
    options: { flags: 'a' }  // Append mode
})

// Separate error log
new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    handleExceptions: true,
    handleRejections: true
})
```

### HTTP Transport

```javascript
new winston.transports.Http({
    host: 'logs.example.com',
    port: 443,
    path: '/api/logs',
    auth: {
        bearer: 'your-api-token'
    },
    headers: {
        'X-Custom-Header': 'value'
    },
    batch: true,
    batchInterval: 5000,
    batchCount: 10,
    maximumDepth: 5
})
```

### Daily Rotate File

```javascript
const DailyRotateFile = require('winston-daily-rotate-file');

new DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d'
})
```

## Logging with Metadata

### Structured Logging

```javascript
logger.info('User logged in', {
    userId: 123,
    username: 'john',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
});

// Output (JSON format):
// {"level":"info","message":"User logged in","userId":123,"username":"john","ip":"192.168.1.1","userAgent":"Mozilla/5.0..."}
```

### Request Logging (Express)

```javascript
app.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });

    next();
});
```

### Error Logging

```javascript
try {
    // Some operation
} catch (error) {
    logger.error('Operation failed', {
        error: error.message,
        stack: error.stack,
        context: { userId: 123 }
    });
}
```

## Child Loggers

```javascript
// Create child logger with default metadata
const childLogger = logger.child({ module: 'UserService' });

childLogger.info('User created', { userId: 123 });
// Output includes: {"module":"UserService","userId":123,...}
```

## Exception & Rejection Handling

```javascript
const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'exceptions.log',
            handleExceptions: true,
            handleRejections: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log' })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'rejections.log' })
    ]
});
```

## Reconfigure Logger

```javascript
const logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console()]
});

// Initial logging
logger.info('Using console transport');

// Reconfigure for production
logger.configure({
    level: 'warn',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log' })
    ]
});

// Add/remove transports
logger.add(new winston.transports.Console({ level: 'error' }));
logger.remove(logger.transports[0]);

// Clear all transports
logger.clear();

// Close logger
logger.close();
```

## Query Logs

```javascript
// Query logs from file transport
logger.query({
    from: new Date() - 24 * 60 * 60 * 1000,  // Last 24 hours
    until: new Date(),
    limit: 10,
    start: 0,
    order: 'desc'
}, (err, results) => {
    if (err) throw err;
    console.log('Recent logs:', results);
});
```

## Stream Logs

```javascript
// Create a stream
const stream = winston.createLogger({
    transports: [new winston.transports.Stream({
        stream: process.stdout
    })]
});

// Or use existing logger as stream
logger.stream({ start: 0 }).on('log', (log) => {
    console.log(log);
});
```

## Production Configuration

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        // Console for development
        ...(process.env.NODE_ENV !== 'production'
            ? [new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })]
            : []
        ),

        // Daily rotating files for production
        new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        }),

        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new DailyRotateFile({
            filename: 'logs/exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD'
        })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new DailyRotateFile({
            filename: 'logs/rejections-%DATE%.log',
            datePattern: 'YYYY-MM-DD'
        })
    ]
});

module.exports = logger;
```

---

**Source:** Context7 - /winstonjs/winston
**Last Updated:** 2026-04-07
