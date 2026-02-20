import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/weeklyvaibe",
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
  },

  client: {
    url: process.env.CLIENT_URL || "http://localhost:5173",
  },
};
