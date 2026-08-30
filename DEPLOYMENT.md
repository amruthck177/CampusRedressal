# 🚀 Complete Deployment Guide for Campus Redressal

This guide provides step-by-step instructions for deploying the **Campus Redressal Complaint Management System** to production.

---

## 📑 Table of Contents
1. [Prerequisites & External Services](#1-prerequisites--external-services)
   - [MongoDB Atlas (Database)](#mongodb-atlas-free-cluster)
   - [Cloudinary (Permanent File Storage)](#cloudinary-file-storage)
2. [Deployment Option A: Vercel (Frontend) + Render (Backend) ⭐ Recommended](#deployment-option-a-vercel-frontend--render-backend--recommended)
3. [Deployment Option B: Single Fullstack Service on Render / Railway](#deployment-option-b-single-fullstack-service-on-render--railway)
4. [Deployment Option C: Docker & Docker Compose](#deployment-option-c-docker--docker-compose)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Post-Deployment Verification & Health Checks](#post-deployment-verification)

---

## 1. Prerequisites & External Services

### MongoDB Atlas (Free Cluster)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox** cluster.
3. Under **Security > Database Access**, add a database user with read/write privileges.
4. Under **Security > Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect > Drivers > Node.js** to copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus-redressal?retryWrites=true&w=majority
   ```

### Cloudinary (File Storage)
*(Recommended for persistent image/document attachments in production)*
1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)

---

## Deployment Option A: Vercel (Frontend) + Render (Backend) ⭐ Recommended

This architecture deploys the Express REST API on Render and the Vite React frontend on Vercel's global Edge CDN.

### Step 1: Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
2. Connect your Git repository.
3. Fill in the following details:
   - **Name**: `campus-redressal-api`
   - **Language**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | *Your MongoDB Atlas connection string* |
   | `JWT_SECRET` | *A secure random string (e.g. 32+ characters)* |
   | `ALLOWED_EMAIL_DOMAIN` | `college.edu` (or your institution domain) |
   | `FRONTEND_URL` | *Leave blank initially, update with your Vercel URL after Step 2* |
   | `CLOUDINARY_CLOUD_NAME` | *(Optional)* Your Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | *(Optional)* Your Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | *(Optional)* Your Cloudinary API secret |
5. Click **Create Web Service**. Note the deployed URL (e.g., `https://campus-redressal-api.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
2. Import your Git repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://campus-redressal-api.onrender.com/api` |
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g. `https://campus-redressal.vercel.app`), go back to your Render Backend settings, and set `FRONTEND_URL=https://campus-redressal.vercel.app`.

---

## Deployment Option B: Single Fullstack Service on Render / Railway

Deploy both the backend and frontend together on a single Node.js web service.

1. Connect your repository to Render or Railway.
2. Configure settings:
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run install:all && npm run build:frontend`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
3. Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB connection string*
   - `JWT_SECRET`: *Your JWT secret*
   - `ALLOWED_EMAIL_DOMAIN`: `college.edu`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` *(optional)*

The server will automatically serve the API at `/api/*` and the React frontend on all other routes with full SPA routing support.

---

## Deployment Option C: Docker & Docker Compose

For deploying on VPS, DigitalOcean Droplet, AWS EC2, or local production testing.

### Run with Docker Compose (App + MongoDB):
```bash
docker compose up -d --build
```
Access the application at `http://localhost:5000`.

### Build & Run Docker Image Standalone:
```bash
# Build Docker image
docker build -t campus-redressal:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/campus-redressal" \
  -e JWT_SECRET="your_jwt_secret" \
  --name campus-redressal \
  campus-redressal:latest
```

---

## Environment Variables Reference

| Variable | Scope | Required | Description | Example |
|---|---|---|---|---|
| `PORT` | Backend | No | Port on which the server listens | `5000` |
| `NODE_ENV` | Backend | Yes | Environment mode | `production` |
| `MONGODB_URI` | Backend | Yes (prod) | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Backend | Yes | Secret key for JWT signing | `random_secret_string` |
| `ALLOWED_EMAIL_DOMAIN` | Backend | No | Restriction for student registration | `college.edu` |
| `FRONTEND_URL` | Backend | No | Allowed CORS origins (comma-separated) | `https://app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Backend | Optional | Cloudinary Cloud Name for attachments | `my-cloud` |
| `CLOUDINARY_API_KEY` | Backend | Optional | Cloudinary API Key | `123456789` |
| `CLOUDINARY_API_SECRET`| Backend | Optional | Cloudinary API Secret | `abcdef123456` |
| `VITE_API_URL` | Frontend | Yes (Vercel) | Backend API endpoint | `https://api.onrender.com/api` |

---

## Post-Deployment Verification

### 1. Health Check
Visit `https://your-backend-api.onrender.com/api/health`. You should receive:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-30T10:00:00.000Z",
  "uptime": 120,
  "database": {
    "status": "connected",
    "connected": true
  },
  "storage": "cloudinary",
  "environment": "production"
}
```

### 2. Seed Initial Administrative Users
If deploying to a fresh MongoDB Atlas database, run the seed script to populate demo admin, staff, and student accounts:
```bash
# Set your MongoDB URI and run seed
MONGODB_URI="your_mongodb_uri" npm run seed
```

**Default Seed Accounts:**
- **Student**: `student@college.edu` / `student123`
- **Admin**: `admin@college.edu` / `admin123`
- **Staff (Hostel Warden)**: `staff@college.edu` / `staff123`
