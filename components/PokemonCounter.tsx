"use client";

import { useState } from "react";

const TOTAL = 1025;
const ART = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export default function PokemonCounter() {
  const [count, setCount] = useState(0);
  // El contador sube sin límite; el Pokémon da la vuelta al llegar al último.
  const id = count === 0 ? 0 : ((count - 1) % TOTAL) + 1;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl flex-col items-center justify-center gap-8 px-4 py-12">
      <h1
        className="text-center text-xl leading-relaxed sm:text-2xl"
        style={{ fontFamily: "var(--pixel)", color: "var(--cyan)" }}
      >
        CONTADOR POKÉMON
      </h1>

      <div
        className="flex h-72 w-72 items-center justify-center rounded-lg sm:h-80 sm:w-80"
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--line)",
          boxShadow: "0 0 32px rgba(0,245,255,0.12)",
        }}
      >
        {id === 0 ? (
          <p className="px-6 text-center" style={{ color: "var(--ink-dim)" }}>
            Haz clic en el botón para descubrir un Pokémon.
          </p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            src={ART(id)}
            alt={`Pokémon número ${id}`}
            width={475}
            height={475}
            className="h-full w-full object-contain p-4"
          />
        )}
      </div>

      <p aria-live="polite" className="text-center">
        <span
          className="block text-5xl"
          style={{ fontFamily: "var(--pixel)", color: "var(--yellow)" }}
        >
          {count}
        </span>
        <span style={{ color: "var(--ink-dim)" }}>
          {id === 0 ? "clics" : `Pokédex #${String(id).padStart(4, "0")}`}
        </span>
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="min-h-11 cursor-pointer rounded px-8 py-3 font-bold"
          style={{
            background: "var(--cyan)",
            color: "var(--bg)",
            fontFamily: "var(--pixel)",
          }}
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => setCount(0)}
          disabled={count === 0}
          className="min-h-11 cursor-pointer rounded px-5 py-3 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ border: "1px solid var(--line)", color: "var(--ink)" }}
        >
          Reiniciar
        </button>
      </div>
    </main>
  );
}
