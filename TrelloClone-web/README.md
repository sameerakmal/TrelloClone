# Hintro - Frontend

A modern Trello clone built with React 19, Vite, and real-time Socket.IO updates.

## Architecture Overview

### Technology Stack
- **React 19** - UI library with hooks and context API
- **Vite** - Fast build tool with HMR
- **React Router v7** - Client-side routing
- **Tailwind CSS 4** - Utility-first styling
- **@dnd-kit/core** - Drag-and-drop functionality
- **Axios** - HTTP client with interceptors
- **Socket.io-client** - Real-time communication

### Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Global navigation with search
│   ├── List.jsx            # Board lists container
│   └── Task.jsx            # Individual task cards with assignment
├── pages/
│   ├── Boards.jsx          # Board listing and creation
│   ├── BoardPage.jsx       # Main board workspace with activity
│   ├── Login.jsx           # Authentication page
│   └── Register.jsx        # User registration
├── context/
│   └── SearchContext.jsx   # Global search state management
├── api/
│   └── axios.js            # Configured HTTP client
├── App.jsx                 # Main app component with routes
└── main.jsx                # Entry point
```

### Key Features

#### 1. **State Management**
- **React Context API** for global search state
- **Local state** for component-level data (boards, lists, tasks)
- Real-time updates via Socket.IO

#### 2. **Search System**
- Context-aware search using `SearchContext`
- Searches boards on `/boards` page
- Searches tasks on individual board pages
- Integrated in navbar with location detection

#### 3. **Real-time Updates**
- Socket.IO connection with JWT authentication
- Activity log updates broadcast to all board members
- Optimistic UI updates for drag-and-drop operations

#### 4. **Drag-and-Drop**
- `@dnd-kit/core` library for task movement between lists
- Optimistic UI update immediately
- API call in background with error recovery

#### 5. **User Assignment**
- Assign board members to tasks via modal
- View assigned users as badges on task cards
- Real-time member management (add/remove)

#### 6. **Activity Logging**
- Real-time activity sidebar showing all board operations
- Displays who did what and when
- Socket-based updates for live feed

### Component Hierarchy

```
App
├── Navbar
├── Login/Register
├── Boards
│   └── Board Cards (with delete)
└── BoardPage
    ├── List (multiple)
    │   ├── Task (multiple)
    │   │   └── Assign Modal
    │   └── Add Task Form
    ├── Members Modal
    ├── Activity Sidebar
    └── Add List Form
```

### Data Flow

1. **Initialization**: Components fetch data via Axios on mount
2. **User Actions**: Trigger API calls and optimistic UI updates
3. **Broadcast**: Backend emits Socket.IO events to board room
4. **Real-time Update**: All connected clients receive activity updates
5. **Search Filtering**: SearchContext updates filter displayed items

### API Integration

All HTTP requests go through configured Axios instance with:
- Base URL: `http://localhost:4000`
- Credentials: Enabled (for cookies)
- JWT tokens sent via secure cookies
- 401 interceptor for auth failures

### Socket.IO Connection

- Connects with JWT token from cookies
- Authenticates at [app.js](../TrelloClone-back/src/app.js#L24-L33)
- Joins board-specific rooms for targeted broadcasts
- Emits and listens for activity events

### Styling

- **Tailwind CSS 4** with custom gradients
- Glassmorphism effects for modals
- Responsive grid layouts
- Hover transitions and animations
- Dark/light mode compatible utility classes
