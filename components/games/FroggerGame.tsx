"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FROGGER_SKINS, type FroggerSkin, type SkinId } from "@/lib/skins";

const COLS = 16;
const ROWS = 14;
const CELL = 40; // px
const CANVAS_W = COLS * CELL; // 640 — se escala con CSS al contenedor
const CANVAS_H = ROWS * CELL; // 560

// Zonas (índice de fila, 0 = arriba)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const JUMP_DURATION_MS = 120;
const ROUND_TIME_S = 15;
const ROUND_TIME_MIN_S = 6;
const LIVES_START = 3;
const GOAL_COUNT = 5;
const GOAL_WIDTH_COLS = 2;

const SCORE_PER_CELL = 10;
const SCORE_PER_GOAL = 50;
const SCORE_PER_ROUND = 200;
const SCORE_TIME_BONUS_PER_SEC = 10;

const CONTROL_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number;
  width: number;
  type: "car" | "truck" | "log" | "turtle";
  submerged?: boolean;
  /** Solo tortugas: tiempo transcurrido (ms) en la fase actual del ciclo de inmersión. */
  cycleT?: number;
}

interface Lane {
  row: number;
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

const TURTLE_VISIBLE_MS = 3000;
const TURTLE_SUBMERGED_MS = 1500;
const SPEED_GROWTH_PER_LEVEL = 1.15;

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function buildRoadLane(
  row: number,
  dir: 1 | -1,
  baseSpeed: number,
  level: number,
): Lane {
  const speed = baseSpeed * Math.pow(SPEED_GROWTH_PER_LEVEL, level - 1);
  const entities: Entity[] = [];
  let col = randomInt(-3, 0);
  while (col < COLS + 3) {
    const isTruck = Math.random() < 0.35;
    const width = isTruck ? randomInt(2, 3) : randomInt(1, 2);
    entities.push({ col, width, type: isTruck ? "truck" : "car" });
    // Hueco entre entidades: garantiza que el carril sea atravesable.
    col += width + randomInt(3, 6);
  }
  return { row, speed, dir, entities };
}

function buildRiverLane(
  row: number,
  dir: 1 | -1,
  baseSpeed: number,
  level: number,
  kind: "log" | "turtle",
): Lane {
  const speed = baseSpeed * Math.pow(SPEED_GROWTH_PER_LEVEL, level - 1);
  const entities: Entity[] = [];
  let col = randomInt(-4, 0);
  while (col < COLS + 4) {
    const width = kind === "log" ? randomInt(2, 4) : randomInt(2, 3);
    const entity: Entity = { col, width, type: kind };
    if (kind === "turtle") {
      entity.submerged = false;
      // Fase inicial aleatoria para que no todos los grupos se sumerjan a la vez.
      entity.cycleT = Math.random() * (TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS);
    }
    entities.push(entity);
    // Hueco de al menos 1 celda entre entidades.
    col += width + randomInt(2, 5);
  }
  return { row, speed, dir, entities };
}

/** 5 carriles de carretera (filas ROW_ROAD_TOP–ROW_ROAD_BOT) + 6 de río (ROW_RIVER_TOP–ROW_RIVER_BOT). */
function buildLanes(level: number): Lane[] {
  const lanes: Lane[] = [];

  for (let i = 0; i < ROW_ROAD_BOT - ROW_ROAD_TOP + 1; i++) {
    const row = ROW_ROAD_TOP + i;
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    // Spec: 1.5–4 px/frame. entity.col vive en columnas, no en píxeles, así
    // que se convierte dividiendo por CELL (si no, la entidad cruza el
    // tablero de 16 columnas en un puñado de frames).
    const baseSpeed = (1.5 + Math.random() * 2.5) / CELL;
    lanes.push(buildRoadLane(row, dir, baseSpeed, level));
  }

  for (let i = 0; i < ROW_RIVER_BOT - ROW_RIVER_TOP + 1; i++) {
    const row = ROW_RIVER_TOP + i;
    const dir: 1 | -1 = i % 2 === 0 ? -1 : 1;
    const baseSpeed = (1 + Math.random() * 2) / CELL; // 1–3 px/frame
    const kind: "log" | "turtle" = i % 2 === 0 ? "log" : "turtle";
    lanes.push(buildRiverLane(row, dir, baseSpeed, level, kind));
  }

  return lanes;
}

const GOAL_COL_STARTS = [1, 4, 7, 10, 13];

function goalIndexForCol(col: number): number {
  const c = Math.round(col);
  return GOAL_COL_STARTS.findIndex(
    (start) => c >= start && c < start + GOAL_WIDTH_COLS,
  );
}

function directionDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
  }
}

