import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_SETTINGS,
  daysUntilDate,
  getSprintStatus,
  normalizeAppSettings,
} from "./app-settings";

describe("app settings normalization", () => {
  it("keeps valid settings and drops garbage", () => {
    expect(
      normalizeAppSettings({ examDate: "2027-06-17", theme: "dark" })
    ).toEqual({ examDate: "2027-06-17", theme: "dark" });

    expect(normalizeAppSettings({ examDate: "next friday", theme: "neon" })).toEqual(
      DEFAULT_APP_SETTINGS
    );
    expect(normalizeAppSettings(null)).toEqual(DEFAULT_APP_SETTINGS);
    expect(normalizeAppSettings(42)).toEqual(DEFAULT_APP_SETTINGS);
  });
});

describe("sprint phase", () => {
  const examDate = "2027-06-17";

  it("counts whole days until the exam date", () => {
    expect(daysUntilDate(examDate, new Date("2027-06-17T23:00:00"))).toBe(0);
    expect(daysUntilDate(examDate, new Date("2027-06-16T08:00:00"))).toBe(1);
    expect(daysUntilDate(examDate, new Date("2027-06-18T08:00:00"))).toBe(-1);
  });

  it("maps days left onto sprint phases", () => {
    expect(
      getSprintStatus({ examDate, theme: "auto" }, new Date("2027-01-01T08:00:00")).phase
    ).toBe("foundation");
    expect(
      getSprintStatus({ examDate, theme: "auto" }, new Date("2027-04-20T08:00:00")).phase
    ).toBe("specialized");
    expect(
      getSprintStatus({ examDate, theme: "auto" }, new Date("2027-06-01T08:00:00")).phase
    ).toBe("sprint");
    expect(
      getSprintStatus({ examDate, theme: "auto" }, new Date("2027-07-01T08:00:00")).phase
    ).toBe("final");
  });

  it("falls back to the default exam date when none is set", () => {
    const status = getSprintStatus(DEFAULT_APP_SETTINGS);
    expect(status.examDate).toBeNull();
    expect(status.daysLeft).toBeGreaterThanOrEqual(0);
  });
});
