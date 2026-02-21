import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { worker } from "../mocks";
import { renderWithProviders } from "../helpers";
import { Vocabulary } from "../../pages/Vocabulary";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(async () => {
  worker.stop();
});

describe("Vocabulary", () => {
  it("renders the page heading", () => {
    renderWithProviders(React.createElement(Vocabulary));
    expect(
      screen.getByText("📖 Training Vocabulary"),
    ).toBeInTheDocument();
  });

  it("renders the intro description", () => {
    renderWithProviders(React.createElement(Vocabulary));
    expect(
      screen.getByText(/Understand the key metrics/),
    ).toBeInTheDocument();
  });

  it("renders the AppHeader with brand name", () => {
    renderWithProviders(React.createElement(Vocabulary));
    expect(screen.getByText("Weekly Vaibe")).toBeInTheDocument();
  });

  it("renders the How These Metrics Connect section", () => {
    renderWithProviders(React.createElement(Vocabulary));
    expect(
      screen.getByText("🔗 How These Metrics Connect"),
    ).toBeInTheDocument();
  });

  describe("section anchors", () => {
    it("each term card has an id for deep linking", () => {
      renderWithProviders(React.createElement(Vocabulary));
      const expectedIds = ["tss", "ctl", "atl", "tsb", "suffer-score", "zone-distribution", "recovery-status"];
      for (const id of expectedIds) {
        expect(document.getElementById(id)).toBeInTheDocument();
      }
    });
  });

  describe("term cards", () => {
    it("renders TSS card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Training Stress Score"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("TSS").length).toBeGreaterThanOrEqual(1);
    });

    it("renders CTL card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Chronic Training Load"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("CTL").length).toBeGreaterThanOrEqual(1);
    });

    it("renders ATL card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Acute Training Load"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("ATL").length).toBeGreaterThanOrEqual(1);
    });

    it("renders TSB card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Training Stress Balance"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("TSB").length).toBeGreaterThanOrEqual(1);
    });

    it("renders Suffer Score card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(screen.getAllByText("Suffer Score").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Strava's heart-rate effort metric/),
      ).toBeInTheDocument();
    });

    it("renders HR Zones card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Heart Rate Zone Distribution"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("HR Zones").length).toBeGreaterThanOrEqual(1);
    });

    it("renders Recovery Status card", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getAllByText("Recovery Status").length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText("When can you train hard again?"),
      ).toBeInTheDocument();
    });
  });

  describe("term details", () => {
    it("shows taglines for each term", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("How hard was your workout?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your long-term fitness trend"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Your recent fatigue level"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Are you fresh or fatigued?"),
      ).toBeInTheDocument();
    });

    it("shows descriptions for terms", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(
          /Training Stress Score quantifies the overall training load/,
        ),
      ).toBeInTheDocument();
    });

    it("shows formulas for terms that have them", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(/TSS = \(duration × IF² × 100\) \/ FTP/),
      ).toBeInTheDocument();
    });

    it("shows formula labels", () => {
      renderWithProviders(React.createElement(Vocabulary));
      const formulaLabels = screen.getAllByText("Formula:");
      expect(formulaLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("shows The Science accordion buttons", () => {
      renderWithProviders(React.createElement(Vocabulary));
      const scienceButtons = screen.getAllByText("🔬 The Science");
      expect(scienceButtons.length).toBe(7);
    });

    it("shows example sections for each term", () => {
      renderWithProviders(React.createElement(Vocabulary));
      const examples = screen.getAllByText("💡 Example");
      expect(examples.length).toBe(7);
    });

    it("shows range badges for TSS", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText("Recovery: < 150 / week"),
      ).toBeInTheDocument();
    });
  });

  describe("TSB visual", () => {
    it("renders circular progress indicators for TSB", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(screen.getByText("−30")).toBeInTheDocument();
      expect(screen.getByText("−15")).toBeInTheDocument();
      expect(screen.getByText("+5")).toBeInTheDocument();
      expect(screen.getByText("+30")).toBeInTheDocument();
    });

    it("renders TSB range labels", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(screen.getByText("Overreaching")).toBeInTheDocument();
      expect(screen.getByText("Detraining")).toBeInTheDocument();
    });
  });

  describe("HR Zones visual", () => {
    it("renders zone labels", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(screen.getByText("Z1")).toBeInTheDocument();
      expect(screen.getByText("Z2")).toBeInTheDocument();
      expect(screen.getByText("Z3")).toBeInTheDocument();
      expect(screen.getByText("Z4")).toBeInTheDocument();
      expect(screen.getByText("Z5")).toBeInTheDocument();
    });

    it("renders zone percentages", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(screen.getByText("40%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  describe("science accordion", () => {
    it("expands science section when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(Vocabulary));

      const scienceButtons = screen.getAllByText("🔬 The Science");
      await user.click(scienceButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/Developed by Dr. Andrew Coggan/),
        ).toBeInTheDocument();
      });
    });

    it("expands CTL science section", async () => {
      const user = userEvent.setup();
      renderWithProviders(React.createElement(Vocabulary));

      const scienceButtons = screen.getAllByText("🔬 The Science");
      await user.click(scienceButtons[1]);

      await waitFor(() => {
        expect(
          screen.getByText(/CTL uses an exponentially weighted moving average/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("example content", () => {
    it("shows TSS example", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(/1-hour easy ride might score TSS 40/),
      ).toBeInTheDocument();
    });

    it("shows CTL example", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(/recreational athlete might have a CTL of 30–50/),
      ).toBeInTheDocument();
    });

    it("shows ATL example", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(/After a hard training block your ATL might spike/),
      ).toBeInTheDocument();
    });

    it("shows TSB example", () => {
      renderWithProviders(React.createElement(Vocabulary));
      expect(
        screen.getByText(/During heavy training, TSB might be −20/),
      ).toBeInTheDocument();
    });
  });
});
