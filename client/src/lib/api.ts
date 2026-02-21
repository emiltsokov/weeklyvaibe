import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "";

// Types
export interface User {
  id: string;
  stravaId: number;
  profile: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
    city?: string;
    country?: string;
  };
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  totalActivities: number;
  avgSufferScore: number | null;
  totalSufferScore: number | null;
  activityTypes: Record<string, number>;
}

export interface WeekComparison {
  current: WeeklyStats;
  previous: WeeklyStats | null;
  changes: {
    distance: number | null;
    duration: number | null;
    elevation: number | null;
    activities: number | null;
    sufferScore: number | null;
  };
}

export interface ActivitySummary {
  id: string;
  stravaActivityId: number;
  name: string;
  type: string;
  distance: number;
  duration: number;
  elevation: number;
  sufferScore: number | null;
  date: string;
}

export interface DashboardData {
  weekComparison: WeekComparison;
  recentActivities: ActivitySummary[];
  athlete: {
    totalActivitiesAllTime: number;
    totalDistanceAllTime: number;
  };
}

export interface ActivitiesResponse {
  activities: ActivitySummary[];
  total: number;
  hasMore: boolean;
}

export interface RecoveryData {
  status: "ready" | "light" | "rest";
  message: string;
  lastActivity: {
    name: string;
    date: string;
    type: string;
    zone4_5Percentage: number;
    avgHeartrate: number;
    maxHeartrate: number;
  } | null;
  zoneDistribution: number[] | null;
}

export interface BalanceData {
  weeklyTSS: number;
  ctl: number;
  atl: number;
  tsb: number;
  fatigueLevel: "fresh" | "optimal" | "tired" | "exhausted";
  fatigueColor: string;
  trend: "building" | "maintaining" | "recovering";
  activitiesCount: number;
}

export interface FeedbackData {
  message: string;
  type: "motivation" | "warning" | "advice" | "celebration";
  cachedAt: string;
  expiresAt: string;
  canRefresh: boolean;
}

export type GoalType = "duration" | "distance";
export type ActivityFilter = "all" | "run" | "ride" | "swim";

export interface GoalData {
  id: string;
  type: GoalType;
  target: number;
  unit: string;
  activityFilter: ActivityFilter;
  weekStart: string;
  progress: number;
  status: "on-track" | "behind" | "overachieving";
  percentComplete: number;
  message: string;
}

export interface CurrentGoalResponse {
  hasGoal: boolean;
  goal?: GoalData;
  burnout?: {
    warning: boolean;
    message?: string;
    consecutiveWeeks?: number;
  };
}

export interface GoalHistoryItem {
  id: string;
  type: GoalType;
  target: number;
  unit: string;
  activityFilter: ActivityFilter;
  weekStart: string;
  progress: number;
  percentComplete: number;
  completed: boolean;
}

export interface WeeklyTrendItem {
  weekStart: string;
  weekLabel: string;
  distance: number;
  duration: number;
  elevation: number;
  activities: number;
  sufferScore: number | null;
}

// API fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

// Hooks
export function useAuth() {
  return useQuery({
    queryKey: ["auth"],
    queryFn: () => fetchApi<User>("/auth/me"),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchApi<DashboardData>("/api/dashboard"),
  });
}

export function useActivities(limit = 20, skip = 0) {
  return useQuery({
    queryKey: ["activities", limit, skip],
    queryFn: () =>
      fetchApi<ActivitiesResponse>(
        `/api/activities?limit=${limit}&skip=${skip}`,
      ),
  });
}

export function useSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (days?: number) =>
      fetchApi<{
        success: boolean;
        synced: number;
        updated: number;
        message: string;
      }>(`/api/sync${days ? `?days=${days}` : ""}`, { method: "POST" }),
    onSuccess: () => {
      // Invalidate dashboard and activities queries
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["recovery"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useRecovery() {
  return useQuery({
    queryKey: ["recovery"],
    queryFn: () => fetchApi<RecoveryData>("/api/recovery"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBalance() {
  return useQuery({
    queryKey: ["balance"],
    queryFn: () => fetchApi<BalanceData>("/api/balance"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWeeklyTrend(weeks = 6) {
  return useQuery({
    queryKey: ["weekly-trend", weeks],
    queryFn: () =>
      fetchApi<{ trend: WeeklyTrendItem[] }>(
        `/api/weekly-trend?weeks=${weeks}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeedback() {
  return useQuery({
    queryKey: ["feedback"],
    queryFn: () => fetchApi<FeedbackData>("/api/feedback"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRefreshFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fetchApi<FeedbackData>("/api/feedback?refresh=true"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchApi<{ success: boolean }>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

export function useCurrentGoal() {
  return useQuery({
    queryKey: ["goal", "current"],
    queryFn: () => fetchApi<CurrentGoalResponse>("/api/goals/current"),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useGoalHistory(weeks = 8) {
  return useQuery({
    queryKey: ["goal", "history", weeks],
    queryFn: () =>
      fetchApi<{ history: GoalHistoryItem[] }>(
        `/api/goals/history?weeks=${weeks}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: GoalType;
      target: number;
      activityFilter?: ActivityFilter;
    }) =>
      fetchApi<{ success: boolean; goal: GoalData }>("/api/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });
}
