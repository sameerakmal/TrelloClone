# Hintro - Backend

A Node.js/Express REST API for Trello clone with real-time Socket.IO updates, MongoDB persistence, and JWT authentication.

## Architecture Overview

### Technology Stack
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **Dotenv** - Environment variable management

### Project Structure

```
src/
├── routes/
│   ├── authRoute.js          # Authentication endpoints (register, login, logout, profile)
│   ├── boardRoute.js         # Board CRUD and member management
│   ├── listRoute.js          # List CRUD operations
│   ├── taskRoute.js          # Task CRUD and user assignment
│   └── activityRoute.js      # Activity log retrieval
├── models/
│   ├── user.js               # User schema and validation
│   ├── board.js              # Board schema with members
│   ├── list.js               # List schema with order
│   ├── task.js               # Task schema with assignments
│   └── activity.js           # Activity log schema
├── middlewares/
│   └── auth.js               # JWT authentication middleware
├── utils/
│   ├── activityLogger.js     # Activity creation and logging
│   └── validation.js         # Input validation helpers
├── config/
│   └── database.js           # MongoDB connection
├── socket.js                 # Socket.IO event handlers
├── app.js                    # Express app setup
├── testSocket.js             # Socket.IO testing utility
└── package.json              # Dependencies
```

### Database Models

#### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

#### Board
```javascript
{
  title: String,
  description: String,
  owner: ObjectId (User),
  members: [ObjectId] (User array),
  createdAt: Date
}
```

#### List
```javascript
{
  title: String,
  boardId: ObjectId (Board),
  order: Number,
  createdAt: Date
}
```

#### Task
```javascript
{
  title: String,
  listId: ObjectId (List),
  boardId: ObjectId (Board),
  assignedUsers: [ObjectId] (User array),
  createdAt: Date,
  updatedAt: Date
}
```

#### Activity
```javascript
{
  boardId: ObjectId (Board),
  userId: ObjectId (User) - populated with name, email
  action: String (description of action),
  listId: ObjectId (List) - optional
  createdAt: Date
}
```

### API Routes

#### Authentication (`authRoute.js`)
- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `POST /logout` - Clear auth cookie
- `GET /profile` - Get current user info (protected)

#### Boards (`boardRoute.js`)
- `POST /board/create` - Create new board (protected)
- `GET /boards` - Get all user's boards (protected)
- `GET /board/:id` - Get board with populated members (protected)
- `DELETE /board/del/:id` - Delete board (protected, owner only)
- `POST /board/:id/addMember` - Add member by email (protected, owner only)
- `DELETE /board/:id/removeMember/:userId` - Remove member (protected, owner or self)

#### Lists (`listRoute.js`)
- `POST /list/create` - Create list (protected)
- `GET /lists/:boardId` - Get all lists for board (protected)
- `PATCH /list/edit/:id` - Update list title (protected)
- `DELETE /list/del/:id` - Delete list (protected)

#### Tasks (`taskRoute.js`)
- `POST /task/create` - Create task (protected)
- `GET /tasks/:listId` - Get all tasks for list (protected)
- `PATCH /task/edit/:id` - Update task (protected)
- `DELETE /task/del/:id` - Delete task (protected)
- `POST /task/:id/assign` - Assign user to task (protected)

#### Activity (`activityRoute.js`)
- `GET /activity/:boardId` - Get activity log for board (protected)

### Authentication Flow

1. **Registration**: Hash password with bcrypt, store user
2. **Login**: Verify credentials, sign JWT, send as httpOnly cookie
3. **Protected Routes**: Middleware extracts JWT from cookie, verifies, attaches user to request
4. **Logout**: Clear cookie from client

### Activity Logging System

**Logged Events:**
- Board creation
- Member add/remove
- List create/edit/delete
- Task create/edit/delete/assign

**Implementation:**
- `logActivity()` utility creates activity and populates user info
- Emits Socket.IO event to board room immediately
- Activity includes formatted user name and action description

### Socket.IO Implementation

#### Authentication
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.user = decoded;
  next();
});
```

#### Events
- **joinBoard** - Client joins specific board room
- **activityAdded** - Broadcast to board room when activity occurs
- **disconnect** - Handle client disconnection

#### CORS Configuration
- Origin: `http://localhost:5173`
- Credentials: Enabled
- Prevents wildcard with credentials error

### Middleware

#### Authentication (`auth.js`)
- Extracts JWT from cookies
- Verifies token signature
- Attaches user object to request
- Returns 401 if invalid/missing

### Key Features

#### 1. **Board Member Management**
- Only owner can add members
- Members must be registered users
- Can self-remove or owner can remove
- Cannot remove owner
- All operations logged

#### 2. **Task Assignment**
- Assign multiple users to single task
- User must be board member
- Assignments are tracked in activity log
- Frontend displays assigned users

#### 3. **Real-time Activity**
- All operations emit Socket.IO events
- Broadcasts to specific board room
- Includes populated user information
- Timestamp for all activities

#### 4. **Data Population**
- User info populated on boards, activities
- Task assignments expanded to full user objects
- Efficient query with Mongoose populate

### Error Handling

- Try-catch blocks on all routes
- Descriptive error messages
- Appropriate HTTP status codes (400, 403, 404)
- Validation on inputs

### Environment Variables

```
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
```

### Running the Server

```bash
npm install
npm start
```

Server listens on `http://localhost:4000`

### Testing Socket.IO

Use `testSocket.js` to test real-time connections:
```bash
node testSocket.js
```
