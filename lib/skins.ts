/**
 * Fuente de verdad del color de los juegos reales (SPEC 10).
 *
 * Solo datos: ni lógica de juego, ni render, ni imports de `components/`.
 * Cada juego real añade aquí su propio `Record<SkinId, …>` sin tocar los demás.
 */

export const SKIN_IDS = ["clasico", "neon", "retro"] as const;
export type SkinId = (typeof SKIN_IDS)[number];

export const DEFAULT_SKIN: SkinId = "clasico";

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

/** Muestras del chip del picker: el control enseña la paleta que selecciona. */
export const SKIN_ACCENTS: Record<SkinId, [string, string, string]> = {
  clasico: ["#ffffff", "#00ffff", "#ff8200"],
  neon: ["#00f5ff", "#f5ff00", "#ff4fd8"],
  retro: ["#ffe7b3", "#ffb84d", "#d2841b"],
};

export interface AsteroidsSkin {
  bg: string;
  ship: string;
  shipWidth: number;
  shipGlow: number;
  thrust: string;
  thrustWidth: number;
  bullet: string;
  bulletGlow: number;
  asteroid: string;
  asteroidWidth: number;
  asteroidGlow: number;
  /** "r,g,b" — el alpha lo sigue calculando la partícula con su propio ttl. */
  particleRgb: string;
  particleWidth: number;
  powerup: string;
  powerupWidth: number;
  powerupGlow: number;
  powerupFont: string;
  hud: string;
  hudFont: string;
}

export const ASTEROIDS_SKINS: Record<SkinId, AsteroidsSkin> = {
  // Extracción literal del Asteroides vectorial actual: prueba de no regresión.
  clasico: {
    bg: "#000000",
    ship: "#ffffff",
    shipWidth: 1.5,
    shipGlow: 0,
    thrust: "rgba(255, 130, 0, 0.85)",
    thrustWidth: 1.5,
    bullet: "#ffffff",
    bulletGlow: 0,
    asteroid: "#ffffff",
    asteroidWidth: 1.5,
    asteroidGlow: 0,
    particleRgb: "255,255,255",
    particleWidth: 1,
    powerup: "#00ffff",
    powerupWidth: 2,
    powerupGlow: 0,
    powerupFont: "bold 12px monospace",
    hud: "#00ffff",
    hudFont: "15px monospace",
  },
  // Vocabulario de la casa (--cyan / --yellow) con glow; el asteroide en la
  // banda baja de luminancia para que el enemigo nunca se lea como del jugador.
  neon: {
    bg: "#05060a",
    ship: "#00f5ff",
    shipWidth: 2,
    shipGlow: 12,
    thrust: "rgba(255, 61, 0, 0.9)",
    thrustWidth: 2,
    bullet: "#f5ff00",
    bulletGlow: 10,
    asteroid: "#ff4fd8",
    asteroidWidth: 1.5,
    asteroidGlow: 8,
    particleRgb: "255,154,226",
    particleWidth: 1,
    powerup: "#00c46a",
    powerupWidth: 2,
    powerupGlow: 10,
    powerupFont: "bold 12px monospace",
    hud: "#00c46a",
    hudFont: "15px monospace",
  },
  // Fósforo ámbar monocromo: roles separados por escalones de luminancia,
  // no por tono, y sin bajar de 4.5:1 en ningún elemento crítico.
  retro: {
    bg: "#120a00",
    ship: "#ffe7b3",
    shipWidth: 2,
    shipGlow: 2,
    thrust: "rgba(184, 92, 0, 1)",
    thrustWidth: 2,
    bullet: "#ffcf6b",
    bulletGlow: 1,
    asteroid: "#d2841b",
    asteroidWidth: 1.5,
    asteroidGlow: 0,
    particleRgb: "230,150,36",
    particleWidth: 1,
    powerup: "#ffb84d",
    powerupWidth: 2,
    powerupGlow: 1,
    powerupFont: "bold 12px monospace",
    hud: "#ffb84d",
    hudFont: "bold 15px monospace",
  },
};

/**
 * Las 7 claves de bloque que `LEVELS` de Bloque Buster referencia **por nombre**
 * (`components/games/BloqueBuster.tsx`): son estructura de nivel, no color.
 * Ninguna skin puede añadir, quitar ni renombrar entradas de este tipo.
 */
export type BlockColorKey =
  "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export interface BloqueBusterSkin {
  bg: string;
  /** Clave de nivel → color. La partícula guarda la clave, nunca el hex. */
  blocks: Record<BlockColorKey, string>;
  blockGlow: number;
  paddle: string;
  paddleGlow: number;
  /** Separado del relleno: `clasico` dibuja la paleta blanca con halo cian. */
  paddleGlowColor: string;
  ball: string;
  ballGlow: number;
  ballGlowColor: string;
}

