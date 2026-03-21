import type {
  Charity,
  Draw,
  DrawWinner,
  DrawMode,
  DrawType,
  Role,
  ScoreEntry,
  Subscription,
  User,
  WinnerSubmission,
} from "@/types/domain";
import { readJson, writeJson } from "./storage";
import { seedCharities } from "./seedCharities";
import { DRAW_TIER_SHARE, PRIZE_POOL_CONTRIBUTION_PCT } from "@/lib/pricing";

const LS_USERS = "gh_mock_users_v1";
const LS_SESSION_USER_ID = "gh_mock_session_user_id_v1";
const LS_SCORES = "gh_mock_scores_by_user_v1";
const LS_SUBSCRIPTIONS = "gh_mock_subscriptions_by_user_v1";
const LS_CHARITIES = "gh_mock_charities_v1";
const LS_DRAWS = "gh_mock_draws_v1";
const LS_DRAW_WINNERS = "gh_mock_draw_winners_v1";
const LS_WINNER_SUBMISSIONS = "gh_mock_winner_submissions_v1";

const DEFAULT_ADMIN_EMAIL = "admin@golf.local";
const DEFAULT_ADMIN_PASSWORD = "Admin123!";

function uid(prefix = "id"): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return `${prefix}-${c.randomUUID()}`;
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function ensureUsersSeeded(): User[] {
  const users = readJson<User[]>(LS_USERS, []);
  if (users.length > 0) return users;
  const admin: User = {
    id: uid("user"),
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    role: "admin",
    charityId: null,
    charityPct: 10,
    donationPctExtra: 0,
  };
  writeJson(LS_USERS, [admin]);
  return [admin];
}

function ensureCharitiesSeeded(): Charity[] {
  const existing = readJson<Charity[] | null>(LS_CHARITIES, null);
  if (existing && Array.isArray(existing) && existing.length > 0) return existing;
  writeJson(LS_CHARITIES, seedCharities);
  return seedCharities;
}

export function getCharities(): Charity[] {
  return ensureCharitiesSeeded();
}

export function upsertCharity(input: Omit<Charity, "id"> & { id?: string }): Charity {
  const all = ensureCharitiesSeeded();
  const id = input.id ?? uid("charity");
  const next: Charity = {
    id,
    name: input.name,
    description: input.description,
    featured: input.featured ?? false,
    imageDataUrl: input.imageDataUrl,
  };
  const idx = all.findIndex((c) => c.id === id);
  const updated = idx >= 0 ? all.map((c) => (c.id === id ? next : c)) : [...all, next];
  writeJson(LS_CHARITIES, updated);
  return next;
}

export function deleteCharity(id: string): void {
  const all = ensureCharitiesSeeded();
  writeJson(
    LS_CHARITIES,
    all.filter((c) => c.id !== id),
  );
}

export function getAllUsers(): User[] {
  return ensureUsersSeeded();
}

function writeUsers(users: User[]) {
  writeJson(LS_USERS, users);
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) ?? null;
}

export function updateUserCharityMock(params: {
  userId: string;
  charityId: string | null;
  charityPct: number;
  donationPctExtra: number;
}): User | null {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === params.userId);
  if (idx < 0) return null;
  const next: User = {
    ...users[idx],
    charityId: params.charityId,
    charityPct: Math.max(10, Math.floor(params.charityPct)),
    donationPctExtra: Math.max(0, Math.floor(params.donationPctExtra)),
  };
  const updated = users.map((u, i) => (i === idx ? next : u));
  writeUsers(updated);
  return next;
}

export function getSessionUserId(): string | null {
  return readJson<string | null>(LS_SESSION_USER_ID, null);
}

export function loginMock(email: string, password: string): { ok: true } | { ok: false; error: string } {
  const users = getAllUsers();
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) return { ok: false, error: "Invalid email or password." };
  if (u.password !== password) return { ok: false, error: "Invalid email or password." };
  writeJson(LS_SESSION_USER_ID, u.id);
  return { ok: true };
}

