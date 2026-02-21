import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks";
import {
  mockUser,
  mockDashboard,
  mockRecovery,
  mockBalance,
  mockFeedback,
  mockGoalCurrent,
  mockGoalHistory,
} from "../helpers";
import {
  useAuth,
  useDashboard,
  useActivities,
  useSyncMutation,
  useRecovery,
  useBalance,
  useFeedback,
  useRefreshFeedback,
  useLogout,
  useCurrentGoal,
  useGoalHistory,
  useSetGoal,
} from "../../lib/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, children),
    );
  };
}

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("API hooks", () => {
  describe("useAuth", () => {
    it("returns user data on success", async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockUser);
    });

    it("handles 401 error", async () => {
      worker.use(
        http.get("/auth/me", () => HttpResponse.json({}, { status: 401 })),
      );
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });

  describe("useDashboard", () => {
    it("returns dashboard data", async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockDashboard);
    });
  });

  describe("useActivities", () => {
    it("returns activities with default params", async () => {
      const { result } = renderHook(() => useActivities(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.activities).toHaveLength(2);
    });

    it("passes limit and skip params", async () => {
      const { result } = renderHook(() => useActivities(10, 5), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("useSyncMutation", () => {
    it("syncs activities and invalidates queries", async () => {
      const { result } = renderHook(() => useSyncMutation(), {
        wrapper: createWrapper(),
      });
      result.current.mutate(30);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.synced).toBe(3);
    });

    it("syncs without days param", async () => {
      const { result } = renderHook(() => useSyncMutation(), {
        wrapper: createWrapper(),
      });
      result.current.mutate(undefined);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("useRecovery", () => {
    it("returns recovery data", async () => {
      const { result } = renderHook(() => useRecovery(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.status).toBe("ready");
    });
  });

  describe("useBalance", () => {
    it("returns balance data", async () => {
      const { result } = renderHook(() => useBalance(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.weeklyTSS).toBe(250);
    });
  });

  describe("useFeedback", () => {
    it("returns feedback data", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.type).toBe("motivation");
    });
  });

  describe("useRefreshFeedback", () => {
    it("refreshes feedback", async () => {
      const { result } = renderHook(() => useRefreshFeedback(), {
        wrapper: createWrapper(),
      });
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("useLogout", () => {
    it("returns a mutation function", () => {
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });
      expect(result.current.mutate).toBeDefined();
      expect(typeof result.current.mutate).toBe("function");
      expect(result.current.isPending).toBe(false);
    });
  });

  describe("useCurrentGoal", () => {
    it("returns current goal", async () => {
      const { result } = renderHook(() => useCurrentGoal(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.hasGoal).toBe(true);
      expect(result.current.data?.goal?.target).toBe(7);
    });
  });

  describe("useGoalHistory", () => {
    it("returns goal history with default weeks", async () => {
      const { result } = renderHook(() => useGoalHistory(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.history).toHaveLength(2);
    });

    it("accepts custom weeks param", async () => {
      const { result } = renderHook(() => useGoalHistory(4), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("useSetGoal", () => {
    it("sets a new goal", async () => {
      const { result } = renderHook(() => useSetGoal(), {
        wrapper: createWrapper(),
      });
      result.current.mutate({
        type: "duration",
        target: 8,
        activityFilter: "all",
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.success).toBe(true);
    });
  });

  describe("fetchApi error handling", () => {
    it("throws with server error message", async () => {
      worker.use(
        http.get("/api/dashboard", () =>
          HttpResponse.json({ message: "Server error" }, { status: 500 }),
        ),
      );
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Server error");
    });

    it("falls back to default error message", async () => {
      worker.use(
        http.get(
          "/api/dashboard",
          () =>
            new HttpResponse("not json", {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            }),
        ),
      );
      const { result } = renderHook(() => useDashboard(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("API request failed");
    });
  });
});
