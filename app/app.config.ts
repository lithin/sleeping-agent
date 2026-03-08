import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Sleeping Agent",
  slug: "sleeping-agent",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    // image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sleepingagent.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.sleepingagent.app",
    versionCode: 1,
  },
  web: {
    // favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "52f53822-2bc3-4f8e-914d-3d2dba44aecb",
    },
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      "https://sleeping-agent-backend-7bkv2vitoq-uc.a.run.app",
    apiSecretKey:
      process.env.EXPO_PUBLIC_API_SECRET_KEY ||
      "",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 23,
          targetSdkVersion: 34,
          compileSdkVersion: 34,
          buildToolsVersion: "34.0.0",
          kotlinVersion: "1.8.22",
        },
      },
    ],
  ],
};

export default config;
