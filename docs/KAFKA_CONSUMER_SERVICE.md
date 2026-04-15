# Kafka Consumer Service

## Architecture Overview

This project uses a **separate service architecture** for Kafka consumer and producer, following production-ready microservices patterns.

```
┌─────────────────┐     Kafka Events     ┌──────────────────┐
│   API Server    │ ──────────────────► │                  │
│ (Producer only) │   contact.audit      │                  │
│   port 3000     │   address.audit      │   Kafka Cluster  │
└─────────────────┘                      └──────────────────┘
                                                  │
                                                  ▼
┌─────────────────┐     Consumes Events   ┌──────────────────┐
│ Consumer Service│ ◀─────────────────────│                  │
│ (separate)      │                        │   Kafka Cluster  │
│   nodemon/ts    │                        │                  │
└─────────────────┘                        └──────────────────┘
         │
         ▼
   Saves to DB
 (audit_logs table)
```

## Benefits of Separate Services

| Aspect | Benefit |
|--------|---------|
| **Scalability** | Producer and consumer can scale independently |
| **Isolation** | Consumer processing doesn't affect API response times |
| **Resilience** | If consumer crashes, API server continues running |
| **Deployment** | Can deploy consumer on separate servers |
| **Monitoring** | Separate metrics and logs for each service |

## Files Structure

| File | Purpose |
|------|---------|
| `src/main.ts` | API Server entry point (Producer only) |
| `src/consumer-server.ts` | Consumer Service entry point |
| `src/producer/contact-producer.ts` | Kafka Producer implementation |
| `src/consumer/audit-consumer.ts` | Kafka Consumer implementation |
| `src/application/kafka.ts` | Kafka client configuration |

## Usage

### Development

Run both services in separate terminals:

**Terminal 1 - API Server (Producer):**
```bash
npm run dev
```

**Terminal 2 - Consumer Service:**
```bash
npm run dev:consumer
```

### Production

**API Server:**
```bash
npm start
# Or: node dist/main.js
```

**Consumer Service:**
```bash
npm run start:consumer
# Or: node dist/consumer-server.js
```

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start API Server with hot reload |
| `npm run dev:consumer` | Start Consumer Service with hot reload |
| `npm start` | Start production API Server |
| `npm run start:consumer` | Start production Consumer Service |
| `npm run build` | Compile TypeScript to `dist/` |

## Kafka Topics

| Topic | Purpose | Produced By |
|-------|---------|-------------|
| `contact.audit` | Contact CRUD audit events | API Server (Producer) |
| `address.audit` | Address CRUD audit events | API Server (Producer) |

### Event Types

**Contact Events:**
- `contact.created` - When a new contact is created
- `contact.updated` - When contact details are modified
- `contact.deleted` - When a contact is removed

**Address Events:**
- `address.created` - When a new address is created
- `address.updated` - When address details are modified
- `address.deleted` - When an address is removed

## Environment Variables

Required in `.env`:

```bash
# Kafka Configuration
KAFKA_BROKERS=<broker_address>:<port>
# Example: KAFKA_BROKERS=172.26.21.88:9093 or localhost:9093
```

**Note:** `ENABLE_AUDIT_CONSUMER` has been removed since consumer now runs as a separate service.

## API Endpoints Producing Kafka Events

### Contact Endpoints → `contact.audit`

| Method | Endpoint | Event Type |
|--------|----------|------------|
| POST | `/api/contacts` | `contact.created` |
| PUT | `/api/contacts/:contactId` | `contact.updated` |
| DELETE | `/api/contacts/:contactId` | `contact.deleted` |

### Address Endpoints → `address.audit`

| Method | Endpoint | Event Type |
|--------|----------|------------|
| POST | `/api/contacts/:contactId/addresses` | `address.created` |
| PUT | `/api/contacts/:contactId/addresses/:addressId` | `address.updated` |
| DELETE | `/api/contacts/:contactId/addresses/:addressId` | `address.deleted` |

## Event Message Format

```json
{
  "type": "contact.created",
  "entityType": "contact",
  "entityId": 1402,
  "username": "testuser",
  "timestamp": 1776141778150,
  "newValue": {
    "id": 1402,
    "first_name": "Kafka",
    "last_name": "Success",
    "email": "kafka@success.com",
    "phone": "777777"
  }
}
```

**For updates/deletes:** Includes `oldValue` field with previous state.

## Docker Deployment (Optional)

For containerized deployment, can create separate services:

```yaml
services:
  api-server:
    build: .
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - kafka

  consumer-service:
    build: .
    command: npm run start:consumer
    environment:
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - kafka
    restart: unless-stopped

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    # ... kafka config
```

## Monitoring

### Kafka UI
Access at: http://localhost:8080

Monitor:
- Topic messages
- Consumer group lag
- Broker health

### Logs
- **API Server:** Check for `Kafka Producer` logs
- **Consumer Service:** Check for `Kafka Consumer Service` logs
- **Audit Events:** Check `audit_logs` table in database

## Troubleshooting

### Consumer not receiving messages

1. **Check Kafka connection:**
   ```bash
   docker-compose ps kafka
   docker-compose logs kafka
   ```

2. **Check consumer is running:**
   ```bash
   ps aux | grep consumer-server
   ```

3. **Verify consumer group:**
   - Check Kafka UI → Consumer Groups
   - Look for `audit-service` group

### Producer not sending events

1. **Check API logs for:**
   - `Kafka Producer connected`
   - `Audit event published`

2. **Verify KAFKA_BROKERS address is correct**

### WSL2 IP Changes

If running on WSL2, the Kafka broker IP (`172.26.21.88:9093`) may change after WSL restart.

**Get current WSL2 IP:**
```bash
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

**Update in:**
- `.env` - `KAFKA_BROKERS`
- `docker-compose.yml` - `KAFKA_ADVERTISED_LISTENERS`

## Graceful Shutdown

Both services handle graceful shutdown on:
- `SIGINT` (Ctrl+C)
- `SIGTERM`

Shutdown sequence:
1. Stop accepting new requests/consumption
2. Close Kafka connections
3. Close Redis connection
4. Exit process

## Future Improvements

- [ ] Add retry logic with exponential backoff
- [ ] Implement dead letter queue for failed messages
- [ ] Add consumer metrics (lag, processing time)
- [ ] Implement consumer health check endpoint
- [ ] Add support for multiple consumer instances (consumer group scaling)
