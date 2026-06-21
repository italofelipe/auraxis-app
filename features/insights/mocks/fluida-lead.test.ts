import { INSIGHT_DIMENSION_ORDER } from "@/features/insights/hooks/use-insights-by-dimension";
import { INSIGHT_CADENCE_ORDER } from "@/features/insights/fluida/contracts";
import {
  fluidaLeadFixture,
  selectFluidaLead,
} from "@/features/insights/mocks/fluida-lead";

describe("fluida lead mock fixture", () => {
  it("provides a lead VM for every dimension × cadence combination", () => {
    INSIGHT_DIMENSION_ORDER.forEach((dimension) => {
      INSIGHT_CADENCE_ORDER.forEach((cadence) => {
        const lead = selectFluidaLead({ dimension, cadence });

        expect(lead.dimension).toBe(dimension);
        expect(lead.cadence).toBe(cadence);
        expect(lead.title.length).toBeGreaterThan(0);
        expect(lead.lead.length).toBeGreaterThan(0);
        expect(lead.readMinutes).toBeGreaterThan(0);
        expect(["ok", "attention", "alert"]).toContain(lead.severity);
      });
    });
  });

  it("returns the exact fixture entry for a known key (general · daily)", () => {
    const lead = selectFluidaLead({ dimension: "general", cadence: "daily" });

    expect(lead).toBe(fluidaLeadFixture.general.daily);
    expect(lead.severity).toBe("attention");
  });

  it("uses the longer reading time for the weekly cadence than the daily one", () => {
    const daily = selectFluidaLead({ dimension: "general", cadence: "daily" });
    const weekly = selectFluidaLead({ dimension: "general", cadence: "weekly" });

    expect(weekly.readMinutes).toBeGreaterThan(daily.readMinutes);
  });
});
