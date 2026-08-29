require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const authController = require('./controllers/authController');
const complaintController = require('./controllers/complaintController');
const { auth, restrictTo } = require('./middleware/auth');

const app = express();

// Middlewares
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow any localhost / 127.0.0.1 port in development or preview
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer Local Storage Configuration
const storage = multer.diskStorage({
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
      console.log('Connected to MongoDB Atlas successfully.');
    } catch (err) {
      console.error('Failed to connect to MongoDB Atlas:', err.message);
      if (require.main === module) process.exit(1);
    } finally {
      isConnecting = false;
    }
  } else {
    try {
      console.log('No MONGODB_URI found. Starting In-Memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus-redressal'
        }
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

// API Routes

// Authentication
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', auth, authController.getMe);

// Complaints Routing
app.post('/api/complaints', auth, upload.single('attachment'), complaintController.createComplaint);
app.get('/api/complaints/mine', auth, complaintController.getMyComplaints);
app.get('/api/complaints/check-duplicate', auth, complaintController.checkDuplicate);
app.get('/api/complaints/analytics', auth, restrictTo('admin', 'staff'), complaintController.getAnalytics);
app.get('/api/complaints/:id', auth, complaintController.getComplaintById);
app.patch('/api/complaints/:id/status', auth, restrictTo('admin', 'staff'), complaintController.updateStatus);
app.post('/api/complaints/:id/comments', auth, complaintController.addComment);
app.post('/api/complaints/:id/upvote', auth, complaintController.upvoteComplaint);
app.post('/api/complaints/:id/feedback', auth, complaintController.submitFeedback);
app.post('/api/complaints/:id/reopen', auth, complaintController.reopenComplaint);
app.get('/api/complaints', auth, complaintController.getComplaints); // Admin/staff/student list (general list filtering)

// Default root route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Redressal Complaint System API running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
}

module.exports = app;
