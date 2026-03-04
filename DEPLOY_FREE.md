# ═══════════════════════════════════════════════════════════════════

# CampusIQ — Free Deployment Guide (Render.com + MongoDB Atlas)

# Total Cost: $0/month

# ═══════════════════════════════════════════════════════════════════

## STEP 1: Create MongoDB Atlas Free Database (5 minutes)

1. Go to https://cloud.mongodb.com → Sign up (free)
2. Click "Build a Database" → Choose **M0 FREE** (Shared)
3. Select region: **Oregon (us-west-2)** — closest to Render free tier
4. Cluster name: `campusiq-cluster` (or any name)
5. Click "Create Cluster"

### Create Database User:

6. Go to **Database Access** → Add New Database User
   - Username: `campusiq-admin`
   - Password: (generate a strong password — **save this!**)
   - Role: Atlas Admin
   - Click "Add User"

### Allow Network Access:

7. Go to **Network Access** → Add IP Address
   - Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
   - This is required because Render free tier has no static IP
   - Click "Confirm"

### Get Connection String:

8. Go to **Database** → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string — it looks like:
   ```
   mongodb+srv://campusiq-admin:<password>@campusiq-cluster.xxxxx.mongodb.net/edutrack?retryWrites=true&w=majority
   ```

   - Replace `<password>` with your actual password
   - **Save this string — you'll need it in Step 3**

## STEP 2: Push Code to GitHub (2 minutes)

If your code isn't on GitHub yet:

```bash
cd edutrack
git init
git add .
git commit -m "Initial commit - CampusIQ"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/campusiq.git
git push -u origin main
```

If it's already on GitHub, make sure the latest code is pushed:

```bash
git add .
git commit -m "Add Render deployment config"
git push
```

## STEP 3: Deploy on Render.com (5 minutes)

### Option A: Blueprint Auto-Deploy (Easiest)

1. Go to https://render.com → Sign up with GitHub
2. Click **New → Blueprint**
3. Connect your GitHub repo (the one with `render.yaml`)
4. Render will auto-detect the `render.yaml` and configure everything
5. Fill in the env variables it asks for:
   - **MONGODB_URI**: Paste your Atlas connection string from Step 1
   - **NEXTAUTH_URL**: Leave blank for now (set after first deploy)
   - Other optional vars: skip for now, add later
6. Click **"Apply"** → Render builds & deploys

### Option B: Manual Setup

1. Go to https://render.com → Sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `campusiq`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: **Free**
5. Click **"Advanced"** → Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string |
   | `NEXTAUTH_SECRET` | Any random string (use: `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | `https://campusiq.onrender.com` |
6. Click **"Create Web Service"**

## STEP 4: After First Deploy

1. Your app URL will be: `https://campusiq.onrender.com` (or your chosen name)
2. Go to Render Dashboard → your service → **Environment**
3. Set `NEXTAUTH_URL` = `https://your-app-name.onrender.com`
4. Click **"Save Changes"** → Render auto-redeploys

### Seed the Database (Optional):

If you need initial data, open the Render **Shell** tab and run:

```bash
node seed-mongodb.js
```

## STEP 5: Optional Services Setup

### Gmail SMTP (Free Email — password reset, verification):

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to App Passwords → Generate one for "Mail"
4. In Render env vars, add:
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `your-email@gmail.com`
   - `SMTP_PASS` = the app password you generated

### Cloudinary (Free Image Uploads — 25GB):

1. Go to https://cloudinary.com → Sign up (free)
2. Dashboard shows your Cloud Name, API Key, API Secret
3. In Render env vars, add:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Google Gemini AI (Free AI Chatbot):

1. Go to https://aistudio.google.com/apikey
2. Create an API key (free tier: 15 requests/minute)
3. In Render env vars, add:
   - `GEMINI_API_KEY` = your key

### Keep App Awake (Prevent Cold Starts):

Render free tier sleeps after 15 min of inactivity. To prevent this:

1. Go to https://uptimerobot.com → Sign up (free, 50 monitors)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-app-name.onrender.com/api/health`
   - Interval: 5 minutes
3. This pings your app every 5 min so it never sleeps!

## Architecture Summary

```
┌──────────────────────────────────────────────────┐
│              render.com (Free)                   │
│  ┌────────────────────────────────────────────┐  │
│  │  node server.js                            │  │
│  │  • Next.js 14 (SSR + API Routes)          │  │
│  │  • Socket.IO (Real-time WebSockets)        │  │
│  │  • All frontend + backend in one service   │  │
│  └────────────────────────────────────────────┘  │
│         │                    │                    │
│  MongoDB Atlas (Free)    Cloudinary (Free)        │
│  512 MB storage          25 GB images             │
└──────────────────────────────────────────────────┘
```

## Free Tier Limits

| Service       | Limit                    | Enough For            |
| ------------- | ------------------------ | --------------------- |
| Render        | 750 hrs/month, 512MB RAM | 1 school (~100 users) |
| MongoDB Atlas | 512 MB storage           | ~50K student records  |
| Cloudinary    | 25 GB storage, 25 GB BW  | ~5K student photos    |
| Gmail SMTP    | 500 emails/day           | All school emails     |
| Gemini AI     | 15 req/min, 1500/day     | AI chatbot            |
| UptimeRobot   | 50 monitors, 5 min check | Keep app awake        |

## Troubleshooting

### Build fails on Render?

- Check Render logs (Dashboard → Logs)
- Most common: missing env variable — make sure `MONGODB_URI` is set

### App shows 502 error?

- Cold start — wait 30-50 seconds, then refresh
- Set up UptimeRobot (Step 5) to prevent this

### Can't connect to MongoDB?

- Check Atlas Network Access → must have `0.0.0.0/0`
- Check password doesn't have special chars that need URL encoding
- Test connection string locally first

### WebSocket/Socket.IO not working?

- Render supports WebSockets on free tier ✅
- Make sure `NEXTAUTH_URL` matches your Render URL exactly
