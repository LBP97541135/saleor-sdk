/**
 * Budget Guard contract v0 (frozen).
 *
 * Shared vocabulary for the Budget Guard touch point: field names carried on
 * the wire, guard statuses, guard reason codes, input/output shapes and the
 * currency minor unit table used for safe amount arithmetic.
 *
 * Consumers must reference these constants instead of hard-coded strings.
 */

export const BUDGET_GUARD_CONTRACT_VERSION = "v0";

/** Field names of the Budget Guard input and output. */
export const BUDGET_GUARD_FIELD = {
  BUDGET: "budget",
  ENABLED: "enabled",
  LIMIT_AMOUNT: "limitAmount",
  SPENT_AMOUNT: "spentAmount",
  WINDOW_START: "windowStart",
  WINDOW_END: "windowEnd",
  REQUESTED_DISCOUNT_AMOUNT: "requestedDiscountAmount",
  CURRENCY: "currency",
  GUARD_STATUS: "guardStatus",
  GUARD_REASON_CODE: "guardReasonCode",
  APPLIED_DISCOUNT_AMOUNT: "appliedDiscountAmount",
  REMAINING_BUDGET_AMOUNT: "remainingBudgetAmount",
} as const;

/** Guard status values of the Budget Guard contract. */
export const BUDGET_GUARD_STATUS = {
  NOT_CONFIGURED: "NOT_CONFIGURED",
  ALLOWED: "ALLOWED",
  CAPPED: "CAPPED",
  EXHAUSTED: "EXHAUSTED",
} as const;

export type BudgetGuardStatus = typeof BUDGET_GUARD_STATUS[keyof typeof BUDGET_GUARD_STATUS];

/** Guard reason code values of the Budget Guard contract. */
export const BUDGET_GUARD_REASON_CODE = {
  NO_BUDGET_CONFIGURED: "NO_BUDGET_CONFIGURED",
  BUDGET_DISABLED: "BUDGET_DISABLED",
  BUDGET_AVAILABLE: "BUDGET_AVAILABLE",
  BUDGET_PARTIALLY_EXHAUSTED: "BUDGET_PARTIALLY_EXHAUSTED",
  BUDGET_EXHAUSTED: "BUDGET_EXHAUSTED",
} as const;

export type BudgetGuardReasonCode = typeof BUDGET_GUARD_REASON_CODE[keyof typeof BUDGET_GUARD_REASON_CODE];

/** Minor units per major unit used when a currency has no 1/100 minor unit. */
export const BUDGET_GUARD_CURRENCY_DECIMALS: Record<string, number> = {
  BHD: 3,
  BIF: 0,
  CLF: 4,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
};

export const BUDGET_GUARD_DEFAULT_CURRENCY_DECIMALS = 2;

/** Budget configuration attached to a discount request. */
export type BudgetGuardBudget = {
  limitAmount: number;
  spentAmount: number;
  windowStart?: string;
  windowEnd?: string;
  enabled?: boolean;
};

export type EvaluateBudgetGuardInput = {
  requestedDiscountAmount: number;
  currency: string;
  budget?: BudgetGuardBudget;
};

export type EvaluateBudgetGuardResult = {
  guardStatus: BudgetGuardStatus;
  guardReasonCode: BudgetGuardReasonCode;
  requestedDiscountAmount: number;
  appliedDiscountAmount: number;
  remainingBudgetAmount: number;
};
