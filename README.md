IT Support Portal

A comprehensive technical support ticket management system with separate dashboards for administrators and users.

 Features

- User Dashboard
- Admin Dashboard
- Ticket Management
- Authentication

Tech Stack
- Frontend: React 18, Vite, React Router
- Backend: Node.js, Express.js
- Database: SQLite
- Authentication: JWT (JSON Web Tokens)
- File Upload: Multer

Installation

Prerequisites
- Node.js (v14 or higher)
- npm or yarn

 Setup Instructions

1. Install all dependencies:
   ```bash
   npm run install-all
   ```

   Or install separately:
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

2. Start the development servers:
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

   Or start separately:
   ```bash
   # Terminal 1 - Start backend
   cd server
   npm start

   # Terminal 2 - Start frontend
   cd client
   npm run dev
   ```

3. Access the application:
   - Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

By default the system can create an initial admin user on first run. For production, set `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` in your environment to control the initial administrator credentials. If you don't set those variables, a development default may be created — change the password immediately after logging in.



 Project Structure
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── server/                # Node.js backend application
│   ├── config/            # Configuration files
│   ├── database/          # Database setup
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── uploads/           # Uploaded files (created automatically)
│   └── index.js           # Server entry point
│
└── package.json           # Root package.json






API Endpoints
 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

 Tickets
 `GET /api/tickets` - Get all tickets (filtered by user role)
 `GET /api/tickets/:id` - Get single ticket
 `POST /api/tickets` - Create new ticket
 `PUT /api/tickets/:id` - Update ticket
 `POST /api/tickets/:id/conversations` - Add reply to ticket
 `GET /api/tickets/stats/dashboard` - Get dashboard statistics

 Users
 `GET /api/users` - Get all users (admin only)
 `GET /api/users/:id` - Get single user
 `POST /api/users` - Create user (admin only)
 `PUT /api/users/:id` - Update user

 Database

The application uses SQLite database which is automatically created on first run. The database file is located at `server/database/support.db`.

 Database Schema

users: User accounts and authentication
tickets: Support tickets
conversations: Ticket replies and messages
attachments: File attachments for tickets

File Uploads

Uploaded files are stored in `server/uploads/` directory. Files are accessible via `/uploads/:filename` endpoint.

