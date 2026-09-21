import {
  BUDGET_GUARD_CURRENCY_DECIMALS,
  BUDGET_GUARD_DEFAULT_CURRENCY_DECIMALS,
  BUDGET_GUARD_FIELD,
  BUDGET_GUARD_REASON_CODE,
  BUDGET_GUARD_STATUS,
  BudgetGuardReasonCode,
  BudgetGuardStatus,
  EvaluateBudgetGuardInput,
  EvaluateBudgetGuardResult,
} from "./contract";

const getCurrencyDecimals = (currency: string): number =>
  BUDGET_GUARD_CURRENCY_DECIMALS[(currency || "").toUpperCase()] ??
  BUDGET_GUARD_DEFAULT_CURRENCY_DECIMALS;

/**
 * Budget Guard amounts are never added or subtracted as native floats: every
 * computation runs on integer minor units (derived from the currency exponent)
 * and only the final result is converted back to major units.
 */
const toMinorUnits = (amount: number, decimals: number): number =>
  Math.round(amount * 10 ** decimals);

const fromMinorUnits = (amount: number, decimals: number): number =>
  Number((amount / 10 ** decimals).toFixed(decimals));

export const evaluateBudgetGuard = (
  input: EvaluateBudgetGuardInput
): EvaluateBudgetGuardResult => {
  const { requestedDiscountAmount, currency, budget } = input;
  const decimals = getCurrencyDecimals(currency);
  const requestedDiscountMinor = toMinorUnits(
    requestedDiscountAmount,
    decimals
  );

  const buildResult = (
    guardStatus: BudgetGuardStatus,
    guardReasonCode: BudgetGuardReasonCode,
    appliedDiscountMajor: number,
    remainingBudgetMajor: number
  ): EvaluateBudgetGuardResult => ({
    [BUDGET_GUARD_FIELD.GUARD_STATUS]: guardStatus,
    [BUDGET_GUARD_FIELD.GUARD_REASON_CODE]: guardReasonCode,
    [BUDGET_GUARD_FIELD.REQUESTED_DISCOUNT_AMOUNT]: requestedDiscountAmount,
    [BUDGET_GUARD_FIELD.APPLIED_DISCOUNT_AMOUNT]: appliedDiscountMajor,
    [BUDGET_GUARD_FIELD.REMAINING_BUDGET_AMOUNT]: remainingBudgetMajor,
  });

  if (!budget) {
    return buildResult(
      BUDGET_GUARD_STATUS.NOT_CONFIGURED,
      BUDGET_GUARD_REASON_CODE.NO_BUDGET_CONFIGURED,
      requestedDiscountAmount,
      0
    );
  }

  const limitMinor = toMinorUnits(budget.limitAmount, decimals);
  const spentMinor = toMinorUnits(budget.spentAmount, decimals);
  const remainingBudgetMinor = Math.max(limitMinor - spentMinor, 0);
  const remainingBudgetMajor = fromMinorUnits(remainingBudgetMinor, decimals);

  if (budget.enabled === false) {
    return buildResult(
      BUDGET_GUARD_STATUS.NOT_CONFIGURED,
      BUDGET_GUARD_REASON_CODE.BUDGET_DISABLED,
      requestedDiscountAmount,
      remainingBudgetMajor
    );
  }

  if (remainingBudgetMinor >= requestedDiscountMinor) {
    return buildResult(
      BUDGET_GUARD_STATUS.ALLOWED,
      BUDGET_GUARD_REASON_CODE.BUDGET_AVAILABLE,
      requestedDiscountAmount,
      remainingBudgetMajor
    );
  }

  if (remainingBudgetMinor > 0) {
    return buildResult(
      BUDGET_GUARD_STATUS.CAPPED,
      BUDGET_GUARD_REASON_CODE.BUDGET_PARTIALLY_EXHAUSTED,
      remainingBudgetMajor,
      remainingBudgetMajor
    );
  }

  return buildResult(
    BUDGET_GUARD_STATUS.EXHAUSTED,
    BUDGET_GUARD_REASON_CODE.BUDGET_EXHAUSTED,
    0,
    remainingBudgetMajor
  );
};
