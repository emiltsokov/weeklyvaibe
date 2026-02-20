import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/weeklyvaibe",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  session: {
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  },

  strava: {
    clientId: process.env.STRAVA_CLIENT_ID || "",
    clientSecret: process.env.STRAVA_CLIENT_SECRET || "",
    redirectUri:
      process.env.STRAVA_REDIRECT_URI || "http://localhost:3001/auth/callback",
    authUrl: "https://www.strava.com/oauth/authorize",
    tokenUrl: "https://www.strava.com/oauth/token",
    apiBaseUrl: "https://www.strava.com/api/v3",
    scopes: "activity:read_all,profile:read_all",
    webhookVerifyToken:
      process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "weeklyvaibe-webhook-verify",
  },

  client: {
    url: process.env.CLIENT_URL || "http://localhost:5173",
  },
};
