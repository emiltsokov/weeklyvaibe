import {
  Activity,
  Athlete,
  type IActivity,
  type IAthlete,
} from "../models/index.js";
import { StravaService } from "./stravaService.js";
import {
  calculateActivityTSS,
  calculate7DayTSS,
  calculate42DayAvgTSS,
  calculateTSB,
  getFatigueLevel,
} from "./stressService.js";

export type RecoveryStatus = "ready" | "light" | "rest";

export interface RecoveryResult {
  status: RecoveryStatus;
  color: "green" | "yellow" | "red";
  label: string;
  description: string;
  suggestedRestHours: number;
  lastActivityIntensity: {
    zone4_5Percent: number;
    totalDuration: number;
    zoneDistribution: number[]; // percentage per zone
  } | null;
}

export interface BalanceScoreResult {
  weeklyTSS: number; // 7-day rolling TSS
  avgWeeklyTSS: number; // 6-week average
  percentOfAverage: number;
  fatigueLevel: ReturnType<typeof getFatigueLevel>;
  tsb: number; // Training Stress Balance
  ctl: number; // Chronic Training Load
  atl: number; // Acute Training Load
}

/**
 * Analyze HR zone distribution to determine recovery needs
 */
export function analyzeZoneDistribution(zoneTimeSeconds: number[]): {
  zone4_5Percent: number;
  zonePercentages: number[];
  totalDuration: number;
} {
  const totalDuration = zoneTimeSeconds.reduce((sum, time) => sum + time, 0);

  if (totalDuration === 0) {
    return {
      zone4_5Percent: 0,
      zonePercentages: zoneTimeSeconds.map(() => 0),
      totalDuration: 0,
    };
  }

  const zonePercentages = zoneTimeSeconds.map((time) =>
    Math.round((time / totalDuration) * 100),
  );

  // Zone 4 is index 3, Zone 5 is index 4 (0-indexed)
  const zone4Time = zoneTimeSeconds[3] || 0;
  const zone5Time = zoneTimeSeconds[4] || 0;
  const zone4_5Percent = Math.round(
    ((zone4Time + zone5Time) / totalDuration) * 100,
  );

  return {
    zone4_5Percent,
    zonePercentages,
    totalDuration,
  };
}

/**
 * Calculate suggested rest hours based on TSS
 */
export function calculateRestHours(
  tss: number,
  zone4_5Percent: number,
): number {
  let baseRest = 0;

  // Base rest based on TSS
  if (tss > 300) {
    baseRest = 72; // 3 days
  } else if (tss > 200) {
    baseRest = 48; // 2 days
  } else if (tss > 150) {
    baseRest = 36;
  } else if (tss > 100) {
    baseRest = 24;
  } else if (tss > 50) {
    baseRest = 12;
  } else {
    baseRest = 8;
  }

  // Add extra rest for high-intensity work
  if (zone4_5Percent > 50) {
    baseRest += 12;
  } else if (zone4_5Percent > 30) {
    baseRest += 6;
  }

  return baseRest;
}

/**
 * Determine recovery status based on last activity analysis
 */
export function determineRecoveryStatus(
  zone4_5Percent: number,
  tss: number,
  hoursSinceActivity: number,
): RecoveryResult["status"] {
  // Check if enough time has passed based on intensity
  const requiredRest = calculateRestHours(tss, zone4_5Percent);

  if (hoursSinceActivity >= requiredRest) {
    return "ready";
  }

  if (zone4_5Percent > 50) {
    return "rest"; // Need sleep / full rest
  } else if (zone4_5Percent > 30) {
    return "light"; // Light activity only
  }

  // Even if time hasn't passed, low intensity activities are ok
  if (hoursSinceActivity >= requiredRest * 0.5) {
    return "light";
  }

  return "rest";
}

/**
 * Get recovery status for an athlete based on their last activity
 */
