import type {
  Charity,
  Draw,
  DrawMode,
  DrawType,
  DrawWinner,
  Role,
  ScoreEntry,
  Subscription,
  User,
  WinnerSubmission,
} from "@/types/domain";
import { supabase } from "@/lib/supabase/browserClient";
import { DRAW_TIER_SHARE, PRIZE_POOL_CONTRIBUTION_PCT } from "@/lib/pricing";

type CharityRow = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  featured: boolean;
};

function mapCharity(row: CharityRow): Charity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageDataUrl: row.image_url ?? undefined,
    featured: row.featured ?? false,
  };
}

type ProfileRow = {
  user_id: string;
  role: Role;
  charity_id: string | null;
  charity_pct: number | null;
  donation_pct_extra: number | null;
};

export async function getCharities(): Promise<Charity[]> {
  const { data, error } = await supabase
    .from("golf_charities")
    .select("id,name,description,image_url,featured,created_at")
    .order("featured", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCharity);
}

export async function upsertCharity(input: Omit<Charity, "id"> & { id?: string }): Promise<Charity> {
  const payload = {
    id: input.id ?? undefined,
    name: input.name,
    description: input.description,
    image_url: input.imageDataUrl ?? null,
    featured: input.featured ?? false,
  };

  // If id is provided, upsert by id; otherwise insert with generated uuid.
  const { data, error } = await supabase.from("golf_charities").upsert(payload, { onConflict: "id" }).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Failed to upsert charity.");
  return mapCharity(data);
}

export async function deleteCharity(id: string): Promise<void> {
  const { error } = await supabase.from("golf_charities").delete().eq("id", id);
  if (error) throw error;
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("golf_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const renewalISODate =
    typeof data.renewal_date === "string"
      ? data.renewal_date.slice(0, 10)
      : data.renewal_date
        ? data.renewal_date.toISOString().slice(0, 10)
        : "";
  return {
    userId: data.user_id,
    plan: data.plan,
    status: data.status,
    renewalISODate,
    priceCents: data.price_cents,
    currency: data.currency,
  };
}

export async function getScoresByUserId(userId: string): Promise<ScoreEntry[]> {
  const { data, error } = await supabase
    .from("golf_scores")
    .select("id,user_id,score_date,stableford,course_name,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as { id: string; user_id: string; score_date: Date | string; stableford: number; course_name: string | null };
    const scoreDateISO =
      typeof row.score_date === "string"
        ? row.score_date
        : row.score_date.toISOString().slice(0, 10);
    return {
      id: row.id,
      userId: row.user_id,
      scoreDateISO,
      stableford: row.stableford,
      courseName: row.course_name ?? undefined,
    };
  });
}

export async function upsertScoreMock(params: { userId: string; stableford: number; scoreDateISO: string; courseName?: string }) {
  const stableford = Math.floor(params.stableford);
  if (stableford < 1 || stableford > 45) throw new Error("Score must be between 1 and 45 (Stableford).");

  // Since we added an ID column and removed (user_id, score_date) PK, we can just insert
  const { error: insertError } = await supabase.from("golf_scores").insert({
    user_id: params.userId,
    score_date: params.scoreDateISO,
    stableford,
    course_name: params.courseName || null,
  });

  if (insertError) throw insertError;

  // Enforce latest 5 by creation time (LIFO)
  const { data: all, error: selError } = await supabase
    .from("golf_scores")
    .select("id")
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false });
  
  if (!selError && all && all.length > 5) {
      const toDelete = all.slice(5).map(r => r.id);
      await supabase.from("golf_scores").delete().in("id", toDelete);
  }
}

export async function deleteScore(scoreId: string) {
    const { error } = await supabase.from("golf_scores").delete().eq("id", scoreId);
    if (error) throw error;
}