export const BLOQUE_BUSTER_SKINS: Record<SkinId, BloqueBusterSkin> = {
  // Extracción literal del `BLOCK_COLORS` y del `draw()` actuales.
  // Tres bloques quedan bajo 4.5:1 (gray 4.31, red 4.19, magenta 3.86): es
  // deliberado, `clasico` es la prueba de no regresión — ver SPEC 10.
  clasico: {
    bg: "#000000",
    blocks: {
      red: "#ff3b3b",
      yellow: "#f5ff00",
      cyan: "#00f5ff",
      magenta: "#ff006e",
      hotpink: "#ff4fd8",
      green: "#00ff88",
      gray: "#8a8a8a",
    },
    blockGlow: 6,
    paddle: "#ffffff",
    paddleGlow: 8,
    paddleGlowColor: "#00f5ff",
    ball: "#ffffff",
    ballGlow: 8,
    ballGlowColor: "#ffffff",
  },
  // Paleta = --cyan (jugador) y pelota = --yellow (proyectil), igual reparto de
  // roles que Asteroides. Los bloques bajan a la banda media de luminancia, y
  // las claves `yellow`/`cyan` se desplazan a ámbar/teal para no competir con
  // el amarillo y el cian puros del jugador.
  neon: {
    bg: "#05060a",
    blocks: {
      red: "#ff5c5c",
      yellow: "#ffa41b",
      cyan: "#00b0c4",
      magenta: "#ff5c9e",
      hotpink: "#ff8ae0",
      green: "#00c46a",
      gray: "#9aa7bd",
    },
    blockGlow: 10,
    paddle: "#00f5ff",
    paddleGlow: 12,
    paddleGlowColor: "#00f5ff",
    ball: "#f5ff00",
    ballGlow: 10,
    ballGlowColor: "#f5ff00",
  },
  // Fósforo ámbar: paleta y pelota reutilizan los hex de "jugador" y
  // "proyectil" de Asteroides `retro`. Los bloques ocupan una escalera
  // comprimida 4.61–5.65:1 (techo = 9.08 / 1.6, para no perder la pelota sobre
  // el muro); la deriva de tono 22°–47° conserva el patrón de cada nivel.
  retro: {
    bg: "#120a00",
    blocks: {
      red: "#e97b1c",
      yellow: "#caa210",
      cyan: "#d29722",
      magenta: "#ee7027",
      hotpink: "#e48a28",
      green: "#cb9e24",
      gray: "#b69667",
    },
    blockGlow: 0,
    paddle: "#ffe7b3",
    paddleGlow: 2,
    paddleGlowColor: "#ffe7b3",
    ball: "#ffcf6b",
    ballGlow: 2,
    ballGlowColor: "#ffcf6b",
  },
};

export interface SnakeSkin {
  bg: string;
  /** La rejilla ya existía en el juego: la skin la recolorea, no la añade. */
  grid: string;
  gridWidth: number;
  head: string;
  headGlow: number;
  body: string;
  /**
   * El spritesheet `/snake/fruits.png` no es recoloreable por paleta:
   * `retro` cae a la celda sólida que el juego ya dibujaba como fallback.
   */
  fruitMode: "sprite" | "solid";
  /** Relleno en modo `solid`; halo del sprite en modo `sprite`. */
  fruit: string;
  fruitGlow: number;
}

export const SNAKE_SKINS: Record<SkinId, SnakeSkin> = {
  // Extracción literal de la Serpentina actual: prueba de no regresión.
  // La rejilla (1.07:1) y el fallback de fruta (3.80:1) quedan bajo umbral a
  // propósito — son los valores que el juego ya tenía; ver SPEC 10.
  clasico: {
    bg: "#020403",
    grid: "rgba(255,255,255,0.05)",
    gridWidth: 1,
    head: "#7cffb2",
    headGlow: 0,
    body: "#00ff88",
    fruitMode: "sprite",
    fruit: "#ff006e",
    fruitGlow: 0,
  },
  // Cabeza = --cyan (jugador, lo más luminoso) y cuerpo en el teal medio que ya
  // usa Bloque Buster; la fruta conserva su sprite y se integra con un halo
  // `#ff4fd8`, el mismo rosa que Asteroides usa para lo que no es del jugador.
  neon: {
    bg: "#05060a",
    grid: "#327d85",
    gridWidth: 1,
    head: "#00f5ff",
    headGlow: 12,
    body: "#00b0c4",
    fruitMode: "sprite",
    fruit: "#ff4fd8",
    fruitGlow: 10,
  },
  // Fósforo ámbar monocromo con los hex del ladder fijado por Asteroides:
  // cabeza `#ffe7b3` > cuerpo `#ffcf6b` > fruta `#e69624` > rejilla `#b85c00`.
  // Aquí la fruta es celda sólida: un sprite fotográfico no cabe en monocromo.
  retro: {
    bg: "#120a00",
    grid: "#b85c00",
    gridWidth: 1,
    head: "#ffe7b3",
    headGlow: 2,
    body: "#ffcf6b",
    fruitMode: "solid",
    fruit: "#e69624",
    fruitGlow: 1,
  },
};

/** Clave versionada de `localStorage`; global a la plataforma, no por juego. */
export const SKIN_STORAGE_KEY = "av:skin:v1";

export const isSkinId = (value: unknown): value is SkinId =>
  typeof value === "string" && (SKIN_IDS as readonly string[]).includes(value);

const GAMES_WITH_SKINS = new Set<string>([
  "asteroides",
  "bloque-buster",
  "serpentina",
]);

export const hasSkins = (gameId: string) => GAMES_WITH_SKINS.has(gameId);