export async function getRecoveryStatus(
  athlete: IAthlete,
): Promise<RecoveryResult> {
  // Get last activity
  const lastActivity = await Activity.findOne({
    stravaAthleteId: athlete.stravaId,
  }).sort({ startDate: -1 });

  if (!lastActivity) {
    return {
      status: "ready",
      color: "green",
      label: "Ready to Train",
      description: "No recent activities found",
      suggestedRestHours: 0,
      lastActivityIntensity: null,
    };
  }

  // Calculate hours since last activity
  const hoursSinceActivity =
    (Date.now() - new Date(lastActivity.startDate).getTime()) /
    (1000 * 60 * 60);

  // Get zone distribution
  let zoneAnalysis = {
    zone4_5Percent: 0,
    zonePercentages: [0, 0, 0, 0, 0],
    totalDuration: lastActivity.movingTime,
  };

  if (
    lastActivity.hrZoneDistribution &&
    lastActivity.hrZoneDistribution.length > 0
  ) {
    zoneAnalysis = analyzeZoneDistribution(lastActivity.hrZoneDistribution);
  }

  // Calculate or get TSS
  const tss = lastActivity.calculatedTSS || 0;

  // Determine recovery status
  const status = determineRecoveryStatus(
    zoneAnalysis.zone4_5Percent,
    tss,
    hoursSinceActivity,
  );

  const suggestedRestHours = calculateRestHours(
    tss,
    zoneAnalysis.zone4_5Percent,
  );
  const remainingRest = Math.max(0, suggestedRestHours - hoursSinceActivity);

  const statusConfig: Record<
    RecoveryStatus,
    { color: RecoveryResult["color"]; label: string; description: string }
  > = {
    ready: {
      color: "green",
      label: "Ready to Train",
      description: "You are recovered and ready for your next workout",
    },
    light: {
      color: "yellow",
      label: "Light Activity Only",
      description: `Recovery in progress. ${Math.round(remainingRest)}h until full recovery`,
    },
    rest: {
      color: "red",
      label: "Need Rest",
      description: `High intensity detected. Rest recommended for ${Math.round(remainingRest)}h`,
    },
  };

  const config = statusConfig[status];

  return {
    status,
    color: config.color,
    label: config.label,
    description: config.description,
    suggestedRestHours,
    lastActivityIntensity: {
      zone4_5Percent: zoneAnalysis.zone4_5Percent,
      totalDuration: zoneAnalysis.totalDuration,
      zoneDistribution: zoneAnalysis.zonePercentages,
    },
  };
}

/**
 * Get balance score (training load analysis)
 */
export async function getBalanceScore(
  athlete: IAthlete,
): Promise<BalanceScoreResult> {
  const stravaAthleteId = athlete.stravaId;
  // Get activities from last 42 days
  const fortyTwoDaysAgo = new Date();
  fortyTwoDaysAgo.setDate(fortyTwoDaysAgo.getDate() - 42);

  const activities = await Activity.find({
    stravaAthleteId,
    startDate: { $gte: fortyTwoDaysAgo },
  }).sort({ startDate: 1 });

  // Group TSS by day
  const dailyTSS: Map<string, number> = new Map();

  for (let i = 0; i < 42; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    dailyTSS.set(dateKey, 0);
  }

  // Sum TSS for each day
  for (const activity of activities) {
    const dateKey = new Date(activity.startDate).toISOString().split("T")[0];
    const currentTSS = dailyTSS.get(dateKey) || 0;
    dailyTSS.set(dateKey, currentTSS + (activity.calculatedTSS || 0));
  }

  // Convert to array (oldest to newest)
  const sortedDates = Array.from(dailyTSS.keys()).sort();
  const dailyTSSValues = sortedDates.map((date) => dailyTSS.get(date) || 0);

  // Calculate metrics
  const weeklyTSS = calculate7DayTSS(dailyTSSValues);
  const avgWeeklyTSS = calculate42DayAvgTSS(dailyTSSValues) * 7; // Convert daily avg to weekly

  // ATL = 7-day exponentially weighted average
  // CTL = 42-day exponentially weighted average
  // Using simple averages as approximation
  const atl = weeklyTSS / 7;
  const ctl = calculate42DayAvgTSS(dailyTSSValues);
  const tsb = calculateTSB(ctl, atl);

  const percentOfAverage =
    avgWeeklyTSS > 0 ? Math.round((weeklyTSS / avgWeeklyTSS) * 100) : 100;

  return {
    weeklyTSS,
    avgWeeklyTSS: Math.round(avgWeeklyTSS),
    percentOfAverage,
    fatigueLevel: getFatigueLevel(tsb),
    tsb: Math.round(tsb),
    ctl: Math.round(ctl),
    atl: Math.round(atl),
  };
}

/**
 * Fetch and store HR zone distribution for an activity
 */
export async function updateActivityZones(
  athlete: IAthlete,
  activityId: number,
): Promise<number[] | null> {
  try {
    const refreshedAthlete = await StravaService.refreshTokenIfNeeded(athlete);
    const zones = await StravaService.getActivityZones(
      refreshedAthlete.accessToken,
      activityId,
    );

    if (!zones || zones.length === 0) {
      return null;
    }

    // Find heartrate zone data
    const hrZone = zones.find((z) => z.type === "heartrate");
    if (!hrZone || !hrZone.distribution_buckets) {
      return null;
    }

    // Extract time per zone (in seconds)
    const zoneDistribution = hrZone.distribution_buckets.map(
      (bucket) => bucket.time,
    );

    // Update activity
    await Activity.findOneAndUpdate(
      { stravaActivityId: activityId },
      { hrZoneDistribution: zoneDistribution },
    );

    return zoneDistribution;
  } catch (error) {
    console.error(`Failed to fetch zones for activity ${activityId}:`, error);
    return null;
  }
}
