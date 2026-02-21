import { Activity, WeeklySummary } from "../models/index.js";
import { getWeeksInRange } from "./syncService.js";

interface WeeklyStats {
  weekStart: Date;
  weekEnd: Date;
  totalDistance: number; // km
  totalDuration: number; // hours
  totalElevation: number; // meters
  totalActivities: number;
  avgSufferScore: number | null;
  totalSufferScore: number | null;
  activityTypes: Record<string, number>;
}

interface WeekComparison {
  current: WeeklyStats;
  previous: WeeklyStats | null;
  changes: {
    distance: number | null; // percentage
    duration: number | null;
    elevation: number | null;
    activities: number | null;
    sufferScore: number | null;
  };
}

interface DashboardData {
  weekComparison: WeekComparison;
  recentActivities: Array<{
    id: string;
    stravaActivityId: number;
    name: string;
    type: string;
    distance: number;
    duration: number;
    elevation: number;
    sufferScore: number | null;
    date: Date;
  }>;
  athlete: {
    totalActivitiesAllTime: number;
    totalDistanceAllTime: number;
  };
}

/**
 * Get current week boundaries (Monday-Sunday)
 */
function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);

  const start = new Date(now);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get previous week boundaries
 */
function getPreviousWeekBounds(): { start: Date; end: Date } {
  const current = getCurrentWeekBounds();
  const start = new Date(current.start);
  start.setDate(start.getDate() - 7);

  const end = new Date(current.start);
  end.setMilliseconds(-1);

  return { start, end };
}

/**
 * Convert raw stats to user-friendly format
 */
function formatWeeklyStats(summary: {
  weekStart: Date;
  weekEnd: Date;
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  totalActivities: number;
  avgSufferScore: number | null;
  totalSufferScore: number | null;
  activityTypes: Record<string, number>;
}): WeeklyStats {
  return {
    weekStart: summary.weekStart,
    weekEnd: summary.weekEnd,
    totalDistance: Math.round((summary.totalDistance / 1000) * 100) / 100, // km
    totalDuration: Math.round((summary.totalDuration / 3600) * 100) / 100, // hours
    totalElevation: Math.round(summary.totalElevation),
    totalActivities: summary.totalActivities,
    avgSufferScore: summary.avgSufferScore,
    totalSufferScore: summary.totalSufferScore,
    activityTypes: summary.activityTypes,
  };
}

/**
 * Calculate percentage change between two values
 */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get weekly summary for an athlete
 */
export async function getWeeklySummary(
  stravaAthleteId: number,
): Promise<WeekComparison> {
  const currentWeek = getCurrentWeekBounds();
  const previousWeek = getPreviousWeekBounds();

  // Get cached summaries or calculate from activities
  let currentSummary = await WeeklySummary.findOne({
    stravaAthleteId,
    weekStart: currentWeek.start,
  });

  let previousSummary = await WeeklySummary.findOne({
    stravaAthleteId,
    weekStart: previousWeek.start,
  });

  // If no cached current week, calculate from activities
  if (!currentSummary) {
    const activities = await Activity.find({
      stravaAthleteId,
      startDate: { $gte: currentWeek.start, $lte: currentWeek.end },
    });

    const summary = aggregateActivities(
      activities,
      currentWeek.start,
      currentWeek.end,
    );
    currentSummary = {
      ...summary,
      stravaAthleteId,
    } as any;
  }

  // Format summaries
  const current = formatWeeklyStats({
    weekStart: currentWeek.start,
    weekEnd: currentWeek.end,
    totalDistance: currentSummary?.totalDistance || 0,
    totalDuration: currentSummary?.totalDuration || 0,
    totalElevation: currentSummary?.totalElevation || 0,
    totalActivities: currentSummary?.totalActivities || 0,
    avgSufferScore: currentSummary?.avgSufferScore || null,
    totalSufferScore: currentSummary?.totalSufferScore || null,
    activityTypes:
      (currentSummary?.activityTypes as Record<string, number>) || {},
  });

  const previous = previousSummary
    ? formatWeeklyStats({
        weekStart: previousWeek.start,
        weekEnd: previousWeek.end,
        totalDistance: previousSummary.totalDistance,
        totalDuration: previousSummary.totalDuration,
        totalElevation: previousSummary.totalElevation,
        totalActivities: previousSummary.totalActivities,
        avgSufferScore: previousSummary.avgSufferScore,
        totalSufferScore: previousSummary.totalSufferScore,
        activityTypes: previousSummary.activityTypes as Record<string, number>,
      })
    : null;

  // Calculate changes
  const changes = {
    distance: previous
      ? percentChange(current.totalDistance, previous.totalDistance)
      : null,
    duration: previous
      ? percentChange(current.totalDuration, previous.totalDuration)
      : null,
    elevation: previous
      ? percentChange(current.totalElevation, previous.totalElevation)
      : null,
    activities: previous
      ? percentChange(current.totalActivities, previous.totalActivities)
      : null,
    sufferScore:
      previous && current.totalSufferScore && previous.totalSufferScore
        ? percentChange(current.totalSufferScore, previous.totalSufferScore)
        : null,
  };

  return { current, previous, changes };
}

