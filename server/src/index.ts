import express from "express";
import cors from "cors";
import session from "express-session";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { stravaAuthRouter } from "./auth/stravaAuth.js";
import { apiRouter } from "./routes/api.js";
import { webhookRouter } from "./routes/webhook.js";
import { closeActivityQueue } from "./jobs/activityQueue.js";

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
app.use("/webhook", webhookRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function start() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("📦 Connected to MongoDB");

    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(
        `🔔 Webhook endpoint: http://localhost:${config.port}/webhook`,
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("🔌 HTTP server closed");

        try {
          await closeActivityQueue();
          await mongoose.connection.close();
          console.log("📦 MongoDB connection closed");
          process.exit(0);
        } catch (err) {
          console.error("Error during shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
