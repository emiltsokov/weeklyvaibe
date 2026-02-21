import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import React from "react";
import { http, HttpResponse } from "msw";
import { worker } from "../mocks";
import { renderWithProviders } from "../helpers";
import App from "../../App";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("App routing", () => {
  it("redirects / to /dashboard", async () => {
    window.history.pushState({}, "", "/");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("shows dashboard when authenticated", async () => {
    window.history.pushState({}, "", "/dashboard");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
    });
  });

  it("shows login page at /login", async () => {
    window.history.pushState({}, "", "/login");
    renderWithProviders(React.createElement(App));
    expect(screen.getByText("Connect with Strava")).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated for /dashboard", async () => {
    worker.use(
      http.get("/auth/me", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );
    window.history.pushState({}, "", "/dashboard");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
  });

  it("redirects to login when unauthenticated for /weekly-goal", async () => {
    worker.use(
      http.get("/auth/me", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );
    window.history.pushState({}, "", "/weekly-goal");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(window.location.pathname).toBe("/login");
    });
  });

  it("shows weekly goal page when authenticated", async () => {
    window.history.pushState({}, "", "/weekly-goal");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(screen.getByText("Set Weekly Goal")).toBeInTheDocument();
    });
  });

  it("shows vocabulary page when authenticated", async () => {
    window.history.pushState({}, "", "/vocabulary");
    renderWithProviders(React.createElement(App));
    await waitFor(() => {
      expect(
        screen.getByText("📖 Training Vocabulary"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading spinner during auth check", () => {
    worker.use(
      http.get("/auth/me", () => {
        return new Promise(() => {
          // Never resolves - keeps loading
        });
      }),
    );
    window.history.pushState({}, "", "/dashboard");
    renderWithProviders(React.createElement(App));
    expect(document.querySelector(".chakra-spinner")).toBeInTheDocument();
  });
});
