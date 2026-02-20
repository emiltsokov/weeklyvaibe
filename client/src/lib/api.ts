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
