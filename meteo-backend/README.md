# Meteo-GIS Production Backend API

High-speed, production-ready REST API for the **RainMap / Meteo-GIS Disaster Intelligence** mobile application and web dashboard.

---

## 🚀 Quick Deployment Options

### Option 1: Deploy on Render (Free & Fast)
1. Push this folder to a GitHub repository (e.g. `github.com/your-username/meteo-backend`).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
3. Connect your repository.
4. Set:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Create Web Service**.
6. Copy your public URL (e.g., `https://meteo-backend.onrender.com`).

---

### Option 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) → **New Project**.
2. Select **Deploy from GitHub repo** → pick this repo.
3. Railway automatically detects `Procfile` / `server.js` and deploys.
4. Go to **Settings** → **Generate Domain** → copy your HTTPS URL.

---

### Option 3: Deploy with Docker (Any VPS / DigitalOcean / AWS EC2)
```bash
docker build -t meteo-backend .
docker run -d -p 3000:3000 --name meteo-backend meteo-backend
```

---

## 📡 Live API Endpoints

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/health` | GET | Server health & uptime status |
| `/api/live/hazards` | GET | Active IMD national warnings (Red/Orange alerts) |
| `/api/imd/nowcast` | GET | Real-time weather radar & AWS surface observations |
| `/api/incidents` | GET | Incident bulletins across monitored river basins |
| `/api/nasa-power` | GET | NASA POWER 30-day SPI precipitation climatology |
| `/api/bhuvan` | GET | ISRO Bhuvan CartoDEM 30m terrain & elevation |
| `/api/sos` | POST/GET | Emergency SOS beacon broadcast & tracking |
| `/api/reports` | POST/GET | Citizen hazard reports & verification pipeline |

---

## 📲 Connecting to the Mobile App

Once hosted, update your app's `.env` in `rainmap`:
```env
EXPO_PUBLIC_METEO_GIS_URL=https://your-backend.onrender.com
```
Then build your Google Play Store bundle (`.aab`).
