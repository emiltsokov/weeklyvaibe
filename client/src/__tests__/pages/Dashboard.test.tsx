import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks";
import { renderWithProviders } from "../helpers";
import { Dashboard } from "../../pages/Dashboard";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("Dashboard", () => {
  it("renders the AppHeader with brand name", async () => {
    renderWithProviders(React.createElement(Dashboard));
    expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
  });

  it("shows This Week heading after data loads", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("This Week")).toBeInTheDocument();
    });
  });

  it("shows stat cards with values", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getAllByText("Distance").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Duration").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Elevation")).toBeInTheDocument();
      expect(screen.getAllByText("Activities").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows week date range", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      const dateElements = screen.getAllByText(/2026/);
      expect(dateElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows Recovery Status section", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Recovery Status")).toBeInTheDocument();
    });
  });

  it("shows ready to train status", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("🟢 Ready to Train")).toBeInTheDocument();
    });
  });

  it("shows last activity info in recovery", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(
        screen.getByText(/Last Activity: Morning Run/),
      ).toBeInTheDocument();
    });
  });

  it("shows high intensity percentage", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  it("shows Training Balance section", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Training Balance")).toBeInTheDocument();
    });
  });

  it("shows weekly TSS value", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("250")).toBeInTheDocument();
    });
  });

  it("shows balance badges", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("📈 Building")).toBeInTheDocument();
      expect(screen.getByText("Optimal")).toBeInTheDocument();
    });
  });

  it("shows AI Coach section", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("AI Coach")).toBeInTheDocument();
    });
  });

  it("shows feedback message", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(
        screen.getByText(
          "Great job this week! Keep pushing but remember to rest.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows goal widget with progress", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("🎯 Weekly Goal")).toBeInTheDocument();
    });
  });

  it("shows goal progress bar text", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(
        screen.getByText(/5\.2 \/ 7 hrs \(74%\)/),
      ).toBeInTheDocument();
    });
  });

  it("shows Recent Activities section", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Recent Activities")).toBeInTheDocument();
    });
  });

  it("shows activity names in table", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Easy Ride")).toBeInTheDocument();
    });
  });

  it("shows all-time stats", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Total Activities")).toBeInTheDocument();
      expect(screen.getByText("Total Distance")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
    });
  });

  it("shows Total Suffer Score", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText("Total Suffer Score")).toBeInTheDocument();
      expect(screen.getByText("340")).toBeInTheDocument();
    });
  });

  it("shows sync button in header", () => {
    renderWithProviders(React.createElement(Dashboard));
    expect(screen.getByLabelText("Sync activities")).toBeInTheDocument();
  });

  it("shows percentage change with arrow", async () => {
    renderWithProviders(React.createElement(Dashboard));
    await waitFor(() => {
      expect(screen.getByText(/11\.8% vs last week/)).toBeInTheDocument();
    });
  });

  describe("when no goal is set", () => {
    it("shows Set a Weekly Goal prompt", async () => {
      worker.use(
        http.get("/api/goals/current", () =>
          HttpResponse.json({ hasGoal: false }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("Set a Weekly Goal")).toBeInTheDocument();
      });
    });
  });

  describe("recovery widget states", () => {
    it("shows light day status", async () => {
      worker.use(
        http.get("/api/recovery", () =>
          HttpResponse.json({
            status: "light",
            message: "Easy day",
            lastActivity: null,
            zoneDistribution: null,
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("🟡 Light Day")).toBeInTheDocument();
      });
    });

    it("shows rest day status", async () => {
      worker.use(
        http.get("/api/recovery", () =>
          HttpResponse.json({
            status: "rest",
            message: "Rest today",
            lastActivity: null,
            zoneDistribution: null,
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("🔴 Rest Day")).toBeInTheDocument();
      });
    });

    it("shows no recent activities when lastActivity is null", async () => {
      worker.use(
        http.get("/api/recovery", () =>
          HttpResponse.json({
            status: "ready",
            message: "Ready",
            lastActivity: null,
            zoneDistribution: null,
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(
          screen.getByText("No recent activities found"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("balance widget states", () => {
    it("shows exhausted fatigue level", async () => {
      worker.use(
        http.get("/api/balance", () =>
          HttpResponse.json({
            weeklyTSS: 500,
            ctl: 30,
            atl: 90,
            tsb: -60,
            fatigueLevel: "exhausted",
            fatigueColor: "red",
            trend: "recovering",
            activitiesCount: 8,
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("Exhausted")).toBeInTheDocument();
        expect(screen.getByText("📉 Recovering")).toBeInTheDocument();
      });
    });
  });

  describe("AI Coach widget states", () => {
    it("shows warning feedback type", async () => {
      worker.use(
        http.get("/api/feedback", () =>
          HttpResponse.json({
            message: "Watch your volume!",
            type: "warning",
            cachedAt: "2026-02-20T10:00:00.000Z",
            expiresAt: "2026-02-20T16:00:00.000Z",
            canRefresh: false,
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("Watch your volume!")).toBeInTheDocument();
      });
    });
  });

  describe("goal widget with burnout", () => {
    it("shows burnout risk badge", async () => {
      worker.use(
        http.get("/api/goals/current", () =>
          HttpResponse.json({
            hasGoal: true,
            goal: {
              id: "g1",
              type: "duration",
              target: 10,
              unit: "hrs",
              activityFilter: "all",
              weekStart: "2026-02-16T00:00:00.000Z",
              progress: 9,
              status: "overachieving",
              percentComplete: 90,
              message: "You're crushing it!",
            },
            burnout: {
              warning: true,
              message: "3 hard weeks in a row",
              consecutiveWeeks: 3,
            },
          }),
        ),
      );
      renderWithProviders(React.createElement(Dashboard));
      await waitFor(() => {
        expect(screen.getByText("⚠️ Burnout Risk")).toBeInTheDocument();
      });
    });
  });

  describe("sync functionality", () => {
    it("shows success toast on sync", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(Dashboard));
      const syncBtn = screen.getByLabelText("Sync activities");
      await user.click(syncBtn);
      await waitFor(() => {
        expect(screen.getByText("Sync complete")).toBeInTheDocument();
      });
    });

    it("shows error toast on sync failure", async () => {
      worker.use(
        http.post("/api/sync", () =>
          HttpResponse.json(
            { message: "Sync failed" },
            { status: 500 },
          ),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(React.createElement(Dashboard));
      const syncBtn = screen.getByLabelText("Sync activities");
      await user.click(syncBtn);
      await waitFor(() => {
        expect(screen.getByText("Sync failed")).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("shows skeleton loaders while data is loading", () => {
      worker.use(
        http.get("/api/dashboard", () => {
          return new Promise(() => {
            // Never resolves
          });
        }),
      );
      renderWithProviders(React.createElement(Dashboard));
      // Skeletons should be visible when data is loading
      const skeletons = document.querySelectorAll(".chakra-skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
