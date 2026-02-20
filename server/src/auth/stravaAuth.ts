import { Router, type Request, type Response } from "express";
import { config } from "../config/index.js";
import { StravaService } from "../services/stravaService.js";
import { Athlete } from "../models/index.js";
import { syncAthleteActivities } from "../services/syncService.js";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    athleteId?: string;
    stravaId?: number;
  }
}

const router = Router();

/**
 * GET /auth/strava
 * Redirects to Strava OAuth authorization page
 */
router.get("/strava", (_req: Request, res: Response) => {
  const authUrl = StravaService.getAuthorizationUrl();
  res.redirect(authUrl);
});

/**
 * GET /auth/callback
 * Handles Strava OAuth callback, exchanges code for tokens
 */
router.get("/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    console.error("Strava auth error:", error);
    return res.redirect(`${config.client.url}/login?error=auth_denied`);
  }

  if (!code || typeof code !== "string") {
    return res.redirect(`${config.client.url}/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenData = await StravaService.exchangeToken(code);

    // Find or create athlete
    let athlete = await Athlete.findOne({ stravaId: tokenData.athlete.id });

    if (athlete) {
      // Update existing athlete tokens
      athlete.accessToken = tokenData.access_token;
      athlete.refreshToken = tokenData.refresh_token;
      athlete.expiresAt = tokenData.expires_at;
      athlete.profile = {
        firstName: tokenData.athlete.firstname,
        lastName: tokenData.athlete.lastname,
        profilePicture: tokenData.athlete.profile,
        city: tokenData.athlete.city,
        country: tokenData.athlete.country,
      };
      await athlete.save();
    } else {
      // Create new athlete
      athlete = await Athlete.create({
        stravaId: tokenData.athlete.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        profile: {
          firstName: tokenData.athlete.firstname,
          lastName: tokenData.athlete.lastname,
          profilePicture: tokenData.athlete.profile,
          city: tokenData.athlete.city,
          country: tokenData.athlete.country,
        },
      });

      // Fetch HR zones for new athlete
      try {
        const zones = await StravaService.getAthleteZones(
          tokenData.access_token,
        );
        if (zones?.heart_rate) {
          athlete.hrZones = {
            customZones: zones.heart_rate.custom_zones,
            zones: zones.heart_rate.zones,
          };
          await athlete.save();
        }
      } catch (zoneError) {
        console.warn("Could not fetch HR zones:", zoneError);
      }
    }

    // Set session
    req.session.athleteId = athlete._id.toString();
    req.session.stravaId = athlete.stravaId;

    // Trigger initial sync in background (don't await)
    syncAthleteActivities(athlete).catch((err) => {
      console.error("Background sync error:", err);
    });

    // Redirect to dashboard
    res.redirect(`${config.client.url}/dashboard`);
  } catch (err) {
    console.error("Token exchange error:", err);
    res.redirect(`${config.client.url}/login?error=token_exchange`);
  }
});

/**
 * GET /auth/me
 * Returns current authenticated athlete
 */
router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.athleteId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const athlete = await Athlete.findById(req.session.athleteId);

  if (!athlete) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Athlete not found" });
  }

  res.json({
    id: athlete._id,
    stravaId: athlete.stravaId,
    profile: athlete.profile,
  });
});

/**
 * POST /auth/logout
 * Destroys session
 */
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true });
  });
});

export { router as stravaAuthRouter };
