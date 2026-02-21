import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
});

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        ChakraProvider,
        { theme },
        React.createElement(BrowserRouter, null, children),
      ),
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}

export const mockUser = {
  id: "user1",
  stravaId: 12345,
  profile: {
    firstName: "John",
    lastName: "Doe",
    profilePicture: "https://example.com/pic.jpg",
    city: "Sofia",
    country: "BG",
  },
};

export const mockDashboard = {
  weekComparison: {
    current: {
      weekStart: "2026-02-16T00:00:00.000Z",
      weekEnd: "2026-02-22T23:59:59.999Z",
      totalDistance: 42.5,
      totalDuration: 5.2,
      totalElevation: 350,
      totalActivities: 4,
      avgSufferScore: 85,
      totalSufferScore: 340,
      activityTypes: { Run: 3, Ride: 1 },
    },
    previous: {
      weekStart: "2026-02-09T00:00:00.000Z",
      weekEnd: "2026-02-15T23:59:59.999Z",
      totalDistance: 38.0,
      totalDuration: 4.8,
      totalElevation: 300,
      totalActivities: 3,
      avgSufferScore: 78,
      totalSufferScore: 234,
      activityTypes: { Run: 2, Ride: 1 },
    },
    changes: {
      distance: 11.8,
      duration: 8.3,
      elevation: 16.7,
      activities: 33.3,
      sufferScore: 9.0,
    },
  },
  recentActivities: [
    {
      id: "act1",
      stravaActivityId: 1001,
      name: "Morning Run",
      type: "Run",
      distance: 10.5,
      duration: 52,
      elevation: 120,
      sufferScore: 95,
      date: "2026-02-20T08:00:00.000Z",
    },
    {
      id: "act2",
      stravaActivityId: 1002,
      name: "Easy Ride",
      type: "Ride",
      distance: 25.0,
      duration: 65,
      elevation: 200,
      sufferScore: null,
      date: "2026-02-19T16:00:00.000Z",
    },
  ],
  athlete: {
    totalActivitiesAllTime: 150,
    totalDistanceAllTime: 2500,
  },
};

export const mockRecovery = {
  status: "ready" as const,
  message: "You're ready to train!",
  lastActivity: {
    name: "Morning Run",
    date: "2026-02-20T08:00:00.000Z",
    type: "Run",
    zone4_5Percentage: 25,
    avgHeartrate: 155,
    maxHeartrate: 185,
  },
  zoneDistribution: [10, 20, 35, 20, 15],
};

export const mockBalance = {
  weeklyTSS: 250,
  ctl: 45,
  atl: 60,
  tsb: -15,
  fatigueLevel: "optimal" as const,
  fatigueColor: "blue",
  trend: "building" as const,
  activitiesCount: 4,
};

export const mockFeedback = {
  message: "Great job this week! Keep pushing but remember to rest.",
  type: "motivation" as const,
  cachedAt: "2026-02-20T10:00:00.000Z",
  expiresAt: "2026-02-20T16:00:00.000Z",
  canRefresh: true,
};

export const mockGoalCurrent = {
  hasGoal: true,
  goal: {
    id: "goal1",
    type: "duration" as const,
    target: 7,
    unit: "hrs",
    activityFilter: "all" as const,
    weekStart: "2026-02-16T00:00:00.000Z",
    progress: 5.2,
    status: "on-track" as const,
    percentComplete: 74,
    message: "Keep it up! You're on pace.",
  },
  burnout: { warning: false },
};

export const mockGoalHistory = {
  history: [
    {
      id: "gh1",
      type: "duration" as const,
      target: 6,
      unit: "hrs",
      activityFilter: "all" as const,
      weekStart: "2026-02-09T00:00:00.000Z",
      progress: 6.5,
      percentComplete: 108,
      completed: true,
    },
    {
      id: "gh2",
      type: "distance" as const,
      target: 40,
      unit: "km",
      activityFilter: "run" as const,
      weekStart: "2026-02-02T00:00:00.000Z",
      progress: 28,
      percentComplete: 70,
      completed: false,
    },
  ],
};

export const mockWeeklyTrend = {
  trend: [
    { weekStart: "2026-01-12T00:00:00.000Z", weekLabel: "Jan 12", distance: 30.0, duration: 4.0, elevation: 200, activities: 3, sufferScore: 180 },
    { weekStart: "2026-01-19T00:00:00.000Z", weekLabel: "Jan 19", distance: 35.5, duration: 4.5, elevation: 280, activities: 4, sufferScore: 220 },
    { weekStart: "2026-01-26T00:00:00.000Z", weekLabel: "Jan 26", distance: 28.0, duration: 3.8, elevation: 150, activities: 3, sufferScore: 160 },
    { weekStart: "2026-02-02T00:00:00.000Z", weekLabel: "Feb 2", distance: 40.0, duration: 5.0, elevation: 320, activities: 5, sufferScore: 260 },
    { weekStart: "2026-02-09T00:00:00.000Z", weekLabel: "Feb 9", distance: 38.0, duration: 4.8, elevation: 300, activities: 4, sufferScore: 234 },
    { weekStart: "2026-02-16T00:00:00.000Z", weekLabel: "This Week", distance: 42.5, duration: 5.2, elevation: 350, activities: 4, sufferScore: 340 },
  ],
};