export function signupMock(params: {
  email: string;
  password: string;
  charityId: string | null;
  charityPct: number;
  donationPctExtra: number;
  role?: Role;
}): { ok: true; userId: string } | { ok: false; error: string } {
  const users = getAllUsers();
  const exists = users.some((x) => x.email.toLowerCase() === params.email.toLowerCase());
  if (exists) return { ok: false, error: "Email already registered." };
  const newUser: User = {
    id: uid("user"),
    email: params.email,
    password: params.password,
    role: params.role ?? "subscriber",
    charityId: params.charityId,
    charityPct: Math.max(10, Math.floor(params.charityPct)),
    donationPctExtra: Math.max(0, Math.floor(params.donationPctExtra)),
  };
  writeUsers([...users, newUser]);
  writeJson(LS_SESSION_USER_ID, newUser.id);
  return { ok: true, userId: newUser.id };
}

export function logoutMock(): void {
  writeJson(LS_SESSION_USER_ID, null);
}

export function getSubscriptionByUserId(userId: string): Subscription | null {
  const subs = readJson<Record<string, Subscription>>(LS_SUBSCRIPTIONS, {});
  return subs[userId] ?? null;
}

function setSubscription(sub: Subscription) {
  const subs = readJson<Record<string, Subscription>>(LS_SUBSCRIPTIONS, {});
  writeJson(LS_SUBSCRIPTIONS, { ...subs, [sub.userId]: sub });
}

export function purchaseSubscriptionMock(params: {
  userId: string;
  plan: "monthly" | "yearly";
  priceCents: number;
  currency: string;
  renewalISODate: string;
}): Subscription {
  const sub: Subscription = {
    userId: params.userId,
    plan: params.plan,
    status: "active",
    renewalISODate: params.renewalISODate,
    priceCents: params.priceCents,
    currency: params.currency,
  };
  setSubscription(sub);
  return sub;
}

export function getScoresByUserId(userId: string): ScoreEntry[] {
  const scoresByUser = readJson<Record<string, ScoreEntry[]>>(LS_SCORES, {});
  return scoresByUser[userId] ?? [];
}

function setScoresByUserId(userId: string, entries: ScoreEntry[]) {
  const scoresByUser = readJson<Record<string, ScoreEntry[]>>(LS_SCORES, {});
  writeJson(LS_SCORES, { ...scoresByUser, [userId]: entries });
}

export function upsertScoreMock(params: { userId: string; stableford: number; scoreDateISO: string }): ScoreEntry {
  const stableford = Math.floor(params.stableford);
  if (stableford < 1 || stableford > 45) {
    throw new Error("Score must be between 1 and 45 (Stableford).");
  }
  const entries = getScoresByUserId(params.userId);

  const existingIdx = entries.findIndex((e) => e.scoreDateISO === params.scoreDateISO);
  const nextEntry: ScoreEntry = {
    id: existingIdx >= 0 ? entries[existingIdx].id : uid("score"),
    userId: params.userId,
    stableford,
    scoreDateISO: params.scoreDateISO,
  };
  const merged = existingIdx >= 0 ? entries.map((e, i) => (i === existingIdx ? nextEntry : e)) : [...entries, nextEntry];

  // Keep only latest 5 by date (ISO YYYY-MM-DD sorts lexicographically).
  const sorted = [...merged].sort((a, b) => a.scoreDateISO.localeCompare(b.scoreDateISO));
  const latest5 = sorted.slice(-5);
  setScoresByUserId(params.userId, latest5);
  return nextEntry;
}

export function deleteScoreMock(params: { userId: string; scoreDateISO: string }): void {
  const entries = getScoresByUserId(params.userId).filter((e) => e.scoreDateISO !== params.scoreDateISO);
  setScoresByUserId(params.userId, entries);
}

