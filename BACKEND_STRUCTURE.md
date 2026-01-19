# Backend Structure

The backend server is located in the `server/` directory.

## Directory Structure

```
server/
├── index.js              # Main server entry point
├── package.json          # Backend dependencies
├── config/
│   └── upload.js         # File upload configuration
├── database/
│   ├── db.js             # Database initialization and queries
│   └── support.db        # SQLite database file (created automatically)
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   ├── auth.js           # Authentication routes (login, register)
│   ├── tickets.js        # Ticket management routes
│   └── users.js          # User management routes
└── uploads/              # Directory for uploaded files (created automatically)
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Tickets (`/api/tickets`)
- `GET /api/tickets` - Get all tickets (filtered by user role)
- `GET /api/tickets/:id` - Get single ticket with conversations and attachments
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket (status, priority, assignee)
- `POST /api/tickets/:id/conversations` - Add reply to ticket
- `GET /api/tickets/stats/dashboard` - Get dashboard statistics

### Users (`/api/users`)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user

## Starting the Backend

```bash
cd server
node index.js
```

Or from the root directory:
```bash
npm run server
```

The server runs on `http://localhost:5000` by default.

## Database

The application uses SQLite. The database file is automatically created at `server/database/support.db` on first run.

## File Uploads

Uploaded files are stored in `server/uploads/` and are accessible via:
- `http://localhost:5000/uploads/:filename`
