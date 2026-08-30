require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const authController = require('./controllers/authController');
const complaintController = require('./controllers/complaintController');
const { auth, restrictTo } = require('./middleware/auth');

const app = express();

// Cloudinary Configuration
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration (Memory for Cloudinary, Disk for Local)
const storage = isCloudinaryConfigured
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Configure Permissive CORS for all environments & Vercel subdomains
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (Authorization Bearer token based API)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());

app.use(express.json());

// Serve uploaded files statically if stored locally
app.use('/uploads', express.static(uploadsDir));

// Database connection logic
let isConnecting = false;
const connectDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (isConnecting) return;

  isConnecting = true;
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB successfully.');

      // Check if DB is empty, auto-seed default accounts
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('Database is empty. Auto-seeding initial administrative & student accounts...');
        const seedScript = require('./scripts/seed');
        await seedScript.seedData();
        console.log('Initial accounts auto-seeded.');
      }
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      if (require.main === module && process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    } finally {
      isConnecting = false;
    }
  } else {
    try {
      console.log('No MONGODB_URI found. Starting In-Memory MongoDB server for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus-redressal',
        },
      });
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Connected to In-Memory MongoDB:', uri);

      const seedScript = require('./scripts/seed');
      await seedScript.seedData();
      console.log('In-Memory DB seeded with default credentials.');
    } catch (err) {
      console.error('Failed to start In-Memory MongoDB server:', err.message);
      if (require.main === module) process.exit(1);
    } finally {
      isConnecting = false;
    }
  }
};

// Middleware to ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    await connectDatabase();
  }
  next();
});

// Health check endpoint (for Render, Railway, AWS, uptime monitors)
app.get(['/api/health', '/health'], (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = states[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      connected: mongoose.connection.readyState === 1,
    },
    storage: isCloudinaryConfigured ? 'cloudinary' : 'local_disk',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes (Supporting both with and without /api prefix for bulletproof client routing)

// Authentication
app.post(['/api/auth/register', '/auth/register'], authController.register);
app.post(['/api/auth/login', '/auth/login'], authController.login);
app.get(['/api/auth/me', '/auth/me'], auth, authController.getMe);

// Complaints Routing
app.post(['/api/complaints', '/complaints'], auth, upload.single('attachment'), complaintController.createComplaint);
app.get(['/api/complaints/mine', '/complaints/mine'], auth, complaintController.getMyComplaints);
app.get(['/api/complaints/check-duplicate', '/complaints/check-duplicate'], auth, complaintController.checkDuplicate);
app.get(['/api/complaints/analytics', '/complaints/analytics'], auth, restrictTo('admin', 'staff'), complaintController.getAnalytics);
app.get(['/api/complaints/:id', '/complaints/:id'], auth, complaintController.getComplaintById);
app.patch(['/api/complaints/:id/status', '/complaints/:id/status'], auth, restrictTo('admin', 'staff'), complaintController.updateStatus);
app.post(['/api/complaints/:id/comments', '/complaints/:id/comments'], auth, complaintController.addComment);
app.post(['/api/complaints/:id/upvote', '/complaints/:id/upvote'], auth, complaintController.upvoteComplaint);
app.post(['/api/complaints/:id/feedback', '/complaints/:id/feedback'], auth, complaintController.submitFeedback);
app.post(['/api/complaints/:id/reopen', '/complaints/:id/reopen'], auth, complaintController.reopenComplaint);
app.get(['/api/complaints', '/complaints'], auth, complaintController.getComplaints);

// Serve static frontend build if dist directory exists (for unified all-in-one deployment)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/health')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Default root route when frontend is hosted separately
  app.get('/', (req, res) => {
    res.json({
      message: 'Campus Redressal Complaint System API running.',
      healthCheck: '/api/health',
      documentation: 'https://github.com',
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong on the server!',
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDatabase().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`${signal} signal received. Closing HTTP server...`);
      server.close(() => {
        console.log('HTTP server closed.');
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  });
}

module.exports = app;