export function getDraws(): Draw[] {
  return readJson<Draw[]>(LS_DRAWS, []);
}

export function getDrawWinners(): DrawWinner[] {
  return readJson<DrawWinner[]>(LS_DRAW_WINNERS, []);
}

export function getWinnerSubmissions(): WinnerSubmission[] {
  return readJson<WinnerSubmission[]>(LS_WINNER_SUBMISSIONS, []);
}

function setDraws(draws: Draw[]) {
  writeJson(LS_DRAWS, draws);
}

function setDrawWinners(winners: DrawWinner[]) {
  writeJson(LS_DRAW_WINNERS, winners);
}

function setWinnerSubmissions(subs: WinnerSubmission[]) {
  writeJson(LS_WINNER_SUBMISSIONS, subs);
}

function drawNumbersRandom(matchSize: DrawType): number[] {
  const arr: number[] = [];
  for (let i = 0; i < matchSize; i++) {
    arr.push(Math.floor(Math.random() * 45) + 1);
  }
  return arr;
}

function drawNumbersAlgorithmic(matchSize: DrawType, poolNumbers: number[]): number[] {
  // Weighted selection by frequency of score values in the provided pool.
  const weights = new Map<number, number>();
  for (const n of poolNumbers) weights.set(n, (weights.get(n) ?? 0) + 1);

  const values = [...weights.keys()];
  const cumulative: Array<{ v: number; c: number }> = [];
  let total = 0;
  for (const v of values) {
    total += weights.get(v) ?? 0;
    cumulative.push({ v, c: total });
  }

  function pickOne(): number {
    const r = Math.random() * total;
    const hit = cumulative.find((x) => r <= x.c);
    return hit?.v ?? values[0] ?? 1;
  }

  const arr: number[] = [];
  for (let i = 0; i < matchSize; i++) arr.push(pickOne());
  return arr;
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((x, i) => x === sb[i]);
}

export function runDrawMock(params: {
  createdByUserId: string;
  monthISODate: string;
  drawType: DrawType;
  mode: DrawMode;
  publish: boolean;
  priceCentsForPoolCalculation: number; // mock: per subscription fee
}): { draw: Draw; winners: DrawWinner[] } {
  const users = getAllUsers().filter((u) => u.role === "subscriber");

  const activeSubscribers = users.filter((u) => {
    const sub = getSubscriptionByUserId(u.id);
    if (!sub) return false;
    return sub.status === "active";
  });

  // For algorithmic weighting: consider all users' latest 5 score values as the pool.
  const allScoresFlat: number[] = [];
  for (const u of activeSubscribers) {
    const entries = getScoresByUserId(u.id).sort((a, b) => a.scoreDateISO.localeCompare(b.scoreDateISO));
    for (const e of entries) allScoresFlat.push(e.stableford);
  }

  const matchNumbers =
    params.mode === "random"
      ? drawNumbersRandom(params.drawType)
      : drawNumbersAlgorithmic(params.drawType, allScoresFlat.length > 0 ? allScoresFlat : [1, 2, 3, 4, 5]);

  const winners: DrawWinner[] = [];
  for (const u of activeSubscribers) {
    const entries = getScoresByUserId(u.id).sort((a, b) => a.scoreDateISO.localeCompare(b.scoreDateISO));
    const latestN = entries.slice(-params.drawType).map((e) => e.stableford);
    if (multisetEqual(latestN, matchNumbers.slice(0, params.drawType))) {
      const tier: DrawWinner["tier"] = params.drawType === 5 ? "5-match" : params.drawType === 4 ? "4-match" : "3-match";
      winners.push({
        id: uid("winner"),
        drawId: "__temp__",
        userId: u.id,
        matchNumbers: matchNumbers.slice(0, params.drawType),
        matchSize: params.drawType,
        tier,
      });
    }
  }

  const d: Draw = {
    id: uid("draw"),
    monthISO: params.monthISODate,
    drawType: params.drawType,
    mode: params.mode,
    status: params.publish ? "published" : "simulation",
    createdAtISO: new Date().toISOString(),
    publishedAtISO: params.publish ? new Date().toISOString() : undefined,
    createdByUserId: params.createdByUserId,
  };

  const finalizedWinners = winners.map((w) => ({ ...w, drawId: d.id }));

  const existingDraws = getDraws();
  setDraws([d, ...existingDraws]);
  const existingWinners = getDrawWinners();
  setDrawWinners([...finalizedWinners, ...existingWinners]);

  // Jackpot rollover: if 5-match publish yields no winners, we record it as a marker on the draw.
  if (params.drawType === 5 && params.publish && finalizedWinners.length === 0) {
    // For mock, we store a rollover marker so UI can display "carry forward".
    const updatedDraws = getDraws().map((x) =>
      x.id === d.id
        ? {
            ...x,
            jackpotRolloverCents: Math.round(params.priceCentsForPoolCalculation * 0.4), // 5-match share assumed 40%
          }
        : x,
    );
    setDraws(updatedDraws);
  }

  return { draw: d, winners: finalizedWinners };
}

