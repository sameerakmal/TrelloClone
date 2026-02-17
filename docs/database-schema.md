# Database Schema

## Collections Overview

Hintro uses MongoDB with Mongoose ODM. Total of 5 main collections with relationships.

## User Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed with bcrypt),
  createdAt: Timestamp (auto)
}
```

**Indexes:**
- `email` - Unique index for fast lookups
- `_id` - Default primary key

**Queries:**
- Find by email: `User.findOne({ email })`
- Find by ID: `User.findById(id)`
- Find all: `User.find()`

## Board Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String (optional),
  owner: ObjectId (ref: User, required),
  members: [ObjectId] (ref: User, array),
  createdAt: Timestamp (auto)
}
```

**Relationships:**
- `owner` - Single User (board creator)
- `members` - Array of Users (all board members including owner)

**Indexes:**
- `_id` - Primary key
- `owner` - For finding owner's boards

**Queries:**
- User's boards: `Board.find({ members: userId })`
- Board by ID (populated): `Board.findById(id).populate("members", "name email")`
- Delete board: `Board.findByIdAndDelete(id)`

**Operations:**
- Add member: `board.members.push(userId)` then save
- Remove member: `board.members.filter(m => !m.equals(userId))` then save

## List Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  boardId: ObjectId (ref: Board, required),
  order: Number (position in board),
  createdAt: Timestamp (auto)
}
```

**Relationships:**
- `boardId` - Refers to parent Board

**Indexes:**
- `_id` - Primary key
- `boardId` - For finding lists in board

**Queries:**
- Lists in board: `List.find({ boardId }).sort({ order: 1 })`
- Single list: `List.findById(id)`
- Delete list: `List.findByIdAndDelete(id)`

**Operations:**
- Create: Set order as array length
- Update: `List.findByIdAndUpdate(id, { title })`
- Reorder: Update order field

## Task Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  listId: ObjectId (ref: List, required),
  boardId: ObjectId (ref: Board, required),
  assignedUsers: [ObjectId] (ref: User, array),
  createdAt: Timestamp (auto),
  updatedAt: Timestamp (auto)
}
```

**Relationships:**
- `listId` - Parent List
- `boardId` - Parent Board (denormalized for quick access)
- `assignedUsers` - Array of Users

**Indexes:**
- `_id` - Primary key
- `listId` - For finding tasks in list
- `boardId` - For finding tasks in board

**Queries:**
- Tasks in list: `Task.find({ listId }).populate("assignedUsers", "name email")`
- Single task (populated): `Task.findById(id).populate("assignedUsers", "name email")`
- Delete task: `Task.findByIdAndDelete(id)`

**Operations:**
- Create: Provide title, listId, boardId
- Move: `Task.findByIdAndUpdate(id, { listId: newListId })`
- Assign user: `task.assignedUsers.push(userId)` then save
- Unassign user: `task.assignedUsers.filter(u => !u.equals(userId))` then save

## Activity Collection

```javascript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, required),
  userId: ObjectId (ref: User, required),
  action: String (description, required),
  listId: ObjectId (ref: List, optional),
  createdAt: Timestamp (auto)
}
```

**Relationships:**
- `boardId` - Which board activity happened on
- `userId` - Which user performed action
- `listId` - Optional, if action related to specific list

**Indexes:**
- `_id` - Primary key
- `boardId` - For fetching board activity log

**Queries:**
- Board activity (populated): 
  ```javascript
  Activity.find({ boardId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
  ```

**Sample Actions:**
```
"John created list 'To Do'"
"Sarah assigned task to Mike"
"Admin deleted list 'Done'"
"User added 'jane@example.com' to board"
"User removed 'bob@example.com' from board"
```

## Relationship Diagram

