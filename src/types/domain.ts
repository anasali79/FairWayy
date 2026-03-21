export type Role = "subscriber" | "admin";

export type Plan = "monthly" | "yearly";

export type CharityEvent = {
  id: string;
  name: string;
  dateISO: string;
  location: string;
  description: string;
};

export type Charity = {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  imageDataUrl?: string; 
  galleryImages?: string[];
  featured?: boolean;
  upcomingEvents?: CharityEvent[];
};

export type Subscription = {
  userId: string;
  plan: Plan;
  status: "active" | "inactive" | "past_due" | "cancelled";
  renewalISODate: string; // YYYY-MM-DD
  priceCents: number;
  currency: string;
};

export type User = {
  id: string;
  email: string;
  password: string; // mock-only (do not do this in production)
  role: Role;
  charityId: string | null;
  charityPct: number; // >= 10
  donationPctExtra: number; // >=0
};

export type ScoreEntry = {
  id: string;
  userId: string;
  scoreDateISO: string; // YYYY-MM-DD
  stableford: number; // 1-45
  courseName?: string;
};

export type DrawType = 5 | 4 | 3;

export type DrawMode = "random" | "algorithmic";

export type Draw = {
  id: string;
  monthISO: string; // YYYY-MM-01
  drawType: DrawType;
  mode: DrawMode;
  status: "simulation" | "published" | "completed";
  createdAtISO: string;
  publishedAtISO?: string;
  createdByUserId: string;
  winningNumbers?: number[];
  jackpotRolloverCents?: number; // used only for mock
};

export type DrawWinner = {
  id: string;
  drawId: string;
  userId: string;
  matchNumbers: number[]; // drawn score numbers
  matchSize: DrawType;
  tier: "5-match" | "4-match" | "3-match";
  prizeAmountCents?: number;
};

export type WinnerSubmissionStatus = "pending" | "approved" | "rejected";

export type WinnerSubmission = {
  id: string;
  drawId: string;
  userId: string;
  status: WinnerSubmissionStatus;
  proofDataUrl?: string; // mock-only
  adminNotes?: string;
  payoutCents?: number; // mock-only
  paymentStatus?: "pending" | "paid"; // mock-only
  createdAtISO: string;
};