/** 1s menos de temporizador por nivel, con un piso de ROUND_TIME_MIN_S. */
function roundTimeForLevel(lvl: number): number {
  return Math.max(ROUND_TIME_MIN_S, ROUND_TIME_S - (lvl - 1));
}

function zoneColorForRow(row: number, pal: FroggerSkin): string {
  if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) return pal.bgRiver; // río
  if (row === ROW_SAFE_MID || row === ROW_START || row === ROW_GOALS)
    return pal.bgSafe; // zonas seguras / metas
  return pal.bgRoad; // carretera
}

export interface FroggerGameState {
  score: number;
  lives: number;
  level: number;
}

export interface FroggerGameProps {
  paused: boolean;
  /** Paleta activa (SPEC 10): índice de `FROGGER_SKINS`. */
  skin: SkinId;
  onStateChange: (state: FroggerGameState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface FroggerGameHandle {
  endGame: () => void;
}

function FroggerGame(
  { paused, skin, onStateChange, onGameOver }: FroggerGameProps,
  ref: React.Ref<FroggerGameHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef(skin);
  const forceEndRef = useRef(false);
  const onStateChangeRef = useRef(onStateChange);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useImperativeHandle(
    ref,
    () => ({
      endGame() {
        forceEndRef.current = true;
      },
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    let level = 1;
    let score = 0;
    let lives = LIVES_START;
    let phase: "playing" | "gameover" = "playing";
    let gameOverReported = false;

    let lanes = buildLanes(level);
    const goalsOccupied: boolean[] = new Array(GOAL_COUNT).fill(false);
    let roundTimer = roundTimeForLevel(level);
    let minRowReached = ROW_START;

    const startCol = Math.floor(COLS / 2);
    const frog: Frog = {
      col: startCol,
      row: ROW_START,
      animating: false,
      animT: 0,
      targetCol: startCol,
      targetRow: ROW_START,
    };
    let pendingDir: Direction | null = null;

    function checkRoadCollision(f: Frog, ls: Lane[]): boolean {
      for (const lane of ls) {
        if (lane.row !== f.row) continue;
        if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
        for (const entity of lane.entities) {
          if (f.col >= entity.col && f.col < entity.col + entity.width) {
            return true;
          }
        }
      }
      return false;
    }

    function getSupport(f: Frog, ls: Lane[]): Lane | null {
      for (const lane of ls) {
        if (lane.row !== f.row) continue;
        if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
        for (const entity of lane.entities) {
          if (f.col >= entity.col && f.col < entity.col + entity.width) {
            if (entity.type === "turtle" && entity.submerged) return null;
            return lane;
          }
        }
      }
      return null;
    }

    function checkGoal(f: Frog): "scored" | "occupied" | "miss" | "not-goal" {
      if (f.row !== ROW_GOALS) return "not-goal";
      const idx = goalIndexForCol(f.col);
      if (idx === -1) return "miss";
      if (goalsOccupied[idx]) return "occupied";
      goalsOccupied[idx] = true;
      return "scored";
    }

    function completeRound() {
      level += 1;
      lanes = buildLanes(level);
      goalsOccupied.fill(false);
      roundTimer = roundTimeForLevel(level);
      minRowReached = ROW_START;
      frog.col = startCol;
      frog.row = ROW_START;
      frog.animating = false;
      frog.animT = 0;
      frog.targetCol = startCol;
      frog.targetRow = ROW_START;
    }

    function killFrog() {
      lives -= 1;
      frog.animating = false;
      frog.animT = 0;
      if (lives <= 0) {
        lives = 0;
        phase = "gameover";
        return;
      }
      frog.col = startCol;
      frog.row = ROW_START;
      frog.targetCol = startCol;
      frog.targetRow = ROW_START;
      roundTimer = roundTimeForLevel(level);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (CONTROL_KEYS.includes(e.code)) e.preventDefault();
      if (pausedRef.current || phase === "gameover" || frog.animating) return;
      switch (e.code) {
        case "ArrowUp":
          pendingDir = "up";
          break;
        case "ArrowDown":
          pendingDir = "down";
          break;
        case "ArrowLeft":
          pendingDir = "left";
          break;
        case "ArrowRight":
          pendingDir = "right";
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    let lastReportedScore = -1;
    let lastReportedLives = -1;
    let lastReportedLevel = -1;

    function reportState() {
      if (
        score === lastReportedScore &&
        lives === lastReportedLives &&
        level === lastReportedLevel
      )
        return;
      lastReportedScore = score;
      lastReportedLives = lives;
      lastReportedLevel = level;
      onStateChangeRef.current({ score, lives, level });
    }

    reportState();

    function update(dt: number) {
      if (forceEndRef.current) {
        forceEndRef.current = false;
        phase = "gameover";
      }

      if (phase === "gameover") {
        reportState();
        if (!gameOverReported) {
          gameOverReported = true;
          onGameOverRef.current(score);
        }
        return;
      }

      for (const lane of lanes) {
        for (const entity of lane.entities) {
          entity.col += (lane.speed * lane.dir * dt) / 16;
          if (lane.dir === 1 && entity.col > COLS) entity.col = -entity.width;
          if (lane.dir === -1 && entity.col < -entity.width) entity.col = COLS;

          if (entity.type === "turtle") {
            entity.cycleT = (entity.cycleT ?? 0) + dt;
            const cyclePos =
              entity.cycleT % (TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS);
            entity.submerged = cyclePos >= TURTLE_VISIBLE_MS;
          }
        }
      }

      if (!frog.animating) {
        if (pendingDir) {
          const { dx, dy } = directionDelta(pendingDir);
          const targetCol = frog.col + dx;
          const targetRow = frog.row + dy;
          pendingDir = null;
          if (
            targetCol >= 0 &&
            targetCol < COLS &&
            targetRow >= ROW_GOALS &&
            targetRow <= ROW_START
          ) {
            frog.animating = true;
            frog.animT = 0;
            frog.targetCol = targetCol;
            frog.targetRow = targetRow;
          }
        }
      } else {
        frog.animT += dt;
        if (frog.animT >= JUMP_DURATION_MS) {
          frog.animating = false;
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;

          if (frog.row < minRowReached) {
            minRowReached = frog.row;
            score += SCORE_PER_CELL;
          }

          if (frog.row === ROW_GOALS) {
            const result = checkGoal(frog);
            if (result === "scored") {
              score +=
                SCORE_PER_GOAL +
                Math.round(roundTimer) * SCORE_TIME_BONUS_PER_SEC;
              if (goalsOccupied.every(Boolean)) {
                score += SCORE_PER_ROUND;
                completeRound();
              }
            } else {
              killFrog();
            }
          }
        }
      }

      if (
        phase === "playing" &&
        !frog.animating &&
        frog.row >= ROW_ROAD_TOP &&
        frog.row <= ROW_ROAD_BOT
      ) {
        if (checkRoadCollision(frog, lanes)) killFrog();
      }

      if (
        phase === "playing" &&
        !frog.animating &&
        frog.row >= ROW_RIVER_TOP &&
        frog.row <= ROW_RIVER_BOT
      ) {
        const support = getSupport(frog, lanes);
        if (!support) {
          killFrog();
        } else {
          frog.col += (support.speed * support.dir * dt) / 16;
          if (frog.col < 0 || frog.col > COLS) killFrog();
        }
      }

      if (phase === "playing") {
        roundTimer -= dt / 1000;
        if (roundTimer <= 0) {
          roundTimer = 0;
          killFrog();
        }
      }

      reportState();
    }

    function draw() {
      // La paleta se resuelve en cada frame desde el ref espejado: cambiar de
      // skin a mitad de partida repinta, nunca remonta ni reinicia la partida.
      const pal = FROGGER_SKINS[skinRef.current];

      for (let row = 0; row < ROWS; row++) {
        ctx.fillStyle = zoneColorForRow(row, pal);
        ctx.fillRect(0, row * CELL, CANVAS_W, CELL);
      }

      for (let i = 0; i < GOAL_COUNT; i++) {
        const x = GOAL_COL_STARTS[i] * CELL;
        const w = GOAL_WIDTH_COLS * CELL;
        const y = ROW_GOALS * CELL;
        ctx.fillStyle = pal.goalFill;
        ctx.fillRect(x + 3, y + 3, w - 6, CELL - 6);
        ctx.shadowBlur = pal.goalGlow;
        ctx.shadowColor = pal.goalGlow > 0 ? pal.goalBorder : "transparent";
        ctx.strokeStyle = pal.goalBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, w - 6, CELL - 6);
        if (goalsOccupied[i]) {
          ctx.shadowColor = pal.goalGlow > 0 ? pal.goalFilled : "transparent";
          ctx.fillStyle = pal.goalFilled;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + CELL / 2, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      for (const lane of lanes) {
        for (const entity of lane.entities) {
          const x = entity.col * CELL;
          const y = lane.row * CELL;
          const w = entity.width * CELL;

          // El halo solo envuelve el cuerpo de la entidad: los detalles internos
          // (ruedas, cabina, veta, caparazón) lo apagan para no heredarlo.
          if (entity.type === "car") {
            ctx.shadowBlur = pal.vehicleGlow;
            ctx.shadowColor = pal.vehicleGlow > 0 ? pal.car : "transparent";
            ctx.fillStyle = pal.car;
            ctx.fillRect(x + 2, y + 8, w - 4, CELL - 16);
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.fillStyle = pal.carWheel;
            ctx.beginPath();
            ctx.arc(x + 8, y + CELL - 8, 4, 0, Math.PI * 2);
            ctx.arc(x + w - 8, y + CELL - 8, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (entity.type === "truck") {
            ctx.shadowBlur = pal.vehicleGlow;
            ctx.shadowColor =
              pal.vehicleGlow > 0 ? pal.truckBody : "transparent";
            ctx.fillStyle = pal.truckBody;
            ctx.fillRect(x + 2, y + 6, w - 4, CELL - 12);
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.fillStyle = pal.truckCab;
            ctx.fillRect(x + 2, y + 6, CELL * 0.6, CELL - 12);
          } else if (entity.type === "log") {
            ctx.shadowBlur = pal.riverGlow;
            ctx.shadowColor = pal.riverGlow > 0 ? pal.log : "transparent";
            ctx.fillStyle = pal.log;
            ctx.fillRect(x, y + 8, w, CELL - 16);
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = pal.logGrain;
            ctx.lineWidth = 1;
            for (let lx = x + 6; lx < x + w; lx += 10) {
              ctx.beginPath();
              ctx.moveTo(lx, y + 8);
              ctx.lineTo(lx, y + CELL - 8);
              ctx.stroke();
            }
          } else if (entity.submerged) {
            // Sin halo a propósito: la tortuga sumergida no es una plataforma y
            // no debe invitar a saltar sobre ella.
            ctx.strokeStyle = pal.turtleSubmerged;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 3, y + 8, w - 6, CELL - 16);
          } else {
            ctx.shadowBlur = pal.riverGlow;
            ctx.shadowColor = pal.riverGlow > 0 ? pal.turtle : "transparent";
            ctx.fillStyle = pal.turtle;
            ctx.fillRect(x + 3, y + 8, w - 6, CELL - 16);
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.strokeStyle = pal.turtleShell;
            for (let lx = x + 8; lx < x + w; lx += 12) {
              ctx.beginPath();
              ctx.arc(lx, y + CELL / 2, 3, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
      }

      {
        const t = frog.animating ? frog.animT / JUMP_DURATION_MS : 0;
        const drawCol = frog.animating
          ? frog.col + (frog.targetCol - frog.col) * t
          : frog.col;
        const drawRow = frog.animating
          ? frog.row + (frog.targetRow - frog.row) * t
          : frog.row;
        const cx = drawCol * CELL + CELL / 2;
        const cy = drawRow * CELL + CELL / 2;
        const legSpread = frog.animating ? 6 : 2;

        ctx.shadowBlur = pal.frogGlow;
        ctx.shadowColor = pal.frogGlow > 0 ? pal.frog : "transparent";
        ctx.fillStyle = pal.frog;
        ctx.beginPath();
        ctx.ellipse(cx - legSpread, cy + 8, 5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + legSpread, cy + 8, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(cx, cy, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Los ojos son el localizador de la rana: van sin halo para que el
        // par ojo/pupila conserve su contraste sobre cualquier plataforma.
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.fillStyle = pal.frogEye;
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 6, 3, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pal.frogPupil;
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 6, 1.3, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 6, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = pal.hudFont;
      ctx.fillStyle = pal.hudText;
      ctx.textAlign = "left";
      ctx.fillText(`${score}`, 8, 18);

      ctx.textAlign = "center";
      ctx.fillText(`NV ${level}`, CANVAS_W / 2, 18);

      ctx.textAlign = "left";
      ctx.fillStyle = pal.hudLives;
      for (let i = 0; i < lives; i++) {
        ctx.beginPath();
        ctx.arc(CANVAS_W - 12 - i * 16, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const timeRatio = Math.max(0, roundTimer / roundTimeForLevel(level));
      ctx.fillStyle =
        timeRatio > 0.5
          ? pal.timeHigh
          : timeRatio > 0.2
            ? pal.timeMid
            : pal.timeLow;
      ctx.fillRect(0, 0, CANVAS_W * timeRatio, 4);
    }

    let lastTime: number | null = null;
    let rafId: number;

    function loop(ts: number) {
      if (pausedRef.current) {
        lastTime = null;
      } else {
        const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 50);
        lastTime = ts;
        update(dt);
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}

export default forwardRef<FroggerGameHandle, FroggerGameProps>(FroggerGame);
