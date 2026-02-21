module.exports = ({ config }) => {
  return {
    ...config,
    name: "Sleeping Agent",
    slug: "sleeping-agent",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
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
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000",
      apiSecretKey:
        process.env.EXPO_PUBLIC_API_SECRET_KEY ||
        "dev-secret-key-change-in-production",
    },
  };
};
