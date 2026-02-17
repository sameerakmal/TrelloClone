# API Contract

## Overview
RESTful API specification with request/response examples for Hintro backend.

## Base URL
```
http://localhost:4000
```

## Authentication
All protected endpoints require JWT token in httpOnly cookie named `token`.

## Response Format
```javascript
Success (2xx):
{
  message: String,
  data: Object | Array
}

Error (4xx, 5xx):
{
  message: String,
  error: String
}

Status Codes:
- 200: OK
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Internal Server Error
```

---

## Authentication Routes

### POST /register
Register a new user account.

**Request:**
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, min 6 chars)
}
```

**Response (201):**
```javascript
{
  message: "User created successfully",
  data: {
    _id: ObjectId,
    name: String,
    email: String,
    createdAt: Date
  }
}
```

**Errors:**
- 400: User already exists
- 400: Invalid email format
- 400: Password too short

---

### POST /login
Authenticate user and receive JWT token.

**Request:**
```javascript
{
  email: String (required),
  password: String (required)
}
```

**Response (200):**
```javascript
{
  message: "Login successful",
  data: {
    _id: ObjectId,
    name: String,
    email: String
  }
}
```
*Note: JWT token set as httpOnly cookie `token`*

**Errors:**
- 400: Invalid email/password
- 404: User not found

---

### POST /logout
Clear authentication token.

**Request:**
- No body required

**Response (200):**
```javascript
{
  message: "Logout successful"
}
```

---

### GET /profile
Get current authenticated user info.

**Auth:** Required (protected route)

**Request:**
- No body required

**Response (200):**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  createdAt: Date
}
```

**Errors:**
- 401: Unauthorized (no token)
- 401: Invalid token

---

## Board Routes

### POST /board/create
Create a new board.

**Auth:** Required

**Request:**
```javascript
{
  title: String (required),
  description: String (optional)
}
```

**Response (201):**
```javascript
{
  message: "Board created successfully",
  data: {
    _id: ObjectId,
    title: String,
    description: String,
    owner: ObjectId,
    members: [ObjectId],
    createdAt: Date
  }
}
```

---

### GET /boards
Get all boards user is member of.

**Auth:** Required

**Query Params:**
- None

**Response (200):**
```javascript
[
  {
    _id: ObjectId,
    title: String,
    description: String,
    owner: ObjectId,
    members: [ObjectId],
    createdAt: Date
  }
]
```

---

### GET /board/:id
Get single board with populated members.

**Auth:** Required

**URL Params:**
- `id` - Board ObjectId

