"use client";

import { useEffect, useRef, useState } from "react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/games";
import { insertScore } from "@/lib/scores";
import {
  DEFAULT_SKIN,
  SKIN_STORAGE_KEY,
  hasSkins,
  isSkinId,
} from "@/lib/skins";
import type { SkinId } from "@/lib/skins";
import SkinPicker from "@/components/SkinPicker";
import TouchControls from "@/components/TouchControls";
import { hasTouchControls } from "@/lib/touch-controls";
import Asteroids from "@/components/games/Asteroids";
import Tetris from "@/components/games/Tetris";
import BloqueBuster from "@/components/games/BloqueBuster";
import Snake from "@/components/games/Snake";
import FroggerGame from "@/components/games/FroggerGame";

interface RealGameState {
  score: number;
  lives: number;
  level: number;
}

interface RealGameProps {
  paused: boolean;
  skin: SkinId;
  onStateChange: (state: RealGameState) => void;
  onGameOver: (finalScore: number) => void;
}

interface RealGameHandle {
  endGame: () => void;
}

type RealGameComponent = ForwardRefExoticComponent<
  RealGameProps & RefAttributes<RealGameHandle>
>;

const REAL_GAMES: Partial<Record<string, RealGameComponent>> = {
  asteroides: Asteroids,
  caida: Tetris,
  "bloque-buster": BloqueBuster,
  serpentina: Snake,
  frogger: FroggerGame,
};

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const RealGame = REAL_GAMES[game.id];

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState("INVITADO");
  const [saved, setSaved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  // Arranca siempre en DEFAULT_SKIN: leer localStorage en el inicializador
  // provocaría un mismatch de hidratación entre servidor y cliente.
  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN);
  const skinHydratedRef = useRef(false);

  const realGameRef = useRef<RealGameHandle>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SKIN_STORAGE_KEY);
      // Un valor desconocido o corrupto se ignora y cae a DEFAULT_SKIN.
      if (isSkinId(stored)) setSkin(stored);
    } catch {
      // localStorage no disponible: se sigue con DEFAULT_SKIN
    }
  }, []);

  useEffect(() => {
    // El primer pase es solo hidratación: no reescribe lo que acaba de leerse.
    if (!skinHydratedRef.current) {
      skinHydratedRef.current = true;
      return;
    }
    try {
      window.localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {
      // localStorage no disponible: la selección solo vive en memoria
    }
  }, [skin]);

  // Cambiar de app o de pestaña a mitad de partida es fácil en móvil (una
  // llamada, cambiar de app); nunca reanuda sola, solo pausa.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && !over) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [over]);

  useEffect(() => {
    if (RealGame) return;
    if (over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [RealGame, over, paused]);

  useEffect(() => {
    if (RealGame) return;
    if (score > 0 && score % 2500 < 100) setLevel((l) => l + 1);
  }, [RealGame, score]);

  const handleRealGameStateChange = (state: RealGameState) => {
    setScore(state.score);
    setLives(state.lives);
    setLevel(state.level);
  };

  const handleRealGameOver = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };

  const endGame = () => {
    if (RealGame) {
      realGameRef.current?.endGame();
    } else {
      setOver(true);
    }
  };

  const saveScore = async () => {
    try {
      await insertScore(game.id, name, score);
      setSaved(true);
      router.refresh();
    } catch {
      // el guardado falló; "saved" queda en false para que el jugador reintente manualmente
    }
  };

  const restart = () => {
    setPaused(false);
    setOver(false);
    setSaved(false);
    if (RealGame) {
      setScore(0);
      setLives(3);
      setLevel(1);
      setResetKey((k) => k + 1);
    } else {
      setScore(0);
      setLevel(1);
    }
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div className="hud-stats">
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          {hasSkins(game.id) && <SkinPicker value={skin} onChange={setSkin} />}
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <button
            className="btn ghost"
            onClick={() => router.push(`/juegos/${game.id}`)}
          >
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {RealGame ? (
            <RealGame
              key={resetKey}
              ref={realGameRef}
              paused={paused}
              skin={skin}
              onStateChange={handleRealGameStateChange}
              onGameOver={handleRealGameOver}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
        {hasTouchControls(game.id) && (
          <TouchControls gameId={game.id} disabled={paused || over} />
        )}
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button
                className="btn magenta"
                onClick={() => router.push("/biblioteca")}
              >
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
