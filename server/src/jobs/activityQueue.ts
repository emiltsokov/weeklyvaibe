import { Queue, Worker } from "bullmq";
import { config } from "../config/index.js";
import { processActivityEvent } from "./activityProcessor.js";

/**
 * Activity Queue Configuration
 */
const connection = {
  url: config.redis.url,
};

/**
 * Activity Processing Queue
 * Handles incoming Strava webhook events asynchronously
 */
export const activityQueue = new Queue("activity-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60, // Keep for 24 hours
    },
    removeOnFail: {
      count: 50,
      age: 7 * 24 * 60 * 60, // Keep failed for 7 days
    },
  },
});

/**
 * Activity Job Data Interface
 */
export interface ActivityJobData {
  activityId: number;
  athleteId: number;
  aspectType: "create" | "update" | "delete";
  eventTime: number;
  updates?: Record<string, any>;
}

/**
 * Activity Queue Worker
 * Processes activity events from the queue
 */
export const activityWorker = new Worker<ActivityJobData>(
  "activity-processing",
  async (job) => {
    console.log(`📦 Processing job ${job.id}: ${job.name}`);

    try {
      await processActivityEvent(job.data);
      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
  },
);

// Worker event handlers
activityWorker.on("completed", (job) => {
  console.log(`✅ Activity job ${job.id} completed`);
});

activityWorker.on("failed", (job, err) => {
  console.error(`❌ Activity job ${job?.id} failed:`, err.message);
});

activityWorker.on("error", (err) => {
  console.error("❌ Activity worker error:", err);
});

/**
 * Graceful shutdown
 */
export async function closeActivityQueue() {
  await activityWorker.close();
  await activityQueue.close();
  console.log("📪 Activity queue closed");
}
