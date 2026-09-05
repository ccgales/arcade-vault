import { createClient } from "@/lib/supabase/server";

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: number;
}

type GameRow = Omit<Game, "best" | "plays">;

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();

  const [
    { data: games, error: gamesError },
    { data: stats, error: statsError },
  ] = await Promise.all([
    supabase.from("games").select("id, title, short, long, cat, cover, color"),
    supabase.from("game_stats").select("game_id, best, plays"),
  ]);

  if (gamesError) throw gamesError;
  if (statsError) throw statsError;

  const statsByGameId = new Map(
    (stats ?? []).map((s) => [
      s.game_id as string,
      { best: s.best as number, plays: s.plays as number },
    ]),
  );

  return (games ?? []).map((g) => {
    const row = g as GameRow;
    const gameStats = statsByGameId.get(row.id);
    return {
      ...row,
      best: gameStats?.best ?? 0,
      plays: gameStats?.plays ?? 0,
    };
  });
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = await createClient();

  const [{ data: game, error: gameError }, { data: stats, error: statsError }] =
    await Promise.all([
      supabase
        .from("games")
        .select("id, title, short, long, cat, cover, color")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("game_stats")
        .select("best, plays")
        .eq("game_id", id)
        .maybeSingle(),
    ]);

  if (gameError) throw gameError;
  if (statsError) throw statsError;
  if (!game) return null;

  return {
    ...(game as GameRow),
    best: stats?.best ?? 0,
    plays: stats?.plays ?? 0,
  };
}
