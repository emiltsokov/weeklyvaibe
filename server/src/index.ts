import express from "express";
import cors from "cors";
import session from "express-session";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { stravaAuthRouter } from "./auth/stravaAuth.js";
import { apiRouter } from "./routes/api.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: config.client.url,
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// Routes
app.use("/auth", stravaAuthRouter);
app.use("/api", apiRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("📦 Connected to MongoDB");

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
