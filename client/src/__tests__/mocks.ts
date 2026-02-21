import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import {
  mockUser,
  mockDashboard,
  mockRecovery,
  mockBalance,
  mockFeedback,
  mockGoalCurrent,
  mockGoalHistory,
  mockWeeklyTrend,
} from "./helpers";

export const handlers = [
  http.get("/auth/me", () => HttpResponse.json(mockUser)),
  http.post("/auth/logout", () => HttpResponse.json({ success: true })),
  http.get("/api/dashboard", () => HttpResponse.json(mockDashboard)),
  http.get("/api/activities", () =>
    HttpResponse.json({
      activities: mockDashboard.recentActivities,
      total: 2,
      hasMore: false,
    }),
  ),
  http.post("/api/sync", () =>
    HttpResponse.json({
      success: true,
      synced: 3,
      updated: 1,
      message: "Synced 3 new, updated 1",
    }),
  ),
  http.get("/api/recovery", () => HttpResponse.json(mockRecovery)),
  http.get("/api/balance", () => HttpResponse.json(mockBalance)),
  http.get("/api/weekly-trend", () => HttpResponse.json(mockWeeklyTrend)),
  http.get("/api/feedback", () => HttpResponse.json(mockFeedback)),
  http.get("/api/goals/current", () => HttpResponse.json(mockGoalCurrent)),
  http.get("/api/goals/history", () => HttpResponse.json(mockGoalHistory)),
  http.post("/api/goals", () =>
    HttpResponse.json({
      success: true,
      goal: mockGoalCurrent.goal,
    }),
  ),
];

export const worker = setupWorker(...handlers);