export async function updateUserCharityMock(params: {
  userId: string;
  charityId: string | null;
  charityPct: number;
  donationPctExtra: number;
  role?: Role;
}): Promise<User | null> {
  const updatePayload: Record<string, any> = {
    charity_id: params.charityId,
    charity_pct: Math.max(10, Math.floor(params.charityPct)),
    donation_pct_extra: Math.max(0, Math.floor(params.donationPctExtra)),
  };
  if (params.role) {
    updatePayload.role = params.role;
  }

  const { data: profile, error } = await supabase
    .from("golf_profiles")
    .update(updatePayload)
    .eq("user_id", params.userId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;
  const row = profile as ProfileRow;
  return {
    id: row.user_id,
    email: "",
    password: "",
    role: row.role,
    charityId: row.charity_id ?? null,
    charityPct: row.charity_pct ?? 10,
    donationPctExtra: row.donation_pct_extra ?? 0,
  };
}

export async function purchaseSubscriptionMock(params: {
  userId: string;
  plan: "monthly" | "yearly";
  priceCents: number;
  currency: string;
  renewalISODate: string; // YYYY-MM-DD
}): Promise<void> {
  const { error } = await supabase.from("golf_subscriptions").upsert(
    {
      user_id: params.userId,
      plan: params.plan,
      status: "active",
      renewal_date: params.renewalISODate,
      price_cents: Math.floor(params.priceCents),
      currency: params.currency,
      stripe_customer_id: "mock",
      stripe_subscription_id: "mock",
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function createSubscriptionInactiveForStripe(params: {
  userId: string;
  plan: "monthly" | "yearly";
  priceCents: number;
  currency: string;
  renewalISODate: string; // YYYY-MM-DD
}): Promise<void> {
  const { error } = await supabase
    .from("golf_subscriptions")
    .upsert(
      {
        user_id: params.userId,
        plan: params.plan,
        status: "inactive",
        renewal_date: params.renewalISODate,
        price_cents: Math.floor(params.priceCents),
        currency: params.currency,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("golf_profiles")
    .select("user_id,role,charity_id,charity_pct,donation_pct_extra");
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as { user_id: string; role: Role; charity_id: string | null; charity_pct: number | null; donation_pct_extra: number | null };
    return {
      id: row.user_id,
    email: "",
    password: "",
      role: row.role,
      charityId: row.charity_id ?? null,
      charityPct: row.charity_pct ?? 10,
      donationPctExtra: row.donation_pct_extra ?? 0,
    };
  });
}

export async function getDraws(): Promise<Draw[]> {
  // Non-admin users will only see published draws via RLS; admin sees all.
  const { data, error } = await supabase
    .from("golf_draws")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => {
    const row = d as {
      id: string;
      month: Date | string;
      draw_type: DrawType;
      mode: DrawMode;
      status: Draw["status"];
      created_at: string | Date;
      published_at: string | Date | null;
      created_by: string | null;
      winning_numbers: number[] | null;
      jackpot_rollover_cents: number | null;
    };
    const monthISO =
      typeof row.month === "string" ? row.month.slice(0, 10) : row.month.toISOString().slice(0, 10);
    return {
      id: row.id,
      monthISO,
      drawType: row.draw_type,
      mode: row.mode,
      status: row.status,
      createdAtISO: new Date(row.created_at).toISOString(),
      publishedAtISO: row.published_at ? new Date(row.published_at).toISOString() : undefined,
      createdByUserId: row.created_by ?? "",
      winningNumbers: row.winning_numbers ?? undefined,
      jackpotRolloverCents: row.jackpot_rollover_cents ?? undefined,
    };
  });
}

export async function getDrawWinners(): Promise<DrawWinner[]> {
  const { data, error } = await supabase
    .from("golf_draw_winners")
    .select("draw_id,user_id,match_numbers,match_size,tier,prize_amount_cents,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((w) => {
    const row = w as {
      draw_id: string;
      user_id: string;
      match_numbers: number[];
      match_size: DrawType;
      tier: DrawWinner["tier"];
      prize_amount_cents?: number | null;
    };
    return {
      id: `${row.draw_id}-${row.user_id}-${row.tier}`,
      drawId: row.draw_id,
      userId: row.user_id,
      matchNumbers: row.match_numbers,
      matchSize: row.match_size,
      tier: row.tier,
      prizeAmountCents: row.prize_amount_cents ?? undefined,
    };
  });
}

export async function getWinnerSubmissionsByUser(userId: string): Promise<WinnerSubmission[]> {
  const { data, error } = await supabase
    .from("golf_winner_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => {
    const row = s as {
      id: string;
      draw_id: string;
      user_id: string;
      status: WinnerSubmission["status"];
      proof_storage_path: string | null;
      admin_notes: string | null;
      payout_cents: number | null;
      payment_status: WinnerSubmission["paymentStatus"] | null;
      created_at: string | Date;
    };
    return {
      id: row.id,
      drawId: row.draw_id,
      userId: row.user_id,
      status: row.status,
      proofDataUrl: row.proof_storage_path ?? undefined,
      adminNotes: row.admin_notes ?? undefined,
      payoutCents: row.payout_cents ?? undefined,
      paymentStatus: row.payment_status ?? undefined,
      createdAtISO: new Date(row.created_at).toISOString(),
    };
  });
}

export async function getWinnerSubmissions(): Promise<WinnerSubmission[]> {
  const { data, error } = await supabase
    .from("golf_winner_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => {
    const row = s as {
      id: string;
      draw_id: string;
      user_id: string;
      status: WinnerSubmission["status"];
      proof_storage_path: string | null;
      admin_notes: string | null;
      payout_cents: number | null;
      payment_status: WinnerSubmission["paymentStatus"] | null;
      created_at: string | Date;
    };
    return {
      id: row.id,
      drawId: row.draw_id,
      userId: row.user_id,
      status: row.status,
      proofDataUrl: row.proof_storage_path ?? undefined,
      adminNotes: row.admin_notes ?? undefined,
      payoutCents: row.payout_cents ?? undefined,
      paymentStatus: row.payment_status ?? undefined,
      createdAtISO: new Date(row.created_at).toISOString(),
    };
  });
}

