import { Activity, WeeklySummary, type IAthlete } from "../models/index.js";
import { StravaService, type StravaActivity } from "./stravaService.js";
import { calculateActivityTSS } from "./stressService.js";

/**
 * Sync activities for an athlete from Strava
 */
export async function syncAthleteActivities(
  athlete: IAthlete,
  daysBack = 90,
): Promise<{ synced: number; updated: number }> {
  // Refresh token if needed
  const refreshedAthlete = await StravaService.refreshTokenIfNeeded(athlete);

  // Calculate date range
  const after = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60;

  console.log(
    `Syncing activities for athlete ${refreshedAthlete.stravaId} (last ${daysBack} days)`,
  );

  // Fetch all activities
  const activities = await StravaService.getAllActivities(
    refreshedAthlete.accessToken,
    after,
  );

  console.log(`Fetched ${activities.length} activities from Strava`);

  let synced = 0;
  let updated = 0;

  // Upsert activities
  for (const activity of activities) {
    const activityData = mapStravaActivity(activity, refreshedAthlete);

    const result = await Activity.findOneAndUpdate(
      { stravaActivityId: activity.id },
      activityData,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Calculate TSS if not already set
    if (!result.calculatedTSS && result.hasHeartrate) {
      const tssResult = calculateActivityTSS(result, refreshedAthlete);
      result.calculatedTSS = tssResult.tss;
      await result.save();
    }

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      synced++;
    } else {
      updated++;
    }
  }

  console.log(`Sync complete: ${synced} new, ${updated} updated`);

  // Recalculate weekly summaries
  await recalculateWeeklySummaries(refreshedAthlete, daysBack);

  return { synced, updated };
}

/**
 * Map Strava activity to our model
 */
function mapStravaActivity(activity: StravaActivity, athlete: IAthlete) {
  return {
    stravaActivityId: activity.id,
    athleteId: athlete._id,
    stravaAthleteId: athlete.stravaId,
    name: activity.name,
    type: activity.type,
    sportType: activity.sport_type,
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    totalElevationGain: activity.total_elevation_gain,
    sufferScore: activity.suffer_score,
    averageHeartrate: activity.average_heartrate,
    maxHeartrate: activity.max_heartrate,
    averageSpeed: activity.average_speed,
    maxSpeed: activity.max_speed,
    startDate: new Date(activity.start_date),
    startDateLocal: new Date(activity.start_date_local),
    timezone: activity.timezone,
    hasHeartrate: activity.has_heartrate,
  };
}

/**
 * Recalculate weekly summaries for an athlete
 */
async function recalculateWeeklySummaries(
  athlete: IAthlete,
  daysBack: number,
): Promise<void> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get all weeks in range
  const weeks = getWeeksInRange(startDate, new Date());

  for (const { start, end } of weeks) {
    // Aggregate activities for this week
    const activities = await Activity.find({
      stravaAthleteId: athlete.stravaId,
      startDate: { $gte: start, $lte: end },
    });

    const summary = {
      athleteId: athlete._id,
      stravaAthleteId: athlete.stravaId,
      weekStart: start,
      weekEnd: end,
      totalDistance: 0,
      totalDuration: 0,
      totalElevation: 0,
      totalActivities: activities.length,
      avgSufferScore: null as number | null,
      totalSufferScore: null as number | null,
      activityTypes: {} as Record<string, number>,
      calculatedAt: new Date(),
    };

    let sufferScoreSum = 0;
    let sufferScoreCount = 0;

    for (const activity of activities) {
      summary.totalDistance += activity.distance;
      summary.totalDuration += activity.movingTime;
      summary.totalElevation += activity.totalElevationGain;

      if (activity.sufferScore) {
        sufferScoreSum += activity.sufferScore;
        sufferScoreCount++;
      }

      const type = activity.type;
      summary.activityTypes[type] = (summary.activityTypes[type] || 0) + 1;
    }

    if (sufferScoreCount > 0) {
      summary.totalSufferScore = sufferScoreSum;
      summary.avgSufferScore = Math.round(sufferScoreSum / sufferScoreCount);
    }

    await WeeklySummary.findOneAndUpdate(
      { stravaAthleteId: athlete.stravaId, weekStart: start },
      summary,
      { upsert: true },
    );
  }
}

/**
 * Get array of week boundaries (Monday-Sunday) in a date range
 */
function getWeeksInRange(
  start: Date,
  end: Date,
): Array<{ start: Date; end: Date }> {
  const weeks: Array<{ start: Date; end: Date }> = [];

  // Find Monday of the start week
  const current = new Date(start);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    weeks.push({ start: weekStart, end: weekEnd });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export { recalculateWeeklySummaries, getWeeksInRange };
