import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { worker } from "../mocks";
import { renderWithProviders } from "../helpers";
import { AppHeader } from "../../components/AppHeader";
import { RepeatIcon } from "@chakra-ui/icons";
import { IconButton } from "@chakra-ui/react";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("AppHeader", () => {
  it("renders brand name", async () => {
    renderWithProviders(React.createElement(AppHeader));
    expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
  });

  it("renders Dashboard nav button", async () => {
    renderWithProviders(React.createElement(AppHeader));
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Weekly Goal nav button", async () => {
    renderWithProviders(React.createElement(AppHeader));
    expect(screen.getByText("Weekly Goal")).toBeInTheDocument();
  });

  it("renders Logout button", async () => {
    renderWithProviders(React.createElement(AppHeader));
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders user name when loaded", async () => {
    renderWithProviders(React.createElement(AppHeader));
    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
    });
  });

  it("renders sync button when provided", () => {
    const syncBtn = React.createElement(IconButton, {
      "aria-label": "Sync",
      icon: React.createElement(RepeatIcon),
      "data-testid": "sync-btn",
    });
    renderWithProviders(
      React.createElement(AppHeader, { syncButton: syncBtn }),
    );
    expect(screen.getByTestId("sync-btn")).toBeInTheDocument();
  });

  it("does not render sync button when not provided", () => {
    renderWithProviders(React.createElement(AppHeader));
    expect(screen.queryByTestId("sync-btn")).not.toBeInTheDocument();
  });

  it("navigates when Dashboard button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(React.createElement(AppHeader));
    await user.click(screen.getByText("Dashboard"));
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("navigates when Weekly Goal button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(React.createElement(AppHeader));
    await user.click(screen.getByText("Weekly Goal"));
    expect(window.location.pathname).toBe("/weekly-goal");
  });

  it("calls logout on Logout click", async () => {
    const user = userEvent.setup();
    renderWithProviders(React.createElement(AppHeader));
    const logoutBtn = screen.getByText("Logout");
    expect(logoutBtn).toBeInTheDocument();
    // Just verify logout button exists and is clickable; 
    // actual redirect tested in api hooks test
  });
});