function drawNumbersRandom(matchSize: DrawType): number[] {
  const arr: number[] = [];
  for (let i = 0; i < matchSize; i++) arr.push(Math.floor(Math.random() * 45) + 1);
  return arr;
}

function drawNumbersAlgorithmic(matchSize: DrawType, poolNumbers: number[]): number[] {
  const frequencies = new Map<number, number>();
  for (const n of poolNumbers) frequencies.set(n, (frequencies.get(n) ?? 0) + 1);

  const values = [...frequencies.keys()];
  if (values.length < matchSize) {
      // Not enough variety, fill with randoms
      for (let i = 1; i <= 45; i++) {
          if (!frequencies.has(i)) values.push(i);
          if (values.length >= matchSize + 10) break;
      }
  }

  const results: number[] = [];
  const selected = new Set<number>();

  while (selected.size < matchSize) {
    let total = 0;
    const currentPool = values.filter(v => !selected.has(v));
    const cumulative: Array<{ v: number; c: number }> = [];
    
    for (const v of currentPool) {
      total += frequencies.get(v) ?? 1; // weighting
      cumulative.push({ v, c: total });
    }

    const r = Math.random() * total;
    const hit = cumulative.find((x) => r <= x.c);
    if (hit) {
        selected.add(hit.v);
        results.push(hit.v);
    } else {
        // Fallback
        const fallback = currentPool[Math.floor(Math.random() * currentPool.length)];
        selected.add(fallback);
        results.push(fallback);
    }
  }

  return results.sort((a, b) => a - b);
}

function multisetEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((x, i) => x === sb[i]);
}

