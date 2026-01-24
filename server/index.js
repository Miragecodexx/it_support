const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const db = require('./database/db');
const upload = require('./config/upload');

const app = express();
const PORT = process.env.PORT || 5000;
const http = require('http');
const { Server } = require('socket.io');
const socketManager = require('./utils/socket');

// Middleware
// Allow a comma-separated list of allowed client origins via
// `CLIENT_ORIGINS` env var, defaulting to the two Render sites.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || 'https://it-support-1.onrender.com,https://it-support-2.onrender.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    if (CLIENT_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
// Try to serve by looking up attachment path in DB first (handles moved files)
app.get('/uploads/:filename', (req, res, next) => {
  const filename = req.params.filename;
  try {
    const database = db.getDb();
    database.get('SELECT file_path FROM attachments WHERE filename = ? OR original_name = ?', [filename, filename], (err, row) => {
      if (err) return next();
      if (row && row.file_path && fs.existsSync(row.file_path)) {
        return res.sendFile(path.resolve(row.file_path));
      }
      // fallback to static
      next();
    });
  } catch (e) {
    next();
  }
});

app.use('/uploads', express.static(uploadsDir));

// Health check / root route
app.get('/', (req, res) => {
  res.json({ message: 'Ticket Management System API Server', status: 'online' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Initialize database and start server
db.init()
  .then(() => {
    // Default admin user (password: admin123)
    return db.createDefaultAdmin();
  })
  .then(() => {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: CLIENT_ORIGINS,
        methods: ['GET', 'POST']
      }
    });

    // set io for other modules
    socketManager.setIo(io);

    io.on('connection', (socket) => {
      socket.on('join', (data) => {
        try {
          if (data && data.userId) {
            socket.join(`user_${data.userId}`);
          }
          if (data && data.role === 'admin') {
            socket.join('role_admin');
          }
        } catch (e) {
          console.error('Join error:', e);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
