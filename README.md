# Sleeping Agent

Mono-repo for the Sleeping Agent app - vibe coded ai agent to track improve baby sleep.

## Structure

```
/frontend   - Vite + React + TypeScript web UI
/backend    - Express + TypeScript API server
/app        - React Native mobile app (iOS/Android)
```

## Quick Start

```bash
# Run backend and database with Docker
docker-compose up --build

# Or run individually:

# Backend (from /backend)
cd backend
npm install
npm run dev

# Web Frontend (from /frontend)
cd frontend
npm install
npm run dev

# Mobile App (from /app)
cd app
npm install
npx expo start
```

## Services

- Web Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database: localhost:5432

## Mobile App Setup

The React Native app in `/app` uses Expo for easy development:

1. Install dependencies: `cd app && npm install`
2. Start Expo: `npx expo start`
3. Update `app/src/helpers.ts` with your backend URL:
   - iOS Simulator: `http://localhost:4000`
   - Android Emulator: `http://10.0.2.2:4000`
   - Physical Device: `http://YOUR_COMPUTER_IP:4000`
4. Scan QR code with Expo Go app (iOS/Android) or press `i` for iOS simulator, `a` for Android emulator