export async function runDrawSupabase(params: {
  createdByUserId: string;
  monthISODate: string; // YYYY-MM-01
  drawType: DrawType;
  mode: DrawMode;
  publish: boolean;
  winningNumbers: number[];
  priceCentsForPoolCalculation: number; // used for mock jackpot rollover amount
}): Promise<{ draw: Draw; winners: DrawWinner[] }> {
  if (!params.monthISODate) throw new Error("monthISODate required");

  // Active subscriber users for draw.
  const { data: subs, error: subsError } = await supabase
    .from("golf_subscriptions")
    .select("user_id,plan,status")
    .eq("status", "active");
  if (subsError) throw subsError;
  const activeUserIds = new Set((subs ?? []).map((x) => (x as { user_id: string }).user_id));

  // Load profiles (admin can see all due to RLS policies).
  const { data: profiles, error: profilesError } = await supabase
    .from("golf_profiles")
    .select("user_id,role");
  if (profilesError) throw profilesError;

  const activeSubscribers = (profiles ?? [])
    .filter((p) => (p as { role: Role; user_id: string }).role === "subscriber" && activeUserIds.has((p as { user_id: string }).user_id))
    .map((p) => (p as { user_id: string }).user_id);

  console.log("RUN DRAW DEBUG: activeSubscribers count:", activeSubscribers.length);

  // Pool for algorithmic selection: all users' latest 5 stableford numbers.
  const allScoresFlat: number[] = [];
  const latestScoresByUser = new Map<string, ScoreEntry[]>();

  for (const uid of activeSubscribers) {
    const { data: scores, error: scoresError } = await supabase
      .from("golf_scores")
      .select("score_date,stableford")
      .eq("user_id", uid)
      .order("score_date", { ascending: false })
      .limit(5);
    if (scoresError) throw scoresError;
    const entries: ScoreEntry[] = (scores ?? []).map((r) => {
      const row = r as { score_date: Date | string; stableford: number };
      const scoreDateISO =
        typeof row.score_date === "string"
          ? row.score_date
          : row.score_date.toISOString().slice(0, 10);
      return {
        id: `${uid}-${scoreDateISO}`,
        userId: uid,
        scoreDateISO,
        stableford: row.stableford,
      };
    });
    latestScoresByUser.set(uid, entries);
    for (const e of entries) allScoresFlat.push(e.stableford);
  }

  const matchNumbers = params.winningNumbers && params.winningNumbers.length > 0 
    ? params.winningNumbers 
    : (params.mode === "random"
        ? drawNumbersRandom(params.drawType)
        : drawNumbersAlgorithmic(params.drawType, allScoresFlat.length > 0 ? allScoresFlat : [1, 2, 3, 4, 5]));

  // Step 3: Prize Pool Calculation
  const pricePerSubCents = 50000; // ₹500
  const poolPct = 0.20; // 20%
  const totalPoolCents = activeSubscribers.length * pricePerSubCents * poolPct;
  
  const jackpotPoolCents = Math.floor(totalPoolCents * 0.40);
  const tier4PoolCents = Math.floor(totalPoolCents * 0.35);
  const tier3PoolCents = Math.floor(totalPoolCents * 0.25);

  const winnersByTier: Record<string, string[]> = {
    "5-match": [],
    "4-match": [],
    "3-match": []
  };

  const winners: DrawWinner[] = [];

  for (const uid of activeSubscribers) {
    const entries = latestScoresByUser.get(uid) ?? [];
    const latestN = entries.map(e => e.stableford);

    // Correct Match Logic: Only unique users numbers can match drawn numbers
    const userUniqueSet = new Set(latestN);
    const matchedValues = matchNumbers.filter(n => userUniqueSet.has(n));
    const matchCount = matchedValues.length;

    console.log(`[DRAW_ENGINE] Checking User ${uid}: Scores=[${latestN.join(',')}]. UniqueSet=[${Array.from(userUniqueSet).join(',')}]. Drawn=[${matchNumbers.join(',')}]. Matches=${matchCount} ([${matchedValues.join(',')}])`);

    if (matchCount >= 3) {
      const tier = matchCount >= 5 ? "5-match" : (matchCount === 4 ? "4-match" : "3-match");
      winnersByTier[tier].push(uid);
      
      winners.push({
        id: `tmp-${uid}`,
        drawId: "tmp",
        userId: uid,
        matchNumbers: matchedValues,
        matchSize: params.drawType,
        tier: tier as "5-match" | "4-match" | "3-match",
        prizeAmountCents: 0,
      });
    }
  }

  // Calculate prize amounts per winner (Splitting logic)
  for (const w of winners) {
    const tierCount = winnersByTier[w.tier].length;
    let pool = 0;
    if (w.tier === "5-match") pool = jackpotPoolCents;
    else if (w.tier === "4-match") pool = tier4PoolCents;
    else pool = tier3PoolCents;

    w.prizeAmountCents = Math.floor(pool / (tierCount || 1));
  }

  // Step 5: Jackpot Rollover Logic
  const hasJackpotWinner = winnersByTier["5-match"].length > 0;
  const rolloverCents = hasJackpotWinner ? 0 : jackpotPoolCents;

  // Aggressive cleanup before insertion to prevent unique violations
  // We delete any existing simulation or published version for this specific configuration
  const { data: existingDraws } = await supabase
    .from("golf_draws")
    .select("id")
    .eq("month", params.monthISODate)
    .eq("draw_type", params.drawType)
    .eq("mode", params.mode);

  if (existingDraws && existingDraws.length > 0) {
    const existingIds = existingDraws.map(d => d.id);
    // Delete winners and submissions related to these old records first
    await supabase.from("golf_draw_winners").delete().in("draw_id", existingIds);
    await supabase.from("golf_winner_submissions").delete().in("draw_id", existingIds);
    // Finally delete the draws
    await supabase.from("golf_draws").delete().in("id", existingIds);
  }

  // Insert draw row.
  const { data: insertData, error: drawInsertError } = await supabase
    .from("golf_draws")
    .insert({
      month: params.monthISODate,
      draw_type: params.drawType,
      mode: params.mode,
      status: params.publish ? "published" : "simulation",
      draw_numbers: matchNumbers,
      jackpot_rollover_cents: rolloverCents, 
      created_by: params.createdByUserId,
      published_at: params.publish ? new Date().toISOString() : null,
    })
    .select("*");

  if (drawInsertError) {
    console.error("DRAW INSERT ERROR:", drawInsertError);
    throw new Error(`Draw Insert Error: ${drawInsertError.message || "Unknown error"}`);
  }
  
  if (!insertData || insertData.length === 0) {
      throw new Error("No draw data returned from database after insert.");
  }

  const insertedDraw = insertData[0];
  const drawId = insertedDraw.id as string;

  if (winners.length > 0) {
    const winnerRows = winners.map((w) => ({
      draw_id: drawId,
      user_id: w.userId,
      match_numbers: w.matchNumbers,
      match_size: w.matchSize,
      tier: w.tier,
      prize_amount_cents: w.prizeAmountCents || 0,
    }));
    const { error: winnersInsertError } = await supabase.from("golf_draw_winners").insert(winnerRows);
    if (winnersInsertError) throw winnersInsertError;

    // Create submissions automatically for published draws
    if (params.publish) {
      const submissionRows = winners.map((w) => ({
        draw_id: drawId,
        user_id: w.userId,
        status: "pending",
        payout_cents: w.prizeAmountCents || 0,
        payment_status: "pending",
        created_at: new Date().toISOString(),
      }));
      const { error: submissionsError } = await supabase.from("golf_winner_submissions").insert(submissionRows);
      if (submissionsError) {
          console.error("SUBMISSIONS ERROR:", submissionsError);
          throw new Error(`Submissions Error: ${submissionsError.message}`);
      }
    }
  }

  const finalDraw: Draw = {
    id: drawId,
    monthISO: params.monthISODate,
    drawType: params.drawType,
    mode: params.mode,
    status: params.publish ? "published" : "simulation",
    createdAtISO: new Date().toISOString(),
    publishedAtISO: params.publish ? new Date().toISOString() : undefined,
    createdByUserId: params.createdByUserId,
    jackpotRolloverCents: insertedDraw.jackpot_rollover_cents ?? undefined,
    winningNumbers: matchNumbers,
  };

  if (params.publish && winners.length > 0) {
      console.log(`[EMAIL NOTIFICATION] Sent to ${winners.length} winners for Draw ${drawId}: Draw Results Published!`);
  }

  return { draw: finalDraw, winners };
}

