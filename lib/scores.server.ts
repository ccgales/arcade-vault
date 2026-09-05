import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchScores, DEFAULT_SCORES_LIMIT, type ScoreRow } from "@/lib/scores";

export type { ScoreRow };

// Server-side: para usar desde Server Components (Detalle de juego, Salón de la Fama).
export async function getScoresByGame(
  gameId: string,
  limit: number = DEFAULT_SCORES_LIMIT,
): Promise<ScoreRow[]> {
  const supabase = await createServerSupabaseClient();
  return fetchScores(supabase, gameId, limit);
}
