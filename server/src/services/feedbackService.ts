import OpenAI from "openai";
import { Activity, type IAthlete } from "../models/index.js";
import { getBalanceScore, getRecoveryStatus } from "./recoveryService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for feedback to avoid excessive API calls
const feedbackCache = new Map<
  string,
  { feedback: string; cachedAt: number; expiresAt: number }
>();

const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface FeedbackResult {
  message: string;
  type: "motivation" | "warning" | "advice" | "celebration";
  cachedAt: string;
  expiresAt: string;
  canRefresh: boolean;
}

interface AthleteContext {
  weeklyTSS: number;
  avgWeeklyTSS: number;
  percentOfAverage: number;
  recoveryStatus: string;
  fatigueLevel: string;
  tsb: number;
  recentActivitiesCount: number;
  lastActivityName: string | null;
  lastActivityType: string | null;
  consecutiveHighIntensityDays: number;
}

/**
 * Build context about athlete's current training state
 */
async function buildAthleteContext(athlete: IAthlete): Promise<AthleteContext> {
  const balance = await getBalanceScore(athlete);
  const recovery = await getRecoveryStatus(athlete);

  // Get recent activities (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivities = await Activity.find({
    stravaAthleteId: athlete.stravaId,
    startDate: { $gte: sevenDaysAgo },
  })
    .sort({ startDate: -1 })
    .lean();

  // Count consecutive high-intensity days
  let consecutiveHighDays = 0;
  const dailyIntensity = new Map<string, boolean>();

  for (const activity of recentActivities) {
    const dateKey = new Date(activity.startDate).toISOString().split("T")[0];
    const tss = activity.calculatedTSS || 0;

    // Consider high intensity if TSS > 80 for the day
    if (tss > 80) {
      dailyIntensity.set(dateKey, true);
    }
  }

  // Check consecutive days from today backwards
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    if (dailyIntensity.get(dateKey)) {
      consecutiveHighDays++;
    } else {
      break;
    }
  }

  const lastActivity = recentActivities[0] || null;

  return {
    weeklyTSS: balance.weeklyTSS,
    avgWeeklyTSS: balance.avgWeeklyTSS,
    percentOfAverage: balance.percentOfAverage,
    recoveryStatus: recovery.status,
    fatigueLevel: balance.fatigueLevel,
    tsb: balance.tsb,
    recentActivitiesCount: recentActivities.length,
    lastActivityName: lastActivity?.name || null,
    lastActivityType: lastActivity?.type || null,
    consecutiveHighIntensityDays: consecutiveHighDays,
  };
}

/**
 * Generate AI prompt based on athlete context
 */
function buildPrompt(context: AthleteContext, athleteName: string): string {
  const scenarios: string[] = [];

  // Determine scenario
  if (context.percentOfAverage > 130) {
    scenarios.push("OVERLOAD: Training load is >130% of your 4-week average");
  } else if (context.percentOfAverage < 70) {
    scenarios.push(
      "UNDERTRAINING: Training load is <70% of your 4-week average",
    );
  }

  if (context.consecutiveHighIntensityDays >= 3) {
    scenarios.push(
      `FATIGUE RISK: ${context.consecutiveHighIntensityDays} consecutive high-intensity days`,
    );
  }

  if (context.recoveryStatus === "rest") {
    scenarios.push("NEEDS REST: Recent activity was very intense");
  }

  if (context.tsb < -20) {
    scenarios.push(
      "ACCUMULATED FATIGUE: Training stress balance is very negative",
    );
  } else if (context.tsb > 15) {
    scenarios.push("WELL RESTED: Good form, ready for peak performance");
  }

  if (
    context.percentOfAverage >= 90 &&
    context.percentOfAverage <= 110 &&
    context.fatigueLevel === "optimal"
  ) {
    scenarios.push("BALANCED TRAINING: Great consistency and load management");
  }

  const scenarioText =
    scenarios.length > 0
      ? scenarios.join("\n")
      : "NORMAL: Training within expected parameters";

  return `You are a supportive cycling and fitness coach providing personalized daily feedback for ${athleteName}.

Current Training Status:
- Weekly TSS: ${context.weeklyTSS} (${context.percentOfAverage}% of 4-week average)
- Recovery Status: ${context.recoveryStatus}
- Fatigue Level: ${context.fatigueLevel}
- Form (TSB): ${context.tsb}
- Activities this week: ${context.recentActivitiesCount}
- Consecutive high-intensity days: ${context.consecutiveHighIntensityDays}
${context.lastActivityName ? `- Last activity: ${context.lastActivityName} (${context.lastActivityType})` : ""}

Scenario Assessment:
${scenarioText}

Provide a brief, personalized coaching message (2-3 sentences max) that:
1. Acknowledges their current state
2. Gives actionable advice for today
3. Maintains a supportive, encouraging tone

Keep it conversational and specific. Avoid generic advice.`;
}

