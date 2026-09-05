import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export const DEFAULT_SCORES_LIMIT = 12;

type ScoreQueryRow = {
  player_name: string;
  score: number;
  created_at: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function toScoreRows(rows: ScoreQueryRow[]): ScoreRow[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.player_name,
    score: r.score,
    date: formatDate(r.created_at),
  }));
}

export async function fetchScores(
  supabase: SupabaseClient,
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return toScoreRows((data ?? []) as ScoreQueryRow[]);
}

// Client-side: para usar desde Client Components (HallOfFame al cambiar de tab).
export async function getScoresByGameClient(
  gameId: string,
  limit: number = DEFAULT_SCORES_LIMIT,
): Promise<ScoreRow[]> {
  const supabase = createBrowserSupabaseClient();
  return fetchScores(supabase, gameId, limit);
}

export async function insertScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void> {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score });

  if (error) throw error;
}