/**
 * Aggregate activities into summary stats
 */
function aggregateActivities(
  activities: Array<{
    distance: number;
    movingTime: number;
    totalElevationGain: number;
    sufferScore: number | null;
    type: string;
  }>,
  weekStart: Date,
  weekEnd: Date,
) {
  let totalDistance = 0;
  let totalDuration = 0;
  let totalElevation = 0;
  let sufferScoreSum = 0;
  let sufferScoreCount = 0;
  const activityTypes: Record<string, number> = {};

  for (const activity of activities) {
    totalDistance += activity.distance;
    totalDuration += activity.movingTime;
    totalElevation += activity.totalElevationGain;

    if (activity.sufferScore) {
      sufferScoreSum += activity.sufferScore;
      sufferScoreCount++;
    }

    activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
  }

  return {
    weekStart,
    weekEnd,
    totalDistance,
    totalDuration,
    totalElevation,
    totalActivities: activities.length,
    avgSufferScore:
      sufferScoreCount > 0
        ? Math.round(sufferScoreSum / sufferScoreCount)
        : null,
    totalSufferScore: sufferScoreCount > 0 ? sufferScoreSum : null,
    activityTypes,
  };
}

/**
 * Get dashboard data for an athlete
 */
export async function getDashboardData(
  stravaAthleteId: number,
): Promise<DashboardData> {
  // Get week comparison
  const weekComparison = await getWeeklySummary(stravaAthleteId);

  // Get recent activities
  const recentActivities = await Activity.find({ stravaAthleteId })
    .sort({ startDate: -1 })
    .limit(10)
    .lean();

  // Get all-time stats
  const allTimeStats = await Activity.aggregate([
    { $match: { stravaAthleteId } },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalDistance: { $sum: "$distance" },
      },
    },
  ]);

  return {
    weekComparison,
    recentActivities: recentActivities.map((a) => ({
      id: a._id.toString(),
      stravaActivityId: a.stravaActivityId,
      name: a.name,
      type: a.type,
      distance: Math.round((a.distance / 1000) * 100) / 100, // km
      duration: Math.round((a.movingTime / 60) * 10) / 10, // minutes
      elevation: Math.round(a.totalElevationGain),
      sufferScore: a.sufferScore,
      date: a.startDate,
    })),
    athlete: {
      totalActivitiesAllTime: allTimeStats[0]?.totalActivities || 0,
      totalDistanceAllTime: Math.round(
        (allTimeStats[0]?.totalDistance || 0) / 1000,
      ),
    },
  };
}

export {
  getCurrentWeekBounds,
  getPreviousWeekBounds,
  type DashboardData,
  type WeekComparison,
};

/**
 * Get weekly trend data for the past N weeks (including current)
 */
export async function getWeeklyTrend(
  stravaAthleteId: number,
  weeks = 6,
): Promise<
  Array<{
    weekStart: string;
    weekLabel: string;
    distance: number;
    duration: number;
    elevation: number;
    activities: number;
    sufferScore: number | null;
  }>
> {
  const currentWeek = getCurrentWeekBounds();
  const result: Array<{
    weekStart: string;
    weekLabel: string;
    distance: number;
    duration: number;
    elevation: number;
    activities: number;
    sufferScore: number | null;
  }> = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeek.start);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let summary = await WeeklySummary.findOne({
      stravaAthleteId,
      weekStart,
    });

    // For current week, calculate from activities if no cached summary
    if (!summary && i === 0) {
      const activities = await Activity.find({
        stravaAthleteId,
        startDate: { $gte: weekStart, $lte: weekEnd },
      });

      const agg = aggregateActivities(activities, weekStart, weekEnd);
      summary = {
        totalDistance: agg.totalDistance,
        totalDuration: agg.totalDuration,
        totalElevation: agg.totalElevation,
        totalActivities: agg.totalActivities,
        totalSufferScore: agg.totalSufferScore,
      } as any;
    }

    const month = weekStart.toLocaleString("en", { month: "short" });
    const day = weekStart.getDate();
    const label = i === 0 ? "This Week" : `${month} ${day}`;

    result.push({
      weekStart: weekStart.toISOString(),
      weekLabel: label,
      distance: summary
        ? Math.round(((summary.totalDistance || 0) / 1000) * 100) / 100
        : 0,
      duration: summary
        ? Math.round(((summary.totalDuration || 0) / 3600) * 100) / 100
        : 0,
      elevation: summary ? Math.round(summary.totalElevation || 0) : 0,
      activities: summary?.totalActivities || 0,
      sufferScore: summary?.totalSufferScore || null,
    });
  }

  return result;
}
