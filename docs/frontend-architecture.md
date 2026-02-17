# Frontend Architecture

## Overview
React 19 + Vite-based single-page application for Hintro (Trello clone) with real-time updates and drag-and-drop functionality.

## Technology Stack
- **React 19** - UI library with hooks
- **Vite** - Fast build tool with HMR
- **React Router v7** - Client-side routing
- **Tailwind CSS 4** - Utility-first styling
- **@dnd-kit/core** - Drag-and-drop library
- **Axios** - HTTP client with interceptors
- **Socket.io-client** - Real-time communication

## Directory Structure

```
TrelloClone-web/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation with logo and search
│   │   ├── List.jsx            # List container component
│   │   └── Task.jsx            # Task card with assignment UI
│   ├── pages/
│   │   ├── Boards.jsx          # Board listing page
│   │   ├── BoardPage.jsx       # Main board workspace
│   │   ├── Login.jsx           # Login page
│   │   └── Register.jsx        # Registration page
│   ├── context/
│   │   └── SearchContext.jsx   # Global search state
│   ├── api/
│   │   └── axios.js            # HTTP client config
│   ├── App.jsx                 # Root component with routes
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── public/                      # Static assets
└── vite.config.js              # Vite configuration
```

## Component Architecture

### Page Components

#### **App.jsx** (Root)
- Routes setup with React Router
- SearchProvider wrapper for global search
- Navbar conditional rendering
- Authentication flow

#### **Login.jsx**
- Email/password authentication form
- Stores JWT in httpOnly cookie
- Redirects to /boards on success

#### **Register.jsx**
- User registration form
- Creates new user account
- Auto-login after registration

#### **Boards.jsx**
- Lists all boards user is member of
- Create new board functionality
- Delete board with confirmation
- Search filtering via SearchContext
- Grid layout with board cards

#### **BoardPage.jsx**
- Main workspace with lists and tasks
- Drag-and-drop task movement
- Members modal (add/remove)
- Activity sidebar (real-time log)
- Add list functionality
- Socket.IO connection setup

### Feature Components

#### **Navbar.jsx**
```
├── Logo/Brand (Hintro)
├── Search Input (context-aware)
├── User Welcome
├── Logout Button
```
- Dynamic search placeholder based on current page
- Routes to /boards for board search
- Routes to /board/:id for task search

#### **List.jsx**
```
├── List Header (title, edit, delete)
├── Tasks Container
└── Add Task Form
```
- Renders all tasks in list
- Passes boardMembers to Task components
- Handles list operations

#### **Task.jsx**
```
├── Task Title
├── Assigned Users (badges)
└── Assign Modal
```
- Displays assigned user avatars
- Modal for assigning/removing users
- Only allows board members
- Real-time update on assign

### Context & State Management

#### **SearchContext.jsx**
- Global search query state
- `useSearch()` hook for consumption
- Updated by Navbar input
- Consumed by Boards and BoardPage

## State Flow

```
Global State (SearchContext)
    ↓
Navbar (updates search)
    ↓
Boards.jsx / BoardPage.jsx (filters data)
    ↓
Component re-render with filtered data
```

## Data Fetching Pattern

1. **Initial Load** - `useEffect` on component mount
2. **Axios Request** - Configured with credentials
3. **State Update** - Store response in local state
4. **Error Handling** - Console log or user alert
5. **Refetch** - Manual trigger after mutations

## Real-time Updates

### Socket.IO Connection
```javascript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('token='))
  ?.split('=')[1];

const socket = io("http://localhost:4000", {
  withCredentials: true,
  auth: { token }
});

socket.emit("joinBoard", boardId);
socket.on("activityAdded", updateActivities);
```

### Event Flow
1. User action on frontend
2. HTTP request to backend
3. Backend processes and logs activity
4. Socket.IO broadcasts to board room
5. All connected clients receive update
6. Activity sidebar refreshes in real-time

## Drag-and-Drop Implementation

### Using @dnd-kit
```javascript
<DndContext 
  collisionDetection={closestCorners}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* Draggable items */}
</DndContext>
```

### Optimistic Updates
1. UI updates immediately on drag end
2. API call sent in background
3. If API fails, fetch lists to revert

## Authentication Flow

1. **Login/Register** - Submit credentials
2. **Backend Response** - JWT in httpOnly cookie
3. **Axios Interceptor** - Cookie sent with every request
4. **Protected Routes** - Check user context
5. **401 Handler** - Redirect to login on auth failure
6. **Logout** - Clear cookie, navigate to login

## Styling Strategy

- **Tailwind CSS 4** - Utility classes
- **Gradients** - Brand colors (blue to purple)
- **Responsive** - Mobile-first approach
- **Transitions** - Smooth hover effects
- **Modals** - Glassmorphism with fixed positioning
- **Animations** - Slide-in effects for sidebars

## Performance Optimizations

1. **HMR** - Fast refresh with Vite
2. **Code Splitting** - Route-based lazy loading (optional)
3. **Memoization** - React.memo for expensive components
4. **Debouncing** - Search input debounce
5. **Optimistic Updates** - Instant UI feedback

## Error Handling

- HTTP errors caught in try-catch
- User-friendly alert messages
- Console logging for debugging
- Form validation before submission

## Accessibility Considerations

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus management in modals

## Build & Deployment

```bash
npm install
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview build
```

Output: `dist/` folder ready for deployment
