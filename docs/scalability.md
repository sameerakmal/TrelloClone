# Scalability Strategy

## Current State Assessment

### Single Server Architecture
```
┌─────────────────────────────────────────────┐
│    Frontend (React + Vite)                  │
│    http://localhost:5173                    │
└──────────────────┬──────────────────────────┘
                   │
          HTTP + WebSocket
                   │
┌──────────────────▼──────────────────────────┐
│    Backend (Node.js/Express)                │
│    http://localhost:4000                    │
├─────────────────────────────────────────────┤
│  • Express routes                           │
│  • Socket.IO (in-memory)                    │
│  • Activity logging                         │
│  • JWT authentication                       │
└──────────────────┬──────────────────────────┘
                   │
              MongoDB
                   │
┌──────────────────▼──────────────────────────┐
│    MongoDB (Cloud Atlas)                    │
│    Data storage                             │
└─────────────────────────────────────────────┘
```

### Limitations
- **Single Point of Failure** - Backend down = entire app down
- **Connection Limits** - ~10K concurrent connections per server
- **Memory Bound** - All socket data in RAM
- **CPU Bound** - Single core for processing
- **No Persistence** - Socket state lost on restart
- **Session Affinity** - Can't distribute connections randomly

## Scaling Phases

### Phase 1: Optimize Current Setup (Immediate)
- Database indexing
- Query optimization
- Connection pooling
- Caching layer
- **Estimated Time:** 1-2 weeks

### Phase 2: Horizontal Scaling (1-3 months)
- Load balancing
- Redis for Socket.IO
- Separate read/write
- **Estimated Time:** 2-4 weeks

### Phase 3: Microservices (3-6 months)
- API Gateway
- Service decomposition
- Message queues
- **Estimated Time:** 4-8 weeks

---

## Phase 1: Single Server Optimization

### Database Optimization

#### Indexing
```javascript
// User schema
userSchema.index({ email: 1 });

// Board schema
boardSchema.index({ owner: 1 });
boardSchema.index({ members: 1 });

// List schema
listSchema.index({ boardId: 1, order: 1 });

// Task schema
taskSchema.index({ listId: 1 });
taskSchema.index({ boardId: 1 });

// Activity schema
activitySchema.index({ boardId: 1, createdAt: -1 });
```

#### Query Optimization
```javascript
// Bad - retrieves all fields
const boards = await Board.find({ members: userId });

// Good - only needed fields
const boards = await Board
  .find({ members: userId })
  .select("title description owner members");

// Better - limit results for activity
const activities = await Activity
  .find({ boardId })
  .populate("userId", "name email")
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();  // Returns plain objects, faster
```

#### Caching Strategy
```javascript
const redis = require("redis");
const client = redis.createClient();

// Cache board details
const getBoard = async (id) => {
  const cached = await client.get(`board:${id}`);
  if (cached) return JSON.parse(cached);
  
  const board = await Board.findById(id).populate("members");
  await client.setEx(`board:${id}`, 3600, JSON.stringify(board));
  return board;
};

// Invalidate on update
boardRouter.patch("/board/:id", async (req, res) => {
  // ... update
  await client.del(`board:${req.params.id}`);
});
```

### Application Optimization

#### Connection Pooling
```javascript
// MongoDB already uses connection pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5
});
```

#### Request Compression
```javascript
const compression = require("compression");
app.use(compression());
```

#### Response Caching
```javascript
// Cache static responses
app.get("/lists/:boardId", (req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  // ... handler
});
```

#### Pagination
```javascript
// Limit large responses
activityRouter.get("/activity/:boardId", async (req, res) => {
  const limit = Math.min(req.query.limit || 50, 100);
  const skip = req.query.skip || 0;
  
  const activities = await Activity
    .find({ boardId: req.params.boardId })
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
  
  res.json(activities);
});
```

### Monitoring

```javascript
// Add monitoring
const monitor = require("os-monitor");

monitor.start({
  immediate: true,
  delay: 3000  // Every 3 seconds
});

monitor.on("monitor", (osStats) => {
  console.log(`CPU: ${osStats.percentCPUUsage}%, Memory: ${osStats.percentMemoryUsage}%`);
});
```

**Expected Improvement:** 30-50% performance boost

