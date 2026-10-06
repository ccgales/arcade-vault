"use client";

import { useState } from "react";

const POKEDEX_SIZE = 1025;
const artworkUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export default function PokemonCounter() {
  const [count, setCount] = useState(0);
  // El contador sube sin límite; el Pokémon da la vuelta al llegar al último.
  const id = count === 0 ? 0 : ((count - 1) % POKEDEX_SIZE) + 1;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl flex-col items-center justify-center gap-8 px-4 py-12">
      <h1 className="font-pixel text-center text-xl leading-relaxed text-(--cyan) sm:text-2xl">
        CONTADOR POKÉMON
      </h1>

      <div className="flex h-72 w-72 items-center justify-center rounded-lg border border-(--line) bg-(--bg-3) shadow-[0_0_32px_rgba(0,245,255,0.12)] sm:h-80 sm:w-80">
        {id === 0 ? (
          <p className="px-6 text-center text-(--ink-dim)">
            Haz clic en el botón para descubrir un Pokémon.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            src={artworkUrl(id)}
            alt={`Pokémon número ${id}`}
            width={475}
            height={475}
            className="h-full w-full object-contain p-4"
          />
        )}
      </div>

      <p aria-live="polite" className="text-center">
        <span className="font-pixel block text-5xl text-(--yellow)">
          {count}
        </span>
        <span className="text-(--ink-dim)">
          {id === 0 ? "clics" : `Pokédex #${String(id).padStart(4, "0")}`}
        </span>
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="font-pixel min-h-11 cursor-pointer rounded bg-(--cyan) px-8 py-3 font-bold text-(--bg)"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          disabled={!count}
          className="min-h-11 cursor-pointer rounded border border-(--line) px-5 py-3 text-(--ink) disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reiniciar
        </button>
      </div>
    </main>
  );
}
