import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks";
import { renderWithProviders } from "../helpers";
import { WeeklyGoal } from "../../pages/WeeklyGoal";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("WeeklyGoal", () => {
  it("renders the AppHeader", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
  });

  it("renders Set Weekly Goal form", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    expect(screen.getByText("Set Weekly Goal")).toBeInTheDocument();
  });

  it("renders goal type select", () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    expect(screen.getByText("Goal Type")).toBeInTheDocument();
  });

  it("renders activity type select", () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    expect(screen.getByText("Activity Type")).toBeInTheDocument();
  });

  it("renders Set Goal button", () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    expect(screen.getByText("Set Goal")).toBeInTheDocument();
  });

  it("shows goal tracker with progress when goal exists", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(
        screen.getByText("Weekly Goal Progress"),
      ).toBeInTheDocument();
    });
  });

  it("shows goal status badge", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("✨ On Track")).toBeInTheDocument();
    });
  });

  it("shows progress percentage", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("74%")).toBeInTheDocument();
    });
  });

  it("shows current and target values", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("5.2")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  it("shows goal message", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(
        screen.getByText("Keep it up! You're on pace."),
      ).toBeInTheDocument();
    });
  });

  it("shows goal history table", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("Goal History")).toBeInTheDocument();
    });
  });

  it("shows history rows", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("108%")).toBeInTheDocument();
      expect(screen.getByText("70%")).toBeInTheDocument();
    });
  });

  it("shows completed badge for completed goals", async () => {
    renderWithProviders(React.createElement(WeeklyGoal));
    await waitFor(() => {
      expect(screen.getByText("✓")).toBeInTheDocument();
    });
  });

  describe("when no goal is set", () => {
    it("shows no goal message in tracker", async () => {
      worker.use(
        http.get("/api/goals/current", () =>
          HttpResponse.json({ hasGoal: false }),
        ),
      );
      renderWithProviders(React.createElement(WeeklyGoal));
      await waitFor(() => {
        expect(
          screen.getByText(/No goal set for this week/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("when no history exists", () => {
    it("shows no history message", async () => {
      worker.use(
        http.get("/api/goals/history", () =>
          HttpResponse.json({ history: [] }),
        ),
      );
      renderWithProviders(React.createElement(WeeklyGoal));
      await waitFor(() => {
        expect(screen.getByText("No goal history yet")).toBeInTheDocument();
      });
    });
  });

  describe("goal form submission", () => {
    it("submits the goal form", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(WeeklyGoal));

      const submitBtn = screen.getByText("Set Goal");
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Set Weekly Goal")).toBeInTheDocument();
      });
    });

    it("handles form submission error", async () => {
      worker.use(
        http.post("/api/goals", () =>
          HttpResponse.json(
            { message: "Failed" },
            { status: 500 },
          ),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(React.createElement(WeeklyGoal));

      const submitBtn = screen.getByText("Set Goal");
      await user.click(submitBtn);

      await waitFor(() => {
        // Form should still be visible after error
        expect(screen.getByText("Set Weekly Goal")).toBeInTheDocument();
      });
    });
  });

  describe("form interactions", () => {
    it("changes goal type to distance", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(WeeklyGoal));

      const typeSelect = screen.getByLabelText("Goal Type");
      await user.selectOptions(typeSelect, "distance");
      expect(typeSelect).toHaveValue("distance");
      expect(screen.getByText("Target (km)")).toBeInTheDocument();
    });

    it("changes activity filter", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(WeeklyGoal));

      const filterSelect = screen.getByLabelText("Activity Type");
      await user.selectOptions(filterSelect, "run");
      expect(filterSelect).toHaveValue("run");
    });

    it("changes target value", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(WeeklyGoal));

      const targetInput = screen.getByLabelText(/Target/);
      await user.clear(targetInput);
      await user.type(targetInput, "10");
      expect(targetInput).toHaveValue("10");
    });
  });

  describe("overachieving status", () => {
    it("shows crushing it badge", async () => {
      worker.use(
        http.get("/api/goals/current", () =>
          HttpResponse.json({
            hasGoal: true,
            goal: {
              id: "g1",
              type: "duration",
              target: 5,
              unit: "hrs",
              activityFilter: "all",
              weekStart: "2026-02-16T00:00:00.000Z",
              progress: 8,
              status: "overachieving",
              percentComplete: 160,
              message: "Over target!",
            },
            burnout: { warning: false },
          }),
        ),
      );
      renderWithProviders(React.createElement(WeeklyGoal));
      await waitFor(() => {
        expect(screen.getByText(/Crushing It/)).toBeInTheDocument();
      });
    });
  });

  describe("with burnout warning", () => {
    it("shows burnout alert", async () => {
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
              progress: 11,
              status: "overachieving",
              percentComplete: 110,
              message: "You're way over target!",
            },
            burnout: {
              warning: true,
              message: "Consider a recovery week.",
              consecutiveWeeks: 3,
            },
          }),
        ),
      );
      renderWithProviders(React.createElement(WeeklyGoal));
      await waitFor(() => {
        expect(screen.getByText("Burnout Warning!")).toBeInTheDocument();
        expect(
          screen.getByText("Consider a recovery week."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("goal with behind status", () => {
    it("shows behind badge", async () => {
      worker.use(
        http.get("/api/goals/current", () =>
          HttpResponse.json({
            hasGoal: true,
            goal: {
              id: "g1",
              type: "distance",
              target: 50,
              unit: "km",
              activityFilter: "run",
              weekStart: "2026-02-16T00:00:00.000Z",
              progress: 15,
              status: "behind",
              percentComplete: 30,
              message: "Pick up the pace!",
            },
            burnout: { warning: false },
          }),
        ),
      );
      renderWithProviders(React.createElement(WeeklyGoal));
      await waitFor(
        () => {
          expect(screen.getByText(/Behind/)).toBeInTheDocument();
          expect(screen.getByText("Pick up the pace!")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });
});
