import { Router, type Request, type Response } from "express";
import { Athlete, Activity } from "../models/index.js";
import { getDashboardData } from "../services/aggregationService.js";
import { syncAthleteActivities } from "../services/syncService.js";

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

export { router as apiRouter };
