import { notFound } from "next/navigation";
import { getGameById } from "@/lib/games";
import { getScoresByGame } from "@/lib/scores";
import GameDetail from "@/components/GameDetail";

export default async function GameDetailPage(props: PageProps<"/juegos/[id]">) {
  const { id } = await props.params;
  const game = await getGameById(id);

  if (!game) notFound();

  const scores = await getScoresByGame(id);

  return <GameDetail game={game} scores={scores} />;
}
