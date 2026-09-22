export interface TouchButtonSpec {
  code: string; // KeyboardEvent.code — lo leen Asteroids, Tetris y Snake
  key: string; // KeyboardEvent.key — lo lee BloqueBuster
  label: string; // glifo o palabra del botón: "◀", "ROTAR"
  aria: string; // etiqueta accesible: "Girar a la izquierda"
  group: "dpad" | "actions";
  repeat?: boolean; // auto-repeat mientras se mantiene pulsado
  cell?: "up" | "down" | "left" | "right" | "wide";
}

export type TouchLayout = TouchButtonSpec[];

// Cada botón sale del CONTROL_KEYS del juego correspondiente. `key` de Space
// es " " (un espacio), no "Space": ningún juego lo lee hoy, pero debe ser
// correcto por si un juego futuro mira `e.key`.
const LEFT = { code: "ArrowLeft", key: "ArrowLeft" } as const;
const RIGHT = { code: "ArrowRight", key: "ArrowRight" } as const;
const UP = { code: "ArrowUp", key: "ArrowUp" } as const;
const DOWN = { code: "ArrowDown", key: "ArrowDown" } as const;
const SPACE = { code: "Space", key: " " } as const;

export const TOUCH_LAYOUTS: Partial<Record<string, TouchLayout>> = {
  asteroides: [
    {
      ...LEFT,
      label: "◀",
      aria: "Girar a la izquierda",
      group: "dpad",
      cell: "left",
    },
    {
      ...RIGHT,
      label: "▶",
      aria: "Girar a la derecha",
      group: "dpad",
      cell: "right",
    },
    { ...UP, label: "PROPULSOR", aria: "Propulsor", group: "actions" },
    { ...SPACE, label: "DISPARO", aria: "Disparar", group: "actions" },
  ],
  caida: [
    {
      ...LEFT,
      label: "◀",
      aria: "Mover a la izquierda",
      group: "dpad",
      cell: "left",
      repeat: true,
    },
    {
      ...RIGHT,
      label: "▶",
      aria: "Mover a la derecha",
      group: "dpad",
      cell: "right",
      repeat: true,
    },
    {
      ...DOWN,
      label: "▼",
      aria: "Bajar la pieza",
      group: "dpad",
      cell: "down",
      repeat: true,
    },
    { ...UP, label: "ROTAR", aria: "Rotar la pieza", group: "actions" },
    { ...SPACE, label: "CAÍDA", aria: "Caída rápida", group: "actions" },
  ],
  "bloque-buster": [
    {
      ...LEFT,
      label: "◀",
      aria: "Mover la paleta a la izquierda",
      group: "dpad",
      cell: "wide",
    },
    {
      ...RIGHT,
      label: "▶",
      aria: "Mover la paleta a la derecha",
      group: "dpad",
      cell: "wide",
    },
  ],
  serpentina: [
    { ...UP, label: "▲", aria: "Ir hacia arriba", group: "dpad", cell: "up" },
    {
      ...LEFT,
      label: "◀",
      aria: "Ir hacia la izquierda",
      group: "dpad",
      cell: "left",
    },
    {
      ...RIGHT,
      label: "▶",
      aria: "Ir hacia la derecha",
      group: "dpad",
      cell: "right",
    },
    {
      ...DOWN,
      label: "▼",
      aria: "Ir hacia abajo",
      group: "dpad",
      cell: "down",
    },
  ],
};

export const hasTouchControls = (gameId: string): boolean =>
  TOUCH_LAYOUTS[gameId] !== undefined;