**Response (200):**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  owner: ObjectId,
  members: [
    {
      _id: ObjectId,
      name: String,
      email: String
    }
  ],
  createdAt: Date
}
```

**Errors:**
- 404: Board not found

---

### DELETE /board/del/:id
Delete board (owner only).

**Auth:** Required

**URL Params:**
- `id` - Board ObjectId

**Response (200):**
```javascript
{
  message: "Board deleted successfully"
}
```

**Errors:**
- 404: Board not found
- 403: Not authorized (not owner)

---

### POST /board/:id/addMember
Add member to board by email (owner only).

**Auth:** Required

**URL Params:**
- `id` - Board ObjectId

**Request:**
```javascript
{
  email: String (required, registered user)
}
```

**Response (200):**
```javascript
{
  message: "Member added successfully",
  board: {
    _id: ObjectId,
    title: String,
    members: [{ _id, name, email }]
  }
}
```

**Errors:**
- 403: Only board owner can add members
- 404: User not found with this email
- 400: User is already a member
- 404: Board not found

---

### DELETE /board/:id/removeMember/:userId
Remove member from board.

**Auth:** Required

**URL Params:**
- `id` - Board ObjectId
- `userId` - User ObjectId to remove

**Response (200):**
```javascript
{
  message: "Member removed successfully",
  board: {
    _id: ObjectId,
    members: [{ _id, name, email }]
  }
}
```

**Errors:**
- 403: Not authorized (owner only or removing self)
- 400: Cannot remove board owner
- 404: Board not found

---

## List Routes

### POST /list/create
Create a new list in board.

**Auth:** Required

**Request:**
```javascript
{
  title: String (required),
  boardId: ObjectId (required),
  order: Number (required, array index)
}
```

**Response (201):**
```javascript
{
  message: "List created successfully",
  data: {
    _id: ObjectId,
    title: String,
    boardId: ObjectId,
    order: Number,
    createdAt: Date
  }
}
```

---

### GET /lists/:boardId
Get all lists in a board (sorted by order).

**Auth:** Required

**URL Params:**
- `boardId` - Board ObjectId

**Response (200):**
```javascript
[
  {
    _id: ObjectId,
    title: String,
    boardId: ObjectId,
    order: Number,
    createdAt: Date
  }
]
```

---

### PATCH /list/edit/:id
Update list title.

**Auth:** Required

**URL Params:**
- `id` - List ObjectId

**Request:**
```javascript
{
  title: String (required)
}
```

**Response (200):**
```javascript
{
  _id: ObjectId,
  title: String,
  boardId: ObjectId,
  order: Number,
  createdAt: Date
}
```

---

### DELETE /list/del/:id
Delete list and all contained tasks.

**Auth:** Required

**URL Params:**
- `id` - List ObjectId

**Response (200):**
```javascript
{
  message: "List deleted successfully"
}
```

---

## Task Routes

### POST /task/create
Create a new task in list.

**Auth:** Required

**Request:**
```javascript
{
  title: String (required),
  listId: ObjectId (required),
  boardId: ObjectId (required)
}
```

**Response (201):**
```javascript
{
  message: "Task created successfully",
  data: {
    _id: ObjectId,
    title: String,
    listId: ObjectId,
    boardId: ObjectId,
    assignedUsers: [],
    createdAt: Date,
    updatedAt: Date
  }
}
```

---

### GET /tasks/:listId
Get all tasks in a list with assigned users.

**Auth:** Required

**URL Params:**
- `listId` - List ObjectId

**Response (200):**
```javascript
[
  {
    _id: ObjectId,
    title: String,
    listId: ObjectId,
    boardId: ObjectId,
    assignedUsers: [
      {
        _id: ObjectId,
        name: String,
        email: String
      }
    ],
    createdAt: Date,
    updatedAt: Date
  }
]
```

---

### PATCH /task/edit/:id
Update task (title, listId for moving).

**Auth:** Required

**URL Params:**
- `id` - Task ObjectId

**Request:**
```javascript
{
  title: String (optional),
  listId: ObjectId (optional)
}
```

**Response (200):**
```javascript
{
  _id: ObjectId,
  title: String,
  listId: ObjectId,
  boardId: ObjectId,
  assignedUsers: [],
  createdAt: Date,
  updatedAt: Date
}
```

---

### DELETE /task/del/:id
Delete a task.

**Auth:** Required

**URL Params:**
- `id` - Task ObjectId

**Response (200):**
```javascript
{
  message: "Task deleted successfully"
}
```

---

### POST /task/:id/assign
Assign/reassign users to a task.

**Auth:** Required

**URL Params:**
- `id` - Task ObjectId

**Request:**
```javascript
{
  assignedUsers: [ObjectId] (array of User IDs)
}
```

**Response (200):**
```javascript
{
  _id: ObjectId,
  title: String,
  listId: ObjectId,
  boardId: ObjectId,
  assignedUsers: [
    {
      _id: ObjectId,
      name: String,
      email: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Activity Routes

### GET /activity/:boardId
Get activity log for a board (paginated, newest first).

**Auth:** Required

**URL Params:**
- `boardId` - Board ObjectId

**Query Params:**
- `limit` - Number of results (default 50)
- `skip` - Pagination offset (default 0)

**Response (200):**
```javascript
[
  {
    _id: ObjectId,
    boardId: ObjectId,
    userId: {
      _id: ObjectId,
      name: String,
      email: String
    },
    action: String (formatted description),
    listId: ObjectId (optional),
    createdAt: Date
  }
]
```

---

## Error Response Examples

### 401 Unauthorized
```javascript
{
  message: "Unauthorized",
  error: "Invalid or missing token"
}
```

### 403 Forbidden
```javascript
{
  message: "Forbidden",
  error: "Only board owner can perform this action"
}
```

### 404 Not Found
```javascript
{
  message: "Not Found",
  error: "Board not found"
}
```

### 400 Bad Request
```javascript
{
  message: "Bad Request",
  error: "User is already a member"
}
```

---

## Rate Limiting
Currently not implemented. Recommended for production.

## Versioning
Current version: v1 (no version prefix)

## Future Endpoints
- Task comments: `POST /task/:id/comment`
- File attachments: `POST /task/:id/attachment`
- Notifications: `GET /notifications`
- Templates: `GET /templates`