```
┌─────────────────────────────────────────┐
│              User                       │
│  _id, name, email, password             │
└─────────────────────────────────────────┘
        │               │                   │
        │               │                   │
    ╔═══╩═══╗      ╔════╩════╗      ╔══════╩══════╗
    │  owner│      │ members │      │ assignedUser│
    │       │      │   of    │      │      of     │
    ▼       ▼      ▼         ▼      ▼             ▼
┌──────────────┐┌──────────────┐ ┌──────────────┐
│     Board    ││  Board       │ │    Task      │
│ title, owner││  members[]   │ │ assignedUsers│
└──────────────┘└──────────────┘ └──────────────┘
      │ (parent)                       │ (parent)
      │                                │
      ▼                                ▼
┌──────────────┐                ┌──────────────┐
│     List     │                │   Activity   │
│ boardId, _id │                │   userId     │
└──────────────┘                │   action     │
      │ (parent)                └──────────────┘
      │
      ▼
┌──────────────┐
│     Task     │
│  listId      │
└──────────────┘
```

## Data Consistency Rules

### Cascade Operations
- **Delete Board** - Should delete related Lists, Tasks, Activities
- **Delete List** - Should delete related Tasks
- **Delete User** - Remove from all boards/tasks (manual cleanup)

### Denormalization Strategy
- Task has both `listId` and `boardId` (avoids multiple joins)
- Activity stores formatted `action` string (not reconstructed)

### Population Strategy
```javascript
// Efficient: Only get needed fields
Board.findById(id).populate("members", "name email")

// Full population for activity
Activity.find({ boardId })
  .populate("userId", "name email")
  .sort({ createdAt: -1 })
```

## Query Patterns

### Creating
```javascript
// User
await User.create({ name, email, password: hashed })

// Board
await Board.create({ title, description, owner, members: [owner] })

// List
await List.create({ title, boardId, order })

// Task
await Task.create({ title, listId, boardId, assignedUsers: [] })

// Activity
await Activity.create({ boardId, userId, action, listId })
```

### Reading
```javascript
// Get user's boards
const boards = await Board.find({ members: userId })

// Get board with members
const board = await Board.findById(id).populate("members", "name email")

// Get lists in board
const lists = await List.find({ boardId }).sort({ order: 1 })

// Get tasks in list (with assignments)
const tasks = await Task.find({ listId })
  .populate("assignedUsers", "name email")

// Get activity (with user info)
const activities = await Activity.find({ boardId })
  .populate("userId", "name email")
  .sort({ createdAt: -1 })
  .limit(50)
```

### Updating
```javascript
// Rename list
await List.findByIdAndUpdate(id, { title: newTitle })

// Move task
await Task.findByIdAndUpdate(id, { listId: newListId })

// Update board
await Board.findByIdAndUpdate(id, { title, description })
```

### Deleting
```javascript
// Delete board and cascade
await List.deleteMany({ boardId: boardId })
await Task.deleteMany({ boardId: boardId })
await Activity.deleteMany({ boardId: boardId })
await Board.findByIdAndDelete(boardId)

// Delete task
await Task.findByIdAndDelete(taskId)

// Remove user from board
board.members = board.members.filter(m => !m.equals(userId))
await board.save()
```

## Data Validation

### Schema Level
- Required fields: name, email, password, title, etc.
- Unique: email field
- Type validation: String, ObjectId, Array, etc.

### Application Level
- Email format validation
- Password strength
- Board membership verification
- Ownership checks

## Performance Considerations

### Indexes
- Email field indexed for user lookup
- BoardId indexed for quick list/task queries
- Consider composite indexes if needed

### Query Optimization
- Use `populate()` for relationships
- Use `.sort({ order: 1 })` for list ordering
- Use `.select()` to exclude password from queries
- Use `.limit()` for activity logs

### Caching Opportunities
- User data (changes rarely)
- Board data (changes on member add/remove)
- Activity log (only append, no updates)

## Migration Notes

### Initial Setup
- Create MongoDB database
- Collections auto-created by Mongoose on first write
- Indexes created during schema definition

### Backup Strategy
- MongoDB Atlas automatic backups
- Export critical data regularly
- Version control for schema changes

## Future Extensions

### Potential Collections
- **Comments** - Comments on tasks
- **Attachments** - File storage
- **Notifications** - User notifications
- **Templates** - Board templates
- **Labels** - Task labels/tags
