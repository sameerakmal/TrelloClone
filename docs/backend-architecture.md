# Backend Architecture

## Overview
Node.js + Express REST API with MongoDB persistence, JWT authentication, and Socket.IO real-time updates.

## Technology Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for data modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing

## Project Structure

```
TrelloClone-back/
├── src/
│   ├── routes/
│   │   ├── authRoute.js          # Auth endpoints
│   │   ├── boardRoute.js         # Board CRUD & members
│   │   ├── listRoute.js          # List CRUD
│   │   ├── taskRoute.js          # Task CRUD & assignment
│   │   └── activityRoute.js      # Activity retrieval
│   ├── models/
│   │   ├── user.js               # User schema
│   │   ├── board.js              # Board schema
│   │   ├── list.js               # List schema
│   │   ├── task.js               # Task schema
│   │   └── activity.js           # Activity schema
│   ├── middlewares/
│   │   └── auth.js               # JWT verification
│   ├── utils/
│   │   ├── activityLogger.js     # Activity logging
│   │   └── validation.js         # Input validators
│   ├── config/
│   │   └── database.js           # MongoDB connection
│   ├── socket.js                 # Socket.IO handlers
│   ├── app.js                    # Express app setup
│   └── testSocket.js             # Socket testing
├── package.json
└── .env                          # Environment config
```

## Architecture Layers

### 1. API Layer (routes/)
Handles HTTP requests and responses

```
Request → Middleware (auth) → Route Handler → Model → Response
```

### 2. Business Logic Layer (utils/)
- Activity logging
- Input validation
- Data transformation

### 3. Data Layer (models/)
- Schema definitions
- Database interactions
- Data validation rules

### 4. Real-time Layer (socket.js)
- WebSocket connections
- Event broadcasting
- Room management

## API Design

### RESTful Endpoints

```
Authentication:
  POST   /register
  POST   /login
  POST   /logout
  GET    /profile

Boards:
  POST   /board/create
  GET    /boards
  GET    /board/:id
  DELETE /board/del/:id
  POST   /board/:id/addMember
  DELETE /board/:id/removeMember/:userId

Lists:
  POST   /list/create
  GET    /lists/:boardId
  PATCH  /list/edit/:id
  DELETE /list/del/:id

Tasks:
  POST   /task/create
  GET    /tasks/:listId
  PATCH  /task/edit/:id
  DELETE /task/del/:id
  POST   /task/:id/assign

Activity:
  GET    /activity/:boardId
```

### Status Codes
- **200** - Success
- **400** - Bad request (validation error)
- **401** - Unauthorized
- **403** - Forbidden (no permission)
- **404** - Not found
- **500** - Server error

## Authentication Strategy

### JWT Flow
```
1. User Login/Register
   ↓
2. Backend creates JWT token
   ↓
3. Send as httpOnly cookie (secure)
   ↓
4. Frontend includes cookie in requests
   ↓
5. Middleware verifies token
   ↓
6. Attach user to request object
```

### Security Features
- **httpOnly cookies** - Prevents XSS attacks
- **JWT Secret** - Signed tokens
- **Password Hashing** - Bcrypt with salt
- **CORS Configuration** - Specific origins
- **Credential Mode** - Enabled for cookies

## Socket.IO Implementation

### Connection Lifecycle
```
Client connects
    ↓
JWT verification via middleware
    ↓
Socket authenticated, user attached
    ↓
Client joins board room
    ↓
Listen for events
    ↓
Disconnect or timeout
```

### Event Types
- **joinBoard** - Subscribe to board updates
- **activityAdded** - Broadcast on any board change
- **disconnect** - Cleanup on connection loss

### Broadcasting Strategy
```
Activity occurs on server
    ↓
Create activity log
    ↓
Emit to specific board room
    ↓
All connected clients in room receive update
    ↓
Frontend updates activity sidebar
```

## Data Modeling

### Relationships
```
User (many-to-many) Board
Board (one-to-many) List
List (one-to-many) Task
Task (many-to-many) User (assignments)
Board (one-to-many) Activity
```

### Mongoose Population
```javascript
Board.find().populate("members", "name email")
Task.find().populate("assignedUsers", "name email")
Activity.find().populate("userId", "name email")
```

## Middleware Stack

### app.js Setup Order
```
1. Environment variables (.env)
2. Express.json() - Parse JSON
3. Cookie parser - Parse cookies
4. CORS - Allow cross-origin
5. Route handlers - API endpoints
6. Error handling - Catch-all
```

### Authentication Middleware
```javascript
const userAuth = (req, res, next) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
};
```

Applied to all protected routes with `userAuth`

## Activity Logging System

### What Gets Logged
- Board creation
- Member add/remove
- List create/edit/delete
- Task create/edit/delete/assign

### Implementation
```javascript
const activity = await logActivity({
  boardId: board._id,
  userId: req.user._id,
  action: `${req.user.name} performed action`,
  listId: (optional)
});

// Emit to Socket.IO room
getIO().to(board._id.toString()).emit("activityAdded", activity);
```

### Activity Format
```javascript
{
  _id: ObjectId,
  boardId: ObjectId,
  userId: { name, email },      // Populated
  action: String,
  listId: ObjectId (optional),
  createdAt: Date
}
```

## Authorization Model

### Board Access
- User must be in `board.members` array
- Owner has special permissions (delete, add/remove members)

### List Access
- Implicit through board membership

### Task Access
- Implicit through board membership

## Error Handling Pattern

```javascript
try {
  // Validate input
  if (!input) return res.status(400).send("Invalid");
  
  // Check authorization
  if (!authorized) return res.status(403).send("Not authorized");
  
  // Database operation
  const result = await Model.operation();
  
  // Return success
  res.json(result);
  
} catch (err) {
  res.status(500).send("Error: " + err.message);
}
```

## Database Connection

```javascript
mongoose.connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("Server ready");
    });
  })
  .catch(err => {
    console.error("Connection failed:", err);
  });
```

- Async connection on startup
- Server starts after DB connection
- Connection pooling for efficiency

## Environment Configuration

```env
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Performance Considerations

1. **Database Indexing** - User email unique index
2. **Query Optimization** - Populate only needed fields
3. **Socket.IO Rooms** - Broadcast to specific board only
4. **Error Recovery** - Graceful error handling
5. **Connection Pooling** - MongoDB default pooling

## Scalability Approach

### Current Limitations
- Single server instance
- In-memory Socket.IO (not persisted)
- All operations synchronous

### Future Scaling
- Load balancer for multiple instances
- Redis adapter for Socket.IO
- Message queue for activity logging
- Database replication
- Caching layer (Redis)

## Testing Strategy

### Unit Testing
- Middleware functions
- Utility functions
- Data validation

### Integration Testing
- Route handlers
- Database interactions
- Socket events

### Manual Testing
- Use testSocket.js for Socket.IO verification
- Postman/Insomnia for API endpoints
- Browser DevTools for frontend integration

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection string set
- [ ] JWT secret configured
- [ ] CORS origins whitelisted
- [ ] Socket.IO CORS configured
- [ ] Error handling in place
- [ ] Logging system active
- [ ] Tests passing
