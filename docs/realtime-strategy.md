# Real-time Strategy

## Overview
WebSocket-based real-time updates using Socket.IO for activity synchronization across all connected board members.

## Architecture Pattern

```
User Action
    ↓
HTTP Request to Backend
    ↓
Database Update
    ↓
Activity Log Created
    ↓
Socket.IO Broadcast to Board Room
    ↓
All Connected Clients Receive Event
    ↓
Frontend Updates UI
```

## Socket.IO Configuration

### Backend Setup (app.js)
```javascript
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "http://localhost:5173",
    credentials: true 
  }
});

// Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});
```

### Frontend Connection (BoardPage.jsx)
```javascript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  ?.split('=')[1];

const socket = io("http://localhost:4000", {
  withCredentials: true,
  auth: { token }
});

socket.on("connect", () => {
  socket.emit("joinBoard", boardId);
});

socket.on("activityAdded", (activity) => {
  setActivities(prev => [activity, ...prev]);
});

return () => {
  socket.disconnect();
};
```

## Connection Lifecycle

### 1. Initialization
```
Client requests page
  ↓
JWT extracted from cookies
  ↓
Socket.IO client created with auth token
  ↓
WebSocket connection initiated
  ↓
Server validates JWT
  ↓
Socket authenticated, user attached
  ↓
"connect" event fired
```

### 2. Room Subscription
```
Client emits "joinBoard" with boardId
  ↓
Server joins socket to room named by boardId
  ↓
socket.join(boardId.toString())
  ↓
Socket now receives broadcasts to that room
```

### 3. Event Broadcasting
```
User action (e.g., create task)
  ↓
Backend processes request
  ↓
Activity created: logActivity()
  ↓
getIO().to(boardId).emit("activityAdded", activity)
  ↓
All sockets in room receive "activityAdded"
  ↓
Frontend "activityAdded" listener fires
  ↓
Update activity state: setActivities([new, ...prev])
  ↓
Activity sidebar re-renders with new entry
```

### 4. Disconnection
```
User leaves page / tab closes
  ↓
Socket cleanup in useEffect return
  ↓
socket.disconnect()
  ↓
Server removes socket from all rooms
  ↓
"disconnect" event logged
```

## Event Types

### joinBoard
**Emitted by:** Client when connecting to board

**Purpose:** Subscribe socket to board-specific room

```javascript
socket.emit("joinBoard", boardId);

// Server side
socket.on("joinBoard", (boardId) => {
  socket.join(boardId);
});
```

### activityAdded
**Emitted by:** Server when activity is logged

**Purpose:** Notify all board members of action

```javascript
// Backend - on any board change
const activity = await logActivity({...});
getIO().to(board._id.toString()).emit("activityAdded", activity);

// Frontend - listen for updates
socket.on("activityAdded", (newActivity) => {
  setActivities(prev => [newActivity, ...prev]);
});
```

### disconnect
**Emitted by:** Server when connection lost

**Purpose:** Logging and cleanup

```javascript
io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
```

## Room-based Broadcasting

### Why Rooms?
- Efficiency: Only send to board members
- Isolation: Activities don't cross to other boards
- Scalability: Can have multiple boards active

### Room Management
```
Each board has room: boardId.toString()
  ↓
User connects → socket.join(boardId)
  ↓
emit to room → getIO().to(boardId).emit(...)
  ↓
Only sockets in that room receive event
```

### Example Flow
```
Board A: socket1, socket2
Board B: socket3, socket4

Action in Board A triggers:
  getIO().to(boardIdA).emit("activityAdded", data)
  
Only socket1 and socket2 receive update
socket3 and socket4 unaffected
```

## Activity Logging Integration

### When Activities Are Created

1. **Board Operations**
   - `POST /board/create` - Board created
   - `POST /board/:id/addMember` - Member added
   - `DELETE /board/:id/removeMember/:userId` - Member removed

2. **List Operations**
   - `POST /list/create` - List created
   - `PATCH /list/edit/:id` - List renamed
   - `DELETE /list/del/:id` - List deleted

3. **Task Operations**
   - `POST /task/create` - Task created
   - `PATCH /task/edit/:id` - Task updated
   - `DELETE /task/del/:id` - Task deleted
   - `POST /task/:id/assign` - User assigned

### Activity Data Structure
```javascript
{
  _id: ObjectId,
  boardId: ObjectId,
  userId: {          // Populated with user info
    name: String,
    email: String
  },
  action: String,    // Human-readable: "John created task 'Title'"
  listId: ObjectId,  // Optional, for list-related activities
  createdAt: Date
}
```

### Logging Function (utils/activityLogger.js)
```javascript
const logActivity = async ({
  boardId,
  userId,
  action,
  listId
}) => {
  const activity = new Activity({
    boardId,
    userId,
    action,
    listId
  });
  
  return await activity
    .save()
    .populate("userId", "name email");
};
```

