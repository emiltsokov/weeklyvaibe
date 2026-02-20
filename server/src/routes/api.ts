import { Router, type Request, type Response } from "express";
import { Athlete, Activity } from "../models/index.js";
import { getDashboardData } from "../services/aggregationService.js";
import { syncAthleteActivities } from "../services/syncService.js";
import {
  getRecoveryStatus,
  getBalanceScore,
} from "../services/recoveryService.js";
import { getAIFeedback } from "../services/feedbackService.js";

const router = Router();

/**
 * Auth middleware - ensures user is authenticated
 */
async function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session.athleteId || !req.session.stravaId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const athlete = await Athlete.findById(req.session.athleteId);
  if (!athlete) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Athlete not found" });
  }

  // Attach athlete to request for downstream use
  (req as any).athlete = athlete;
  next();
}

/**
 * GET /api/dashboard
 * Returns dashboard data including weekly comparison and recent activities
 */
router.get("/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const stravaId = req.session.stravaId!;
    const data = await getDashboardData(stravaId);
    res.json(data);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

/**
 * GET /api/activities
 * Returns paginated activities list
 */
router.get("/activities", requireAuth, async (req: Request, res: Response) => {
  try {
    const stravaId = req.session.stravaId!;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = Number(req.query.skip) || 0;

    const activities = await Activity.find({ stravaAthleteId: stravaId })
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Activity.countDocuments({ stravaAthleteId: stravaId });

    res.json({
      activities: activities.map((a) => ({
        id: a._id.toString(),
        stravaActivityId: a.stravaActivityId,
        name: a.name,
        type: a.type,
        sportType: a.sportType,
        distance: Math.round((a.distance / 1000) * 100) / 100,
        duration: Math.round((a.movingTime / 60) * 10) / 10,
        elevation: Math.round(a.totalElevationGain),
        sufferScore: a.sufferScore,
        averageHeartrate: a.averageHeartrate,
        maxHeartrate: a.maxHeartrate,
        averageSpeed: a.averageSpeed,
        date: a.startDate,
        hasHeartrate: a.hasHeartrate,
      })),
      total,
      hasMore: skip + activities.length < total,
    });
  } catch (error) {
    console.error("Activities error:", error);
    res.status(500).json({ error: "Failed to load activities" });
  }
});

/**
 * POST /api/sync
 * Triggers manual sync of activities from Strava
 */
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const athlete = (req as any).athlete;
    const daysBack = Math.min(Number(req.query.days) || 30, 365);

    const result = await syncAthleteActivities(athlete, daysBack);

    res.json({
      success: true,
      synced: result.synced,
      updated: result.updated,
      message: `Synced ${result.synced} new activities, updated ${result.updated}`,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

/**
 * GET /api/recovery
 * Returns current recovery status based on recent activity intensity
 */
router.get("/recovery", requireAuth, async (req: Request, res: Response) => {
  try {
    const athlete = (req as any).athlete;
    const data = await getRecoveryStatus(athlete);

    // Get last activity for additional info
    const lastActivity = await Activity.findOne({
      stravaAthleteId: athlete.stravaId,
    }).sort({ startDate: -1 });

    // Transform to expected frontend format
    res.json({
      status: data.status,
      message: data.description,
      lastActivity: lastActivity
        ? {
            name: lastActivity.name,
            date: lastActivity.startDate.toISOString(),
            type: lastActivity.type,
            zone4_5Percentage: data.lastActivityIntensity?.zone4_5Percent || 0,
            avgHeartrate: lastActivity.averageHeartrate || 0,
            maxHeartrate: lastActivity.maxHeartrate || 0,
          }
        : null,
      zoneDistribution: data.lastActivityIntensity?.zoneDistribution || null,
    });
  } catch (error) {
    console.error("Recovery status error:", error);
    res.status(500).json({ error: "Failed to load recovery status" });
  }
});

/**
 * GET /api/balance
 * Returns training balance score (TSS, CTL, ATL, TSB)
 */
router.get("/balance", requireAuth, async (req: Request, res: Response) => {
  try {
    const athlete = (req as any).athlete;
    const data = await getBalanceScore(athlete);

    // Calculate activities count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activitiesCount = await Activity.countDocuments({
      stravaAthleteId: athlete.stravaId,
      startDate: { $gte: sevenDaysAgo },
    });

    // Determine trend based on percent of average
    let trend: "building" | "maintaining" | "recovering" = "maintaining";
    if (data.percentOfAverage > 110) {
      trend = "building";
    } else if (data.percentOfAverage < 90) {
      trend = "recovering";
    }

    // Fatigue color
    const fatigueColorMap = {
      fresh: "green",
      optimal: "blue",
      tired: "yellow",
      exhausted: "red",
    };

    // Transform to expected frontend format
    res.json({
      weeklyTSS: Math.round(data.weeklyTSS),
      ctl: data.ctl,
      atl: data.atl,
      tsb: data.tsb,
      fatigueLevel: data.fatigueLevel,
      fatigueColor: fatigueColorMap[data.fatigueLevel],
      trend,
      activitiesCount,
    });
  } catch (error) {
    console.error("Balance score error:", error);
    res.status(500).json({ error: "Failed to load balance score" });
  }
});

/**
 * GET /api/feedback
 * Returns AI-generated coaching feedback
 */
router.get("/feedback", requireAuth, async (req: Request, res: Response) => {
  try {
    const athlete = (req as any).athlete;
    const forceRefresh = req.query.refresh === "true";

    const feedback = await getAIFeedback(athlete, forceRefresh);

    res.json(feedback);
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

export { router as apiRouter };