export async function calculatePayoutCentsForWinner(params: {
  drawId: string;
  userId: string;
  priceCentsForPoolCalculation: number;
}): Promise<number> {
  const { data: draw, error: drawError } = await supabase
    .from("golf_draws")
    .select("*")
    .eq("id", params.drawId)
    .maybeSingle();
  if (drawError) throw drawError;
  if (!draw) return 0;

  const { data: subs, error: subsError } = await supabase
    .from("golf_subscriptions")
    .select("user_id")
    .eq("status", "active");
  if (subsError) throw subsError;
  const activeCount = (subs ?? []).length;

  const basePrizePoolCents = Math.round((activeCount * params.priceCentsForPoolCalculation * PRIZE_POOL_CONTRIBUTION_PCT) / 100);
  const rolloverJackpotAddCents =
    (draw.draw_type === 5 && typeof draw.jackpot_rollover_cents === "number") ? draw.jackpot_rollover_cents : 0;

  const tierKey: "5-match" | "4-match" | "3-match" =
    draw.draw_type === 5 ? "5-match" : draw.draw_type === 4 ? "4-match" : "3-match";
  const share = DRAW_TIER_SHARE[tierKey];

  const { data: winnerRows, error: winnersError } = await supabase.from("golf_draw_winners").select("user_id").eq("draw_id", params.drawId);
  if (winnersError) throw winnersError;
  const winnersForDrawTierCount = winnerRows?.length ?? 0;
  if (winnersForDrawTierCount === 0) return 0;

  const tierTotalCents = Math.round((basePrizePoolCents + rolloverJackpotAddCents) * share);
  return Math.floor(tierTotalCents / winnersForDrawTierCount);
}

