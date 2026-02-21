import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import React from "react";
import { http, HttpResponse } from "msw";
import { worker, handlers } from "../mocks";
import { renderWithProviders, mockGoalCurrent } from "../helpers";
import { Login } from "../../pages/Login";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("Login", () => {
  it("renders Weekly Vaibe heading", () => {
    renderWithProviders(React.createElement(Login));
    expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
  });

  it("renders Smart Training Tracker subtitle", () => {
    renderWithProviders(React.createElement(Login));
    expect(screen.getByText("Smart Training Tracker")).toBeInTheDocument();
  });

  it("renders Connect with Strava button", () => {
    renderWithProviders(React.createElement(Login));
    expect(screen.getByText("Connect with Strava")).toBeInTheDocument();
  });

  it("renders Strava link with correct href", () => {
    renderWithProviders(React.createElement(Login));
    const link = screen.getByText("Connect with Strava");
    expect(link.closest("a")).toHaveAttribute("href", "/auth/strava");
  });

  it("renders feature list", () => {
    renderWithProviders(React.createElement(Login));
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(
      screen.getByText("📊 Weekly training summaries"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("📈 Week-over-week comparisons"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("💪 Stress and recovery tracking"),
    ).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderWithProviders(React.createElement(Login));
    expect(
      screen.getByText(/Connect your Strava account/),
    ).toBeInTheDocument();
  });

  it("does not show error by default", () => {
    renderWithProviders(React.createElement(Login));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows auth_denied error from URL", () => {
    window.history.pushState({}, "", "/login?error=auth_denied");
    renderWithProviders(React.createElement(Login));
    expect(
      screen.getByText("Authorization was denied. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows no_code error from URL", () => {
    window.history.pushState({}, "", "/login?error=no_code");
    renderWithProviders(React.createElement(Login));
    expect(
      screen.getByText("No authorization code received."),
    ).toBeInTheDocument();
  });

  it("shows token_exchange error from URL", () => {
    window.history.pushState({}, "", "/login?error=token_exchange");
    renderWithProviders(React.createElement(Login));
    expect(
      screen.getByText("Failed to connect with Strava. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows generic error for unknown error param", () => {
    window.history.pushState({}, "", "/login?error=unknown_err");
    renderWithProviders(React.createElement(Login));
    expect(
      screen.getByText("An error occurred. Please try again."),
    ).toBeInTheDocument();
  });
});