export function upsertWinnerSubmissionMock(params: {
  drawId: string;
  userId: string;
  proofDataUrl?: string;
  adminNotes?: string;
  status: WinnerSubmission["status"];
  payoutCents?: number;
  paymentStatus?: WinnerSubmission["paymentStatus"];
}): WinnerSubmission {
  const all = getWinnerSubmissions();
  const existingIdx = all.findIndex((s) => s.drawId === params.drawId && s.userId === params.userId);
  const entry: WinnerSubmission = {
    id: existingIdx >= 0 ? all[existingIdx].id : uid("sub"),
    drawId: params.drawId,
    userId: params.userId,
    status: params.status,
    proofDataUrl: params.proofDataUrl,
    adminNotes: params.adminNotes,
    payoutCents: params.payoutCents,
    paymentStatus: params.paymentStatus,
    createdAtISO: existingIdx >= 0 ? all[existingIdx].createdAtISO : new Date().toISOString(),
  };
  const next = existingIdx >= 0 ? all.map((s, i) => (i === existingIdx ? entry : s)) : [entry, ...all];
  setWinnerSubmissions(next);
  return entry;
}

export function calculatePayoutCentsForWinnerMock(params: {
  drawId: string;
  userId: string;
  priceCentsForPoolCalculation: number;
}): number {
  const draws = getDraws();
  const draw = draws.find((d) => d.id === params.drawId);
  if (!draw) return 0;

  const winners = getDrawWinners().filter((w) => w.drawId === params.drawId && w.userId === params.userId);
  if (winners.length === 0) return 0;

  const allUsers = getAllUsers();
  const activeSubscribers = allUsers.filter((u) => u.role === "subscriber" && (getSubscriptionByUserId(u.id)?.status === "active"));
  const activeCount = activeSubscribers.length;

  const basePrizePoolCents = Math.round(
    (activeCount * params.priceCentsForPoolCalculation * PRIZE_POOL_CONTRIBUTION_PCT) / 100,
  );

  const rolloverJackpotAddCents =
    draw.drawType === 5 && typeof draw.jackpotRolloverCents === "number" ? draw.jackpotRolloverCents : 0;

  const tierKey: "5-match" | "4-match" | "3-match" =
    draw.drawType === 5 ? "5-match" : draw.drawType === 4 ? "4-match" : "3-match";

  const share = DRAW_TIER_SHARE[tierKey];

  const winnersForDrawTierCount = getDrawWinners().filter((w) => w.drawId === params.drawId).length;
  if (winnersForDrawTierCount === 0) return 0;

  const tierTotalCents = Math.round((basePrizePoolCents + rolloverJackpotAddCents) * share);
  return Math.floor(tierTotalCents / winnersForDrawTierCount);
}