export async function upsertWinnerSubmission(params: {
  drawId: string;
  userId: string;
  proofDataUrl?: string;
  adminNotes?: string;
  status: WinnerSubmission["status"];
  payoutCents?: number;
  paymentStatus?: WinnerSubmission["paymentStatus"];
}): Promise<WinnerSubmission> {
  const payload = {
    draw_id: params.drawId,
    user_id: params.userId,
    status: params.status,
    proof_storage_path: params.proofDataUrl ?? null,
    admin_notes: params.adminNotes ?? null,
    payout_cents: params.payoutCents ?? null,
    payment_status: params.paymentStatus ?? null,
  };

  const { data, error } = await supabase.from("golf_winner_submissions").upsert(payload, { onConflict: "draw_id,user_id" }).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Failed to upsert submission.");

  console.log(`[EMAIL NOTIFICATION] Sent to user ${params.userId}: Winner Verification Status Updated to ${params.status}`);
  return {
    id: data.id,
    drawId: data.draw_id,
    userId: data.user_id,
    status: data.status,
    proofDataUrl: data.proof_storage_path ?? undefined,
    adminNotes: data.admin_notes ?? undefined,
    payoutCents: data.payout_cents ?? undefined,
    paymentStatus: data.payment_status ?? undefined,
    createdAtISO: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
  };
}
export async function getLatestPublishedDrawDetails() {
  // 1. Get latest published draw
  const { data: draw, error: dError } = await supabase
    .from("golf_draws")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dError) throw dError;
  if (!draw) return null;

  // 2. Get winners for this draw
  const { data: winners, error: wError } = await supabase
    .from("golf_draw_winners")
    .select("user_id, match_numbers, match_size, tier, prize_amount_cents")
    .eq("draw_id", draw.id);

  if (wError) throw wError;

  return {
    draw: {
      id: draw.id,
      monthISO: draw.month,
      drawType: draw.draw_type,
      mode: draw.mode,
      status: draw.status,
      jackpotRolloverCents: draw.jackpot_rollover_cents,
      winningNumbers: draw.draw_numbers,
    },
    winners: (winners ?? []).map(w => ({
        userId: w.user_id,
        matchNumbers: w.match_numbers,
        matchSize: w.match_size,
        tier: w.tier,
        prizeAmountCents: w.prize_amount_cents
    })),
  };
}

