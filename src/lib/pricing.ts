export const DEFAULT_CURRENCY = "INR";

// Mock pricing (edit as needed). Stripe integration will replace these.
export const PLAN_PRICES_CENTS: Record<"monthly" | "yearly", number> = {
  monthly: 49900,
  yearly: 49900 * 10, // simple yearly discount in mock
};

// PRD: "A fixed portion of each subscription contributes to the prize pool."
// Since PRD doesn't specify %, mock uses this default.
export const PRIZE_POOL_CONTRIBUTION_PCT = 20;

// PRD: match tier shares (of the prize pool).
export const DRAW_TIER_SHARE: Record<"5-match" | "4-match" | "3-match", number> = {
  "5-match": 0.4,
  "4-match": 0.35,
  "3-match": 0.25,
};