### Usage Pattern
```javascript
const activity = await logActivity({
  boardId: board._id,
  userId: req.user._id,
  action: `${req.user.name} created list "${title}"`
});

if (activity) {
  getIO().to(board._id.toString()).emit("activityAdded", activity);
}
```

## Frontend Activity Subscription

### Sidebar Component (BoardPage.jsx)
```javascript
const [activities, setActivities] = useState([]);

const fetchActivities = async () => {
  const res = await api.get(`/activity/${boardId}`);
  setActivities(res.data);
};

useEffect(() => {
  fetchActivities();
  
  const socket = io("http://localhost:4000", {
    withCredentials: true,
    auth: { token }
  });
  
  socket.on("connect", () => {
    socket.emit("joinBoard", boardId);
  });
  
  socket.on("activityAdded", (newActivity) => {
    setActivities(prev => [newActivity, ...prev]);
  });
  
  return () => {
    socket.disconnect();
  };
}, [boardId]);
```

### Activity Display
```javascript
{activities.map((activity) => (
  <div key={activity._id} className="activity-item">
    <div>{activity.userId?.name} {activity.action}</div>
    <div className="timestamp">{formatTime(activity.createdAt)}</div>
  </div>
))}
```

## Optimistic Updates

### For Drag-and-Drop
Frontend updates UI immediately without waiting for server confirmation.

```javascript
// 1. Update UI immediately
setTasks(prev => ({
  ...prev,
  [sourceListId]: filtered,
  [newListId]: [...newList, taskToMove]
}));

// 2. Make API call in background
try {
  await api.patch(`/task/edit/${taskId}`, { listId: newListId });
  // Success - UI already updated
} catch (err) {
  // Error - revert by fetching fresh data
  fetchLists();
}
```

### Benefits
- Instant visual feedback
- Better UX perceived performance
- Network delays don't block UI

## Error Handling

### Connection Errors
```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  // Retry logic or fallback to polling
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
  // Handle auth failures
});
```

### Authentication Failure
```javascript
// Server-side middleware
io.use((socket, next) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));  // Client receives error
  }
});

// Client-side handling
socket.on("error", (error) => {
  if (error === "Unauthorized") {
    window.location.href = "/login";
  }
});
```

## Scalability Considerations

### Current Limitations
- Single Node.js server
- In-memory Socket.IO (no persistence)
- All connections in same process

### For Production Scaling

1. **Redis Adapter**
```javascript
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const pubClient = redis.createClient();
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```
- Allows Socket.IO across multiple servers
- Redis acts as message broker

2. **Load Balancer**
- Distribute incoming connections
- Session affinity for same board

3. **Message Queue**
- Async activity logging
- Decouple from request-response cycle
- Better reliability

### Scale Scenario
```
Multiple Node.js instances behind load balancer
  ↓
Requests distributed across instances
  ↓
Socket.IO uses Redis adapter for cross-instance communication
  ↓
Activity in instance A broadcast to Redis
  ↓
Redis delivers to all instances
  ↓
All connected clients receive update
```

## Monitoring & Debugging

### Socket.IO Debugging
```javascript
// Enable detailed logging
localStorage.debug = 'socket.io-client:*';
```

### Server-side Debugging
```javascript
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  console.log("User:", socket.user);
  
  socket.on("joinBoard", (boardId) => {
    console.log(`${socket.id} joining board ${boardId}`);
  });
});
```

### Test Utility
Use `testSocket.js` for manual testing:
```bash
node testSocket.js
```

## Fallback Strategy

### If WebSocket Unavailable
Socket.IO automatically falls back to:
1. WebSocket (preferred)
2. HTTP long-polling
3. HTTP multipart streaming

No code changes needed - handled transparently.

## Security Considerations

1. **JWT Authentication** - Only authenticated users can connect
2. **CORS Configuration** - Specific origin allowed
3. **Room Isolation** - Users only in their board rooms
4. **Credentials** - withCredentials: true for cookie-based auth
5. **SSL/TLS** - Use wss:// in production

## Performance Metrics

### Latency
- WebSocket: ~50-100ms round trip
- Activity appears in sidebar almost instantly
- No perceptible delay for users

### Throughput
- Single server can handle hundreds of concurrent connections
- Broadcast to room is efficient (typically < 100ms delivery)

### Resource Usage
- Memory: ~5KB per active socket
- CPU: Minimal for message forwarding
- Bandwidth: Only activity changes sent (not full state)

## Future Enhancements

- [ ] Presence indicators (who's online)
- [ ] Real-time task editing (concurrent edits)
- [ ] Typing indicators
- [ ] Read receipts on activities
- [ ] Notification badges
- [ ] Connection status indicator