/**
 * Determine feedback type based on context
 */
function determineFeedbackType(
  context: AthleteContext,
): FeedbackResult["type"] {
  if (
    context.percentOfAverage > 130 ||
    context.consecutiveHighIntensityDays >= 3
  ) {
    return "warning";
  }
  if (
    context.percentOfAverage >= 90 &&
    context.percentOfAverage <= 110 &&
    context.fatigueLevel === "optimal"
  ) {
    return "celebration";
  }
  if (context.recoveryStatus === "rest" || context.tsb < -20) {
    return "advice";
  }
  return "motivation";
}

/**
 * Get cached feedback or generate new one
 */
export async function getAIFeedback(
  athlete: IAthlete,
  forceRefresh = false,
): Promise<FeedbackResult> {
  const cacheKey = `feedback_${athlete.stravaId}`;
  const now = Date.now();

  // Check cache
  const cached = feedbackCache.get(cacheKey);
  if (cached && cached.expiresAt > now && !forceRefresh) {
    return {
      message: cached.feedback,
      type: determineFeedbackType(await buildAthleteContext(athlete)),
      cachedAt: new Date(cached.cachedAt).toISOString(),
      expiresAt: new Date(cached.expiresAt).toISOString(),
      canRefresh: false,
    };
  }

  // Generate new feedback
  const context = await buildAthleteContext(athlete);
  const athleteName = athlete.profile?.firstName || "there";
  const prompt = buildPrompt(context, athleteName);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly, supportive fitness coach. Keep responses brief and actionable.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const message =
      completion.choices[0]?.message?.content?.trim() ||
      "Keep up the great work! Listen to your body and train smart.";

    // Cache the result
    const cachedAt = now;
    const expiresAt = now + CACHE_DURATION_MS;

    feedbackCache.set(cacheKey, {
      feedback: message,
      cachedAt,
      expiresAt,
    });

    return {
      message,
      type: determineFeedbackType(context),
      cachedAt: new Date(cachedAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      canRefresh: true,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);

    // Return fallback message
    const fallbackMessage = generateFallbackMessage(context);

    return {
      message: fallbackMessage,
      type: determineFeedbackType(context),
      cachedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 60 * 60 * 1000).toISOString(), // 1 hour cache for fallback
      canRefresh: true,
    };
  }
}

/**
 * Generate fallback message when API fails
 */
function generateFallbackMessage(context: AthleteContext): string {
  if (context.percentOfAverage > 130) {
    return "You've been training hard! Consider an easier session or rest day to let your body recover.";
  }

  if (context.consecutiveHighIntensityDays >= 3) {
    return "Three or more intense days in a row - time for some active recovery or a rest day.";
  }

  if (context.recoveryStatus === "rest") {
    return "Your last session was demanding. Take it easy today with some light stretching or a short walk.";
  }

  if (context.tsb > 15) {
    return "You're well-rested and in good form! Great time for a quality training session.";
  }

  if (context.percentOfAverage < 70) {
    return "Training volume is lower than usual. If you're feeling good, consider adding a session this week.";
  }

  return "Keep up the consistent work! Balance your intensity with adequate recovery for best results.";
}

/**
 * Clear cached feedback for an athlete
 */
export function clearFeedbackCache(athleteId: number): void {
  feedbackCache.delete(`feedback_${athleteId}`);
}
