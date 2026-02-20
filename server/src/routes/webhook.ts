import { Router, type Request, type Response } from "express";
import { config } from "../config/index.js";
import { activityQueue } from "../jobs/activityQueue.js";

const router = Router();

/**
 * Strava Webhook Event Types
 */
interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, any>;
}

/**
 * GET /webhook
 * Strava webhook validation endpoint
 * Strava sends a GET request to validate the webhook subscription
 */
router.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔔 Webhook validation request received");

  if (mode === "subscribe" && token === config.strava.webhookVerifyToken) {
    console.log("✅ Webhook validated successfully");
    return res.json({ "hub.challenge": challenge });
  }

  console.log("❌ Webhook validation failed");
  return res.status(403).json({ error: "Verification failed" });
});

/**
 * POST /webhook
 * Strava webhook event receiver
 * Must respond with 200 immediately, then process asynchronously
 */
router.post("/", async (req: Request, res: Response) => {
  // Respond immediately to Strava (must be within 2 seconds)
  res.status(200).send("EVENT_RECEIVED");

  const event = req.body as StravaWebhookEvent;

  console.log(
    `🔔 Webhook event: ${event.aspect_type} ${event.object_type} (ID: ${event.object_id}) for athlete ${event.owner_id}`,
  );

  try {
    // Only process activity events
    if (event.object_type === "activity") {
      await activityQueue.add("process-activity", {
        activityId: event.object_id,
        athleteId: event.owner_id,
        aspectType: event.aspect_type,
        eventTime: event.event_time,
        updates: event.updates,
      });

      console.log(`📥 Queued activity ${event.object_id} for processing`);
    }
  } catch (error) {
    console.error("❌ Failed to queue webhook event:", error);
    // Don't throw - we already responded to Strava
  }
});

export { router as webhookRouter };
