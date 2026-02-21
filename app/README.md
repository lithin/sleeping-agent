# React Native App

This is the mobile version of the Sleeping Agent app, built with React Native and Expo.

## Features

- Track baby sleep times (naps and night sleep)
- View AI-powered insights and recommendations
- Manage baby profile information
- Cross-platform support (iOS and Android)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update the backend URL in `src/helpers.ts`:
   - For iOS Simulator: `http://localhost:4000`
   - For Android Emulator: `http://10.0.2.2:4000`
   - For Physical Device: `http://YOUR_COMPUTER_IP:4000`

3. Start the development server:
```bash
npx expo start
```

4. Run on your device:
   - Install Expo Go on your iOS or Android device
   - Scan the QR code shown in the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## Tech Stack

- **React Native** with Expo
- **React Native Paper** for UI components
- **React Navigation** for tab navigation
- **React Hook Form** + **Zod** for form validation
- **TypeScript** for type safety

## Project Structure

```
src/
  App.tsx           - Main app with tab navigation
  InsightsTab.tsx   - AI insights and recommendations
  SleepTab.tsx      - Sleep tracking interface
  BabyTab.tsx       - Baby profile management
  types.ts          - TypeScript types and schemas
  helpers.ts        - Utility functions
  useApi.ts         - API client hook
```

## Notes

- The app requires the backend API to be running
- Make sure to configure the correct API_BASE URL for your environment
- Date/time pickers work differently on iOS and Android
