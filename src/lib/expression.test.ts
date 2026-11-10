import { describe, expect, it } from "vitest";
import {
  areExpressionsEquivalent,
  evaluateExpression,
  parseExpression,
  stripLeadingY,
} from "./expression";

describe("expression parser", () => {
  it("parses numbers, variables and implicit multiplication", () => {
    expect(evaluateExpression(parseExpression("3")!, 5)).toBe(3);
    expect(evaluateExpression(parseExpression("x")!, 5)).toBe(5);
    expect(evaluateExpression(parseExpression("2x")!, 3)).toBe(6);
    expect(evaluateExpression(parseExpression("3(x+1)")!, 2)).toBe(9);
    expect(evaluateExpression(parseExpression("x(x-2)")!, 5)).toBe(15);
    expect(evaluateExpression(parseExpression("(x+1)(x-1)")!, 4)).toBe(15);
  });

  it("handles precedence, unary minus and powers", () => {
    expect(evaluateExpression(parseExpression("2+3*4")!, 0)).toBe(14);
    expect(evaluateExpression(parseExpression("-x+1")!, 2)).toBe(-1);
    expect(evaluateExpression(parseExpression("2x^2")!, 3)).toBe(18);
    expect(evaluateExpression(parseExpression("-3^2")!, 0)).toBe(-9);
    expect(evaluateExpression(parseExpression("2×(x＋1)")!, 1)).toBe(4);
  });

  it("rejects malformed input", () => {
    expect(parseExpression("")).toBeNull();
    expect(parseExpression("2+")).toBeNull();
    expect(parseExpression("(x+1")).toBeNull();
    expect(parseExpression("x+y")).toBeNull();
    expect(parseExpression("sin(x)")).toBeNull();
  });

  it("strips leading y =", () => {
    expect(stripLeadingY("y=2x+1")).toBe("2x+1");
    expect(stripLeadingY("y = x^2")).toBe("x^2");
    expect(stripLeadingY("2x+1")).toBe("2x+1");
  });
});

describe("expression equivalence", () => {
  it("recognizes algebraically equivalent forms", () => {
    expect(areExpressionsEquivalent("2x+3x", "5x")).toBe(true);
    expect(areExpressionsEquivalent("(x+1)^2", "x^2+2x+1")).toBe(true);
    expect(areExpressionsEquivalent("(x+1)(x-1)", "x^2-1")).toBe(true);
    expect(areExpressionsEquivalent("x/2", "0.5x")).toBe(true);
    expect(areExpressionsEquivalent("y=2(x+3)", "2x+6")).toBe(true);
    expect(areExpressionsEquivalent("-x+x+4", "4")).toBe(true);
  });

  it("rejects non-equivalent expressions", () => {
    expect(areExpressionsEquivalent("2x+3x", "6x")).toBe(false);
    expect(areExpressionsEquivalent("(x+1)^2", "x^2+1")).toBe(false);
    expect(areExpressionsEquivalent("x^2", "x^3")).toBe(false);
  });

  it("returns null for unparseable input instead of guessing", () => {
    expect(areExpressionsEquivalent("good job", "5x")).toBeNull();
    expect(areExpressionsEquivalent("5x", "")).toBeNull();
  });
});
