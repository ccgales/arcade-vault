import HallOfFame from "@/components/HallOfFame";
import { getGames } from "@/lib/games";
import { getScoresByGame } from "@/lib/scores";

export default async function SalonPage() {
  const games = await getGames();
  const initialScores =
    games.length > 0 ? await getScoresByGame(games[0].id) : [];

  return <HallOfFame games={games} initialScores={initialScores} />;
}