---

## Phase 2: Horizontal Scaling

### Architecture
```
                    ┌─────────────────────┐
                    │   Load Balancer     │
                    │   (Nginx/HAProxy)   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼────┐  ┌──────▼───┐  ┌──────▼────┐
        │  Backend 1 │  │Backend 2 │  │ Backend N │
        │  :4001     │  │ :4002    │  │  :400N    │
        └───────┬────┘  └──────┬───┘  └──────┬────┘
                │              │              │
                └──────────────┼──────────────┘
                               │
                    ┌──────────▼─────────┐
                    │   Redis Cluster    │
                    │  (Socket.IO)       │
                    └──────────┬─────────┘
                               │
                    ┌──────────▼─────────┐
                    │   MongoDB Atlas    │
                    │   (Replicas)       │
                    └────────────────────┘
```

### Load Balancer Setup (Nginx)
```nginx
upstream backend {
    server localhost:4001;
    server localhost:4002;
    server localhost:4003;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Session affinity for Socket.IO
        proxy_set_header X-Session-ID $remote_addr;
    }
}
```

### Redis Adapter for Socket.IO
```javascript
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const pubClient = redis.createClient({
  host: "redis-cluster.example.com",
  port: 6379
});
const subClient = pubClient.duplicate();

const io = new Server(server, {
  adapter: createAdapter(pubClient, subClient),
  cors: { origin: "http://localhost:5173" }
});
```

### Benefits
- **Availability:** One backend down, others serve requests
- **Throughput:** 3x servers = ~3x connections
- **Real-time:** Redis broadcasts to all instances
- **Resilience:** Auto-failover with health checks

### Deployment Strategy
```bash
# Run multiple instances
pm2 start app.js -i 3  # 3 instances

# Or with Docker Compose
docker-compose up --scale backend=3
```

### Monitoring Across Instances
```javascript
// Consistent logging
const winston = require("winston");
const logger = winston.createLogger({
  transports: [
    new winston.transports.MongoDB({
      db: MONGODB_URI,
      collection: "logs"
    })
  ]
});
```

**Expected Improvement:** Linear scaling (3 servers ≈ 3x capacity)

---

## Phase 3: Microservices Architecture

### Service Decomposition
```
┌──────────────────┐
│  API Gateway     │
│  (Rate limiting) │
└────────┬─────────┘
         │
    ┌────┴──────┬────────┬──────────┐
    │           │        │          │
    ▼           ▼        ▼          ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐
│ Auth   │ │ Board  │ │ Task │ │ Activity │
│Service │ │Service │ │ Svc  │ │ Service  │
└───┬────┘ └───┬────┘ └──┬───┘ └────┬─────┘
    │          │         │          │
    └──────────┴─────────┴──────────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼──┐    ┌────▼────┐
    │Redis │    │ MongoDB  │
    │Cache │    │Databases │
    └──────┘    └──────────┘
```

### Service Responsibilities
- **Auth Service** - User registration, login, JWT validation
- **Board Service** - Board CRUD, member management
- **Task Service** - Task CRUD, assignments
- **Activity Service** - Logging, retrieval
- **API Gateway** - Routing, rate limiting, auth

### Communication Pattern
```javascript
// Service-to-service via HTTP or gRPC
const boardService = "http://board-service:4001";

async function addMemberToBoard(boardId, userId) {
  const response = await fetch(`${boardService}/board/${boardId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId })
  });
  return response.json();
}

// Or with message queue
const queue = new Queue("activities");
queue.add("memberAdded", { boardId, userId });
```

### Event-Driven Architecture
```
Service publishes event to message broker (RabbitMQ/Kafka)
         │
    ┌────┴────────┬──────────┬──────────┐
    │             │          │          │
Services subscribe and react to events
```

**Trade-offs:**
- ✅ Independent scaling per service
- ✅ Technology diversity
- ✅ Fault isolation
- ❌ Complexity increases
- ❌ Debugging harder
- ❌ Operational overhead

---

## Database Scaling

### Current Setup
```
MongoDB Atlas (shared cluster)
```

### Scaling Options

#### 1. Connection Pooling Optimization
```javascript
mongoose.connect(uri, {
  maxPoolSize: 20,  // Increase for more throughput
  minPoolSize: 5
});
```

#### 2. Read Replicas
```javascript
const primaryDb = mongoose.connection.useDb("hintro");
const readDb = mongoose.connection.useDb("hintro_read");

