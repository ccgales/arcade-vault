import { notFound } from "next/navigation";
import { getGameById } from "@/lib/games";
import GamePlayer from "@/components/GamePlayer";

export default async function GamePlayerPage(
  props: PageProps<"/juegos/[id]/jugar">,
) {
  const { id } = await props.params;
  const game = await getGameById(id);

  if (!game) notFound();

  return <GamePlayer game={game} />;
}
