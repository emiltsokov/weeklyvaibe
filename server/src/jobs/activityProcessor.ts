import type { ActivityJobData } from "./activityQueue.js";
import { Athlete, Activity } from "../models/index.js";
import { syncSingleActivity, deleteActivity } from "../services/syncService.js";
import { updateGoalProgress } from "../services/goalService.js";

/**
 * Process a single activity event from Strava webhook
 */
export async function processActivityEvent(
  data: ActivityJobData,
): Promise<void> {
  const { activityId, athleteId, aspectType } = data;

  console.log(
    `🔄 Processing ${aspectType} event for activity ${activityId} (athlete ${athleteId})`,
  );

  // Find the athlete in our database
  const athlete = await Athlete.findOne({ stravaId: athleteId });

  if (!athlete) {
    console.log(`⚠️ Athlete ${athleteId} not found in database, skipping`);
    return;
  }

  switch (aspectType) {
    case "create":
      await handleActivityCreate(athlete, activityId);
      break;

    case "update":
      await handleActivityUpdate(athlete, activityId, data.updates);
      break;

    case "delete":
      await handleActivityDelete(athleteId, activityId);
      break;

    default:
      console.log(`⚠️ Unknown aspect type: ${aspectType}`);
  }
}

/**
 * Handle new activity creation
 */
async function handleActivityCreate(
  athlete: any,
  activityId: number,
): Promise<void> {
  console.log(`🆕 Syncing new activity ${activityId}`);

  try {
    // Sync the single activity from Strava
    const activity = await syncSingleActivity(athlete, activityId);

    if (activity) {
      console.log(`✅ Activity ${activityId} synced: ${activity.name}`);

      // Update goal progress
      const goalUpdate = await updateGoalProgress(athlete.stravaId);
      if (goalUpdate) {
        console.log(`📊 Goal progress updated: ${goalUpdate.progress}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to sync activity ${activityId}:`, error);
    throw error;
  }
}

/**
 * Handle activity update
 */
async function handleActivityUpdate(
  athlete: any,
  activityId: number,
  updates?: Record<string, any>,
): Promise<void> {
  console.log(`🔄 Updating activity ${activityId}`, updates);

  try {
    // Re-sync the activity to get latest data
    const activity = await syncSingleActivity(athlete, activityId);

    if (activity) {
      console.log(`✅ Activity ${activityId} updated: ${activity.name}`);

      // Update goal progress in case duration/distance changed
      const goalUpdate = await updateGoalProgress(athlete.stravaId);
      if (goalUpdate) {
        console.log(`📊 Goal progress updated: ${goalUpdate.progress}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to update activity ${activityId}:`, error);
    throw error;
  }
}

/**
 * Handle activity deletion
 */
async function handleActivityDelete(
  athleteId: number,
  activityId: number,
): Promise<void> {
  console.log(`🗑️ Deleting activity ${activityId}`);

  try {
    const deleted = await deleteActivity(athleteId, activityId);

    if (deleted) {
      console.log(`✅ Activity ${activityId} deleted`);

      // Update goal progress
      const goalUpdate = await updateGoalProgress(athleteId);
      if (goalUpdate) {
        console.log(`📊 Goal progress updated: ${goalUpdate.progress}`);
      }
    } else {
      console.log(`⚠️ Activity ${activityId} not found for deletion`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete activity ${activityId}:`, error);
    throw error;
  }
}