// Read-heavy queries
const activities = await Activity
  .find({ boardId })
  .read("secondary");  // Use replica
```

#### 3. Database Sharding
```
Partition data by boardId or userId
   │
┌──┴──┬──────┬──────┐
│     │      │      │
DB-1  DB-2   DB-3   DB-N
(Shard 1-100) (101-200) ...
```

#### 4. Caching Layer
```
Request → Redis Cache → MongoDB
Success → return cached
Miss → query DB → cache result → return
```

---

## CDN & Static Assets

### Current Setup
```
Frontend served from Vite dev server (development)
```

### Production Setup
```
┌─────────────────────────────┐
│  CDN (Cloudflare/Netlify)   │
│  Caches static assets       │
│  (JS, CSS, images)          │
└──────────────┬──────────────┘
               │
        Offloads origin
```

### Configuration
```javascript
// vite.config.js
export default {
  build: {
    // Chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'dnd': ['@dnd-kit/core']
        }
      }
    }
  }
};
```

---

## Monitoring & Alerting

### Key Metrics
```
Backend:
  - CPU usage > 80%
  - Memory usage > 85%
  - Request latency > 500ms
  - Error rate > 1%
  - Active connections

Database:
  - Query time > 100ms
  - Connection pool exhaustion
  - Replication lag

Frontend:
  - Page load time > 3s
  - Lighthouse score < 80
```

### Monitoring Stack
```javascript
// Datadog / New Relic
const NewRelic = require("newrelic");

// Custom metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    NewRelic.recordMetric("Custom/request_duration", duration);
  });
  next();
});
```

### Alerting
```
Alert when:
- Backend health check fails
- Error rate > threshold
- Latency spikes
- Database connection issues
- Low disk space
```

---

## Deployment Checklist

### Before Phase 2 (Horizontal Scaling)
- [ ] Database indexes optimized
- [ ] Query performance tuned
- [ ] Caching implemented
- [ ] Monitoring set up
- [ ] Load testing completed
- [ ] Failover procedures documented
- [ ] Redis cluster deployed
- [ ] Load balancer configured

### Before Phase 3 (Microservices)
- [ ] Phase 2 stable for 1 month
- [ ] Clear service boundaries identified
- [ ] API contracts defined
- [ ] Event schemas designed
- [ ] Message broker selected
- [ ] Team scaled accordingly

---

## Cost Estimation

### Phase 1 (Optimization)
- Development: $5,000-10,000
- No infrastructure change
- Hosting: Same

### Phase 2 (Horizontal Scaling)
- 3 backend servers: $150-300/month
- Redis cluster: $100-200/month
- Load balancer: $50-100/month
- Development: $15,000-25,000

### Phase 3 (Microservices)
- Multiple databases: $200-400/month
- Message broker: $100-200/month
- API Gateway: $50-100/month
- Development: $40,000-60,000

---

## Performance Targets

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| Concurrent Users | 1,000 | 10,000 | 100,000+ |
| Avg Latency | 100ms | 50ms | 30ms |
| P99 Latency | 500ms | 200ms | 100ms |
| Throughput (req/s) | 100 | 500 | 5,000+ |
| Availability | 99% | 99.9% | 99.99% |

---

## Rollback Strategy

### Phase 1 (Optimization)
- Database changes: Reversible with migrations
- Code changes: Standard Git rollback

### Phase 2 (Scaling)
- Remove new servers: Route to remaining instances
- Disable Redis: Revert to in-memory (data loss)
- Revert load balancer: Point to single instance

### Phase 3 (Microservices)
- Per-service rollback via versioning
- Service mesh (Istio) for gradual rollout
- Database migrations with down/up scripts

---

## Timeline Recommendation

1. **Months 0-1:** Phase 1 optimization (run in parallel with feature work)
2. **Months 2-3:** Phase 2 deployment when Phase 1 complete
3. **Months 4-6:** Phase 3 only if:
   - Phase 2 at capacity
   - Business justifies complexity
   - Team has DevOps expertise
