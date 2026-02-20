import {
  Goal,
  type IGoal,
  type GoalType,
  type ActivityFilter,
} from "../models/index.js";
import { Activity } from "../models/index.js";
import type { IAthlete } from "../models/index.js";

/**
 * Get the start of the current week (Monday)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate progress for a goal based on activities
 */
async function calculateGoalProgress(
  athleteId: number,
  goal: IGoal,
): Promise<number> {
  const weekEnd = new Date(goal.weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Build activity query
  const query: any = {
    stravaAthleteId: athleteId,
    startDate: {
      $gte: goal.weekStart,
      $lt: weekEnd,
    },
  };

  // Filter by activity type (map to Strava types)
  if (goal.activityFilter !== "all") {
    const typeMap: Record<string, string[]> = {
      run: ["Run", "TrailRun", "VirtualRun", "Treadmill"],
      ride: [
        "Ride",
        "VirtualRide",
        "MountainBikeRide",
        "GravelRide",
        "EBikeRide",
      ],
      swim: ["Swim", "OpenWaterSwim"],
    };
    query.type = { $in: typeMap[goal.activityFilter] || [] };
  }

  const activities = await Activity.find(query).lean();

  if (goal.type === "duration") {
    // Sum moving time in hours
    const totalSeconds = activities.reduce(
      (sum, a) => sum + (a.movingTime || 0),
      0,
    );
    return Math.round((totalSeconds / 3600) * 100) / 100; // Hours with 2 decimal places
  } else {
    // Sum distance in km
    const totalMeters = activities.reduce(
      (sum, a) => sum + (a.distance || 0),
      0,
    );
    return Math.round((totalMeters / 1000) * 100) / 100; // km with 2 decimal places
  }
}

/**
 * Get pace status based on progress and day of week
 */
function getPaceStatus(
  progress: number,
  target: number,
): {
  status: "on-track" | "behind" | "overachieving";
  percentComplete: number;
  message: string;
} {
  const percentComplete = Math.round((progress / target) * 100);
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek;
  const expectedPercent = (daysElapsed / 7) * 100;

  if (percentComplete >= 130) {
    return {
      status: "overachieving",
      percentComplete,
      message: "⚡ Crushing it! Consider a rest day to avoid burnout",
    };
  } else if (percentComplete >= expectedPercent - 10) {
    return {
      status: "on-track",
      percentComplete,
      message: "✨ On track! Keep up the good work",
    };
  } else {
    return {
      status: "behind",
      percentComplete,
      message: "📉 Behind schedule. Time to get moving!",
    };
  }
}

/**
 * Get current active goal for an athlete
 */
export async function getCurrentGoal(athlete: IAthlete) {
  const weekStart = getWeekStart();

  // Find active goal for this week
  let goal = await Goal.findOne({
    athleteId: athlete.stravaId,
    weekStart,
    isActive: true,
  });

  if (!goal) {
    // Check for previous week's goal to carry over settings
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const previousGoal = await Goal.findOne({
      athleteId: athlete.stravaId,
      weekStart: lastWeekStart,
      isActive: true,
    });

    if (previousGoal) {
      // Create new goal with same settings
      goal = await Goal.create({
        athleteId: athlete.stravaId,
        type: previousGoal.type,
        target: previousGoal.target,
        unit: previousGoal.unit,
        activityFilter: previousGoal.activityFilter,
        weekStart,
        progress: 0,
        isActive: true,
      });
    } else {
      return null; // No goal set
    }
  }

  // Calculate current progress
  const progress = await calculateGoalProgress(athlete.stravaId, goal);

  // Update stored progress
  await Goal.updateOne({ _id: goal._id }, { progress });

  const paceStatus = getPaceStatus(progress, goal.target);

  return {
    id: goal._id.toString(),
    type: goal.type,
    target: goal.target,
    unit: goal.unit,
    activityFilter: goal.activityFilter,
    weekStart: goal.weekStart.toISOString(),
    progress,
    ...paceStatus,
  };
}

/**
 * Create or update a goal for the current week
 */
export async function setGoal(
  athlete: IAthlete,
  data: {
    type: GoalType;
    target: number;
    activityFilter?: ActivityFilter;
  },
) {
  const weekStart = getWeekStart();
  const unit = data.type === "duration" ? "hours" : "km";

  // Deactivate any existing goals for this week
  await Goal.updateMany(
    { athleteId: athlete.stravaId, weekStart, isActive: true },
    { isActive: false },
  );

  // Create new goal
  const goal = await Goal.create({
    athleteId: athlete.stravaId,
    type: data.type,
    target: data.target,
    unit,
    activityFilter: data.activityFilter || "all",
    weekStart,
    progress: 0,
    isActive: true,
  });

  // Calculate initial progress
  const progress = await calculateGoalProgress(athlete.stravaId, goal);
  await Goal.updateOne({ _id: goal._id }, { progress });

  const paceStatus = getPaceStatus(progress, goal.target);

  return {
    id: goal._id.toString(),
    type: goal.type,
    target: goal.target,
    unit,
    activityFilter: goal.activityFilter,
    weekStart: goal.weekStart.toISOString(),
    progress,
    ...paceStatus,
  };
}

/**
 * Get goal history for an athlete
 */
export async function getGoalHistory(athlete: IAthlete, weeks: number = 8) {
  const goals = await Goal.find({
    athleteId: athlete.stravaId,
    isActive: true,
  })
    .sort({ weekStart: -1 })
    .limit(weeks)
    .lean();

  return goals.map((g) => ({
    id: g._id.toString(),
    type: g.type,
    target: g.target,
    unit: g.unit,
    activityFilter: g.activityFilter,
    weekStart: g.weekStart.toISOString(),
    progress: g.progress,
    percentComplete: Math.round((g.progress / g.target) * 100),
    completed: g.progress >= g.target,
  }));
}

/**
 * Update goal progress after activity sync
 */
export async function updateGoalProgress(athleteId: number) {
  const weekStart = getWeekStart();

  const goal = await Goal.findOne({
    athleteId,
    weekStart,
    isActive: true,
  });

  if (!goal) return null;

  const progress = await calculateGoalProgress(athleteId, goal);
  await Goal.updateOne({ _id: goal._id }, { progress });

  return { goalId: goal._id, progress };
}

/**
 * Check for burnout warning based on goal history
 */
export async function checkBurnoutWarning(athlete: IAthlete): Promise<{
  warning: boolean;
  message?: string;
  consecutiveWeeks?: number;
}> {
  const history = await getGoalHistory(athlete, 4);

  if (history.length < 2) {
    return { warning: false };
  }

  // Check how many consecutive weeks exceeded 130%
  let consecutiveWeeks = 0;
  for (const g of history) {
    if (g.percentComplete >= 130) {
      consecutiveWeeks++;
    } else {
      break;
    }
  }

  if (consecutiveWeeks >= 2) {
    return {
      warning: true,
      consecutiveWeeks,
      message: `You've exceeded your goal by 30%+ for ${consecutiveWeeks} weeks in a row. Consider a recovery week!`,
    };
  }

  return { warning: false };
}