export async function getAdminDashboardSummary() {
  // 1. Total Subscribers
  const { count: subscriberCount, error: subError } = await supabase
    .from("golf_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "subscriber");

  // 2. Monthly Revenue and Stats from Active Subscriptions
  const { data: activeSubs, error: activeSubsError } = await supabase
    .from("golf_subscriptions")
    .select("user_id, price_cents, plan")
    .eq("status", "active");

  const monthlyRev = (activeSubs ?? []).reduce((acc, s) => {
    // Approx monthly rev: yearly / 12 + monthly
    return acc + (s.plan === "yearly" ? s.price_cents / 12 : s.price_cents);
  }, 0);

  const activePrizePool = (activeSubs ?? []).reduce((acc, s) => {
    return acc + (s.price_cents * PRIZE_POOL_CONTRIBUTION_PCT) / 100;
  }, 0);

  // 3. Charity Impact
  const { data: profiles, error: profilesError } = await supabase
    .from("golf_profiles")
    .select("charity_pct, donation_pct_extra");
  
  const basePrices = new Map<string, number>();
  (activeSubs ?? []).forEach(s => basePrices.set(s.user_id, s.price_cents));

  const totalImpact = (activeSubs ?? []).reduce((acc, s) => {
     // This is a bit simplified, but gives a real feel.
     // In a real app we'd join subs and profiles.
     return acc + (s.price_cents * 15) / 100; // Mock profile join for now, 15% avg
  }, 0);

  // 4. Pending Winner Verifications
  const { data: pendingWinners, error: winError } = await supabase
    .from("golf_winner_submissions")
    .select("*, golf_profiles(user_id, role)")
    .eq("status", "pending")
    .limit(5);

  // 5. Recent Signups
  const { data: recentProfiles, error: recError } = await supabase
    .from("golf_profiles")
    .select("*")
    .eq("role", "subscriber")
    .order("created_at", { ascending: false })
    .limit(10);

  // 6. Current Draw Info
  const { data: latestDraw, error: drawError } = await supabase
    .from("golf_draws")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    totalSubscribers: subscriberCount ?? 0,
    monthlyRevenueCents: Math.round(monthlyRev),
    activePrizePoolCents: Math.round(activePrizePool),
    totalImpactCents: Math.round(totalImpact),
    pendingWinners: (pendingWinners ?? []).map(w => ({
        id: w.id,
        drawId: w.draw_id,
        userId: w.user_id,
        status: w.status,
    })),
    recentProfiles: (recentProfiles ?? []).map(p => ({
        id: p.user_id,
        role: p.role,
        createdAt: p.created_at,
    })),
    currentDraw: latestDraw ? {
        id: latestDraw.id,
        status: latestDraw.status,
        month: latestDraw.month,
    } : null,
  };
}

export async function getAllProfiles() {
  const { data: profiles, error: pError } = await supabase
    .from("golf_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (pError) throw pError;

  const { data: subs, error: sError } = await supabase
    .from("golf_subscriptions")
    .select("*");

  if (sError) throw sError;

  const subMap = new Map(subs.map(s => [s.user_id, s]));

  return (profiles ?? []).map(p => {
    const s = subMap.get(p.user_id);
    return {
      userId: p.user_id,
      role: p.role,
      charityId: p.charity_id,
      charityPct: p.charity_pct,
      donationPctExtra: p.donation_pct_extra,
      email: p.user_id,
      createdAtISO: p.created_at,
      subscription: s ? {
          status: s.status,
          plan: s.plan,
          priceCents: s.price_cents,
      } : null,
    };
  });
}

export async function getUserDetailedHistory(userId: string) {
  const { data: scores, error: sError } = await supabase
    .from("golf_scores")
    .select("id, score_date, stableford")
    .eq("user_id", userId)
    .order("score_date", { ascending: false });

  if (sError) throw sError;

  const { data: winnings, error: wError } = await supabase
    .from("golf_winner_submissions")
    .select("*, golf_draws(month, draw_type)")
    .eq("user_id", userId);

  if (wError) throw wError;

  return {
    scores: (scores ?? []).map(s => ({
        id: s.id,
        scoreDateISO: s.score_date,
        stableford: s.stableford,
    })),
    winnings: (winnings ?? []).map(w => ({
        id: w.id,
        payoutCents: w.payout_cents ?? 0,
        status: w.status,
        date: (w.golf_draws as any)?.month ?? w.created_at,
        drawType: (w.golf_draws as any)?.draw_type ?? 5,
    })),
  };
}

export async function getLivePrizePoolEstimation() {
  const { data: subs, error } = await supabase
    .from("golf_subscriptions")
    .select("price_cents")
    .eq("status", "active");

  if (error) throw error;
  
  const totalPoolCents = (subs ?? []).map(s => s.price_cents).reduce((acc, pc) => {
    return acc + (pc * PRIZE_POOL_CONTRIBUTION_PCT) / 100;
  }, 0);

  return totalPoolCents;
}

// Backwards-compatible aliases (so existing pages can switch from mock -> supabase with fewer edits).
export const runDrawMock = runDrawSupabase;
export const calculatePayoutCentsForWinnerMock = calculatePayoutCentsForWinner;
export const upsertWinnerSubmissionMock = upsertWinnerSubmission;

