import { INSIGHT_DIMENSION_ORDER } from "@/features/insights/hooks/use-insights-by-dimension";
import { INSIGHT_CADENCE_ORDER } from "@/features/insights/fluida/contracts";
import { selectFluidaLead } from "@/features/insights/mocks/fluida-lead";
import {
  fluidaVMFixture,
  selectFluidaVM,
} from "@/features/insights/mocks/fluida-vm";

describe("fluida full VM mock fixture", () => {
  it("provides a complete VM for every dimension × cadence combination", () => {
    INSIGHT_DIMENSION_ORDER.forEach((dimension) => {
      INSIGHT_CADENCE_ORDER.forEach((cadence) => {
        const vm = selectFluidaVM({ dimension, cadence });

        expect(vm.dimension).toBe(dimension);
        expect(vm.cadence).toBe(cadence);
        expect(vm.paragraphs.length).toBeGreaterThan(0);
        vm.paragraphs.forEach((paragraph) => {
          expect(paragraph.length).toBeGreaterThan(0);
        });
        expect(vm.highlights.length).toBeGreaterThan(0);
        expect(vm.series.daily).toHaveLength(7);
        expect(vm.series.weekly).toHaveLength(6);
      });
    });
  });

  it("extends the etapa-1 lead VM without diverging from it", () => {
    INSIGHT_DIMENSION_ORDER.forEach((dimension) => {
      INSIGHT_CADENCE_ORDER.forEach((cadence) => {
        const vm = selectFluidaVM({ dimension, cadence });
        const lead = selectFluidaLead({ dimension, cadence });

        expect(vm.severity).toBe(lead.severity);
        expect(vm.title).toBe(lead.title);
        expect(vm.lead).toBe(lead.lead);
        expect(vm.readMinutes).toBe(lead.readMinutes);
      });
    });
  });

  it("only carries comparative cards on the general dimension", () => {
    INSIGHT_CADENCE_ORDER.forEach((cadence) => {
      expect(selectFluidaVM({ dimension: "general", cadence }).retro).toHaveLength(3);
    });

    INSIGHT_DIMENSION_ORDER.filter((dimension) => dimension !== "general").forEach(
      (dimension) => {
        INSIGHT_CADENCE_ORDER.forEach((cadence) => {
          expect(selectFluidaVM({ dimension, cadence }).retro).toHaveLength(0);
        });
      },
    );
  });

  it("tags the three general comparative cards with the canonical keys", () => {
    const retro = selectFluidaVM({ dimension: "general", cadence: "daily" }).retro;

    expect(retro.map((item) => item.key)).toEqual([
      "yesterday",
      "daybefore",
      "vs_week",
    ]);
    retro.forEach((item) => {
      expect(["pos", "neg", "neutral"]).toContain(item.sign);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.caption.length).toBeGreaterThan(0);
    });
  });

  it("returns the exact fixture entry for a known key (general · daily)", () => {
    const vm = selectFluidaVM({ dimension: "general", cadence: "daily" });
    expect(vm).toBe(fluidaVMFixture.general.daily);
  });
});
