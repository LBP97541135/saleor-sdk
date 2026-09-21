import {
  BUDGET_GUARD_CONTRACT_VERSION,
  BUDGET_GUARD_REASON_CODE,
  BUDGET_GUARD_STATUS,
  BudgetGuardBudget,
  evaluateBudgetGuard,
} from "../src/core";

const budget = (
  limitAmount: number,
  spentAmount: number,
  enabled?: boolean
): BudgetGuardBudget => ({
  limitAmount,
  spentAmount,
  windowStart: "2026-01-01T00:00:00.000Z",
  windowEnd: "2026-12-31T23:59:59.000Z",
  enabled,
});

describe("evaluateBudgetGuard", () => {
  it("exposes contract v0 constants", () => {
    expect(BUDGET_GUARD_CONTRACT_VERSION).toBe("v0");
    expect(BUDGET_GUARD_STATUS).toEqual({
      NOT_CONFIGURED: "NOT_CONFIGURED",
      ALLOWED: "ALLOWED",
      CAPPED: "CAPPED",
      EXHAUSTED: "EXHAUSTED",
    });
    expect(BUDGET_GUARD_REASON_CODE).toEqual({
      NO_BUDGET_CONFIGURED: "NO_BUDGET_CONFIGURED",
      BUDGET_DISABLED: "BUDGET_DISABLED",
      BUDGET_AVAILABLE: "BUDGET_AVAILABLE",
      BUDGET_PARTIALLY_EXHAUSTED: "BUDGET_PARTIALLY_EXHAUSTED",
      BUDGET_EXHAUSTED: "BUDGET_EXHAUSTED",
    });
  });

  it("returns NOT_CONFIGURED when there is no budget configuration", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 12.5,
        currency: "USD",
      })
    ).toEqual({
      guardStatus: "NOT_CONFIGURED",
      guardReasonCode: "NO_BUDGET_CONFIGURED",
      requestedDiscountAmount: 12.5,
      appliedDiscountAmount: 12.5,
      remainingBudgetAmount: 0,
    });
  });

  it("returns NOT_CONFIGURED when the budget is disabled", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 12.5,
        currency: "USD",
        budget: budget(100, 30, false),
      })
    ).toEqual({
      guardStatus: "NOT_CONFIGURED",
      guardReasonCode: "BUDGET_DISABLED",
      requestedDiscountAmount: 12.5,
      appliedDiscountAmount: 12.5,
      remainingBudgetAmount: 70,
    });
  });

  it("allows the full request when the remaining budget covers it", () => {
    const result = evaluateBudgetGuard({
      requestedDiscountAmount: 50,
      currency: "USD",
      budget: budget(100, 30, true),
    });

    expect(result).toEqual({
      guardStatus: "ALLOWED",
      guardReasonCode: "BUDGET_AVAILABLE",
      requestedDiscountAmount: 50,
      appliedDiscountAmount: 50,
      remainingBudgetAmount: 70,
    });
    expect(result.guardStatus).toBe(BUDGET_GUARD_STATUS.ALLOWED);
  });

  it("caps the discount to the remaining budget", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 80,
        currency: "USD",
        budget: budget(100, 30, true),
      })
    ).toEqual({
      guardStatus: "CAPPED",
      guardReasonCode: "BUDGET_PARTIALLY_EXHAUSTED",
      requestedDiscountAmount: 80,
      appliedDiscountAmount: 70,
      remainingBudgetAmount: 70,
    });
  });

  it("exhausts the discount when nothing is left", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 8,
        currency: "USD",
        budget: budget(100, 100, true),
      })
    ).toEqual({
      guardStatus: "EXHAUSTED",
      guardReasonCode: "BUDGET_EXHAUSTED",
      requestedDiscountAmount: 8,
      appliedDiscountAmount: 0,
      remainingBudgetAmount: 0,
    });
  });

  it("clamps a negative remaining budget to zero", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 8,
        currency: "USD",
        budget: budget(100, 130, true),
      })
    ).toEqual({
      guardStatus: "EXHAUSTED",
      guardReasonCode: "BUDGET_EXHAUSTED",
      requestedDiscountAmount: 8,
      appliedDiscountAmount: 0,
      remainingBudgetAmount: 0,
    });
  });

  it("uses integer minor units instead of native float arithmetic", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 0.15,
        currency: "USD",
        budget: budget(0.3, 0.2, true),
      })
    ).toEqual({
      guardStatus: "CAPPED",
      guardReasonCode: "BUDGET_PARTIALLY_EXHAUSTED",
      requestedDiscountAmount: 0.15,
      appliedDiscountAmount: 0.1,
      remainingBudgetAmount: 0.1,
    });
  });

  it("respects currencies without a 1/100 minor unit", () => {
    expect(
      evaluateBudgetGuard({
        requestedDiscountAmount: 600,
        currency: "JPY",
        budget: budget(1000, 400, true),
      })
    ).toEqual({
      guardStatus: "ALLOWED",
      guardReasonCode: "BUDGET_AVAILABLE",
      requestedDiscountAmount: 600,
      appliedDiscountAmount: 600,
      remainingBudgetAmount: 600,
    });
  });
});
