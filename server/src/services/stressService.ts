import { type IActivity } from "../models/index.js";
import { type IAthlete } from "../models/index.js";

/**
 * Training Stress Score (TSS) Calculation Service
 *
 * Uses heart rate based TSS (hrTSS) formula:
 * hrTSS = (duration × HRavg × IF) / (LTHR × 3600) × 100
 *
 * Where:
 * - duration = activity duration in seconds
 * - HRavg = average heart rate during activity
 * - IF (Intensity Factor) = HRavg / LTHR
 * - LTHR = Lactate Threshold Heart Rate (estimated as 85% of max HR if not configured)
 */

export interface TSSResult {
  tss: number;
  intensityFactor: number;
  lthr: number;
  method: "heartrate" | "suffer_score" | "duration";
}

/**
 * Estimate LTHR from max heart rate (85% of max HR is a common estimate)
 */
export function estimateLTHR(maxHR: number): number {
  return Math.round(maxHR * 0.85);
}

/**
 * Get LTHR for an athlete - use configured zones or estimate from max HR
 */
export function getAthleteLTHR(
  athlete: IAthlete,
  activityMaxHR?: number | null,
): number {
  // If athlete has custom HR zones, use Zone 4 min as LTHR estimate
  if (athlete.hrZones?.customZones && athlete.hrZones.zones.length >= 4) {
    const zone4 = athlete.hrZones.zones[3]; // 0-indexed, zone 4
    if (zone4?.min) {
      return zone4.min;
    }
  }

  // Otherwise estimate from max HR
  // Use activity max HR if available, otherwise use a default
  const maxHR = activityMaxHR || 190; // 190 is a reasonable default
  return estimateLTHR(maxHR);
}

/**
 * Calculate Intensity Factor (IF) = HRavg / LTHR
 */
export function calculateIntensityFactor(avgHR: number, lthr: number): number {
  if (lthr <= 0) return 0;
  return avgHR / lthr;
}

/**
 * Calculate hrTSS using the standard formula
 * hrTSS = (duration × HRavg × IF) / (LTHR × 3600) × 100
 */
export function calculateHrTSS(
  durationSeconds: number,
  avgHR: number,
  lthr: number,
): TSSResult {
  if (!avgHR || !lthr || durationSeconds <= 0) {
    return { tss: 0, intensityFactor: 0, lthr, method: "heartrate" };
  }

  const intensityFactor = calculateIntensityFactor(avgHR, lthr);

  // hrTSS formula
  const tss =
    ((durationSeconds * avgHR * intensityFactor) / (lthr * 3600)) * 100;

  return {
    tss: Math.round(tss * 10) / 10, // Round to 1 decimal
    intensityFactor: Math.round(intensityFactor * 100) / 100,
    lthr,
    method: "heartrate",
  };
}

/**
 * Estimate TSS from Strava's suffer_score (Relative Effort)
 * This is a rough approximation since suffer_score uses a different algorithm
 */
export function estimateTSSFromSufferScore(sufferScore: number): TSSResult {
  // Rough mapping: suffer_score of 100 ≈ TSS of 100
  // This is an approximation; adjust the multiplier based on observed data
  const tss = sufferScore * 0.9;

  return {
    tss: Math.round(tss * 10) / 10,
    intensityFactor: 0,
    lthr: 0,
    method: "suffer_score",
  };
}

/**
 * Estimate TSS from duration alone (fallback when no HR data)
 * Assumes moderate intensity (IF ≈ 0.75)
 */
export function estimateTSSFromDuration(durationSeconds: number): TSSResult {
  // TSS ≈ (duration_hours) × IF² × 100
  // For moderate intensity (IF = 0.75): TSS ≈ duration_hours × 56.25
  const durationHours = durationSeconds / 3600;
  const assumedIF = 0.75;
  const tss = durationHours * Math.pow(assumedIF, 2) * 100;

  return {
    tss: Math.round(tss * 10) / 10,
    intensityFactor: assumedIF,
    lthr: 0,
    method: "duration",
  };
}

/**
 * Calculate TSS for an activity using the best available data
 */
export function calculateActivityTSS(
  activity: IActivity,
  athlete: IAthlete,
): TSSResult {
  const duration = activity.movingTime;

  // Priority 1: Use heart rate data if available
  if (activity.hasHeartrate && activity.averageHeartrate) {
    const lthr = getAthleteLTHR(athlete, activity.maxHeartrate);
    return calculateHrTSS(duration, activity.averageHeartrate, lthr);
  }

  // Priority 2: Use Strava's suffer_score if available
  if (activity.sufferScore && activity.sufferScore > 0) {
    return estimateTSSFromSufferScore(activity.sufferScore);
  }

  // Priority 3: Estimate from duration alone
  return estimateTSSFromDuration(duration);
}

/**
 * Calculate 7-day rolling TSS (Acute Training Load - ATL)
 */
export function calculate7DayTSS(dailyTSSValues: number[]): number {
  // Take last 7 values
  const last7Days = dailyTSSValues.slice(-7);
  return Math.round(last7Days.reduce((sum, tss) => sum + tss, 0));
}

/**
 * Calculate 42-day rolling TSS average (Chronic Training Load - CTL)
 */
export function calculate42DayAvgTSS(dailyTSSValues: number[]): number {
  // Take last 42 values
  const last42Days = dailyTSSValues.slice(-42);
  if (last42Days.length === 0) return 0;
  const sum = last42Days.reduce((acc, tss) => acc + tss, 0);
  return Math.round(sum / last42Days.length);
}

/**
 * Calculate Training Stress Balance (TSB = CTL - ATL)
 * Positive = fresh, Negative = fatigued
 */
export function calculateTSB(ctl: number, atl: number): number {
  return ctl - atl;
}

/**
 * Get fatigue level description based on TSB
 */
export function getFatigueLevel(tsb: number): {
  level: "fresh" | "moderate" | "fatigued" | "overloaded";
  color: "green" | "yellow" | "orange" | "red";
  description: string;
} {
  if (tsb > 15) {
    return {
      level: "fresh",
      color: "green",
      description: "Well rested, ready for hard training",
    };
  } else if (tsb > -10) {
    return {
      level: "moderate",
      color: "yellow",
      description: "Good balance of fitness and fatigue",
    };
  } else if (tsb > -30) {
    return {
      level: "fatigued",
      color: "orange",
      description: "Building fitness, monitor recovery",
    };
  } else {
    return {
      level: "overloaded",
      color: "red",
      description: "High fatigue, rest recommended",
    };
  }
}
