import Library from "@/components/Library";
import { getGames } from "@/lib/games";

export default async function BibliotecaPage() {
  const games = await getGames();

  return <Library games={games} />;
}
