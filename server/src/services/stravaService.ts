import axios, { AxiosError } from "axios";
import { config } from "../config/index.js";
import { Athlete, type IAthlete } from "../models/index.js";

const stravaApi = axios.create({
  baseURL: config.strava.apiBaseUrl,
});

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    city: string;
    country: string;
  };
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  suffer_score: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  average_speed: number;
  max_speed: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  has_heartrate: boolean;
  athlete: { id: number };
}

interface StravaZone {
  score: number;
  type: string;
  sensor_based: boolean;
  custom_zones: boolean;
  distribution_buckets: Array<{ min: number; max: number; time: number }>;
}

export class StravaService {
  /**
   * Exchange authorization code for tokens
   */
  static async exchangeToken(code: string): Promise<StravaTokenResponse> {
    const response = await axios.post<StravaTokenResponse>(
      config.strava.tokenUrl,
      {
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        code,
        grant_type: "authorization_code",
      },
    );
    return response.data;
  }

  /**
   * Refresh access token if expired
   */
  static async refreshTokenIfNeeded(athlete: IAthlete): Promise<IAthlete> {
    const now = Math.floor(Date.now() / 1000);
    const buffer = 300; // 5 minutes buffer

    if (athlete.expiresAt > now + buffer) {
      return athlete;
    }

    console.log(`Refreshing token for athlete ${athlete.stravaId}`);

    const response = await axios.post<StravaTokenResponse>(
      config.strava.tokenUrl,
      {
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        refresh_token: athlete.refreshToken,
        grant_type: "refresh_token",
      },
    );

    athlete.accessToken = response.data.access_token;
    athlete.refreshToken = response.data.refresh_token;
    athlete.expiresAt = response.data.expires_at;
    await athlete.save();

    return athlete;
  }

  /**
   * Get authenticated athlete profile
   */
  static async getAthleteProfile(accessToken: string) {
    const response = await stravaApi.get("/athlete", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  /**
   * Get athlete's heart rate zones
   */
  static async getAthleteZones(accessToken: string) {
    try {
      const response = await stravaApi.get("/athlete/zones", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      // Zones might not be available for all athletes
      console.warn(
        "Could not fetch athlete zones:",
        (error as AxiosError).message,
      );
      return null;
    }
  }

  /**
   * Get activities with pagination
   */
  static async getActivities(
    accessToken: string,
    options: {
      before?: number;
      after?: number;
      page?: number;
      perPage?: number;
    } = {},
  ): Promise<StravaActivity[]> {
    const { before, after, page = 1, perPage = 100 } = options;

    const params: Record<string, number> = { page, per_page: perPage };
    if (before) params.before = before;
    if (after) params.after = after;

    const response = await stravaApi.get<StravaActivity[]>(
      "/athlete/activities",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      },
    );

    return response.data;
  }

  /**
   * Fetch all activities within a date range (handles pagination)
   */
  static async getAllActivities(
    accessToken: string,
    after: number,
    before?: number,
  ): Promise<StravaActivity[]> {
    const allActivities: StravaActivity[] = [];
    let page = 1;
    const perPage = 200; // Max allowed

    while (true) {
      const activities = await this.getActivities(accessToken, {
        after,
        before,
        page,
        perPage,
      });

      if (activities.length === 0) break;

      allActivities.push(...activities);

      if (activities.length < perPage) break;

      page++;

      // Rate limiting protection
      await this.delay(100);
    }

    return allActivities;
  }

  /**
   * Get heart rate zones for a specific activity
   */
  static async getActivityZones(
    accessToken: string,
    activityId: number,
  ): Promise<StravaZone[]> {
    try {
      const response = await stravaApi.get<StravaZone[]>(
        `/activities/${activityId}/zones`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    } catch (error) {
      console.warn(
        `Could not fetch zones for activity ${activityId}:`,
        (error as AxiosError).message,
      );
      return [];
    }
  }

  /**
   * Get a single activity by ID
   */
  static async getActivity(
    accessToken: string,
    activityId: number,
  ): Promise<StravaActivity | null> {
    try {
      const response = await stravaApi.get<StravaActivity>(
        `/activities/${activityId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Build OAuth authorization URL
   */
  static getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: config.strava.clientId,
      redirect_uri: config.strava.redirectUri,
      response_type: "code",
      scope: config.strava.scopes,
      approval_prompt: "auto",
    });

    if (state) {
      params.append("state", state);
    }

    return `${config.strava.authUrl}?${params.toString()}`;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export type { StravaActivity, StravaTokenResponse, StravaZone };
