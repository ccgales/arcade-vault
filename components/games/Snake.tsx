"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const W = 800;
const H = 600;

const COLS = 40;
const ROWS = 30;
const CELL = 20;

const SCORE_PER_FRUIT = 10;
const FRUITS_PER_LEVEL = 5;
const START_INTERVAL_MS = 150;
const INTERVAL_DECREASE_PER_LEVEL_MS = 10;
const MIN_INTERVAL_MS = 60;

const FRUIT_IMAGE_SRC = "/snake/fruits.png";

// Portado desde references/source-assets/snake-assets/sprites.js (window.SPRITE_ATLAS.fruits)
const FRUIT_SPRITES: { x: number; y: number; w: number; h: number }[] = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  { x: 378, y: 136, w: 110, h: 160 }, // grape
  { x: 540, y: 136, w: 130, h: 160 }, // garlic
  { x: 712, y: 136, w: 130, h: 160 }, // eggplant
  { x: 894, y: 136, w: 110, h: 160 }, // strawberry
  { x: 1066, y: 136, w: 110, h: 160 }, // cherry
  { x: 1228, y: 136, w: 130, h: 160 }, // carrot
  { x: 1400, y: 136, w: 130, h: 160 }, // mushroom
  { x: 1582, y: 136, w: 110, h: 160 }, // broccoli
  { x: 1734, y: 136, w: 150, h: 160 }, // watermelon
  { x: 1906, y: 136, w: 150, h: 160 }, // pepper
  { x: 2068, y: 136, w: 170, h: 160 }, // kiwi
  { x: 2250, y: 136, w: 140, h: 160 }, // lemon
  { x: 2432, y: 136, w: 130, h: 160 }, // peach
  { x: 2604, y: 136, w: 130, h: 160 }, // peanut
  { x: 2786, y: 136, w: 110, h: 160 }, // apple
  { x: 2948, y: 136, w: 130, h: 160 }, // tomato
  { x: 3110, y: 136, w: 150, h: 160 }, // berries
  { x: 3302, y: 136, w: 110, h: 160 }, // grapes2
  { x: 3454, y: 136, w: 150, h: 160 }, // pineapple
  { x: 3637, y: 136, w: 130, h: 160 }, // melon
];

const CONTROL_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

type Cell = { x: number; y: number };
type GamePhase = "playing" | "gameover";

export interface SnakeState {
  score: number;
  lives: number;
  level: number;
}

export interface SnakeProps {
  paused: boolean;
  onStateChange: (state: SnakeState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface SnakeHandle {
  endGame: () => void;
}

function Snake(
  { paused, onStateChange, onGameOver }: SnakeProps,
  ref: React.Ref<SnakeHandle>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const forceEndRef = useRef(false);
  const onStateChangeRef = useRef(onStateChange);
  const onGameOverRef = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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

    const fruitImg = new Image();
    fruitImg.src = FRUIT_IMAGE_SRC;

    let score = 0;
    let level = 1;
    let phase: GamePhase = "playing";
    let gameOverReported = false;
    let moveAccum = 0;

    let dir: Cell = { x: 1, y: 0 };
    let pendingDir: Cell = { x: 1, y: 0 };
    let turnedThisTick = false;

    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    const segments: Cell[] = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];

    let fruit: { gx: number; gy: number; spriteIndex: number };

    function spawnFruit() {
      const free: Cell[] = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!segments.some((s) => s.x === x && s.y === y)) {
            free.push({ x, y });
          }
        }
      }
      const cell = free[Math.floor(Math.random() * free.length)];
      fruit = {
        gx: cell.x,
        gy: cell.y,
        spriteIndex: Math.floor(Math.random() * FRUIT_SPRITES.length),
      };
    }

    spawnFruit();

    function step() {
      dir = pendingDir;
      turnedThisTick = false;

      const head = segments[0];
      const newHead: Cell = { x: head.x + dir.x, y: head.y + dir.y };

      if (
        newHead.x < 0 ||
        newHead.x >= COLS ||
        newHead.y < 0 ||
        newHead.y >= ROWS
      ) {
        phase = "gameover";
        return;
      }

      const eating = newHead.x === fruit.gx && newHead.y === fruit.gy;
      const bodyToCheck = eating ? segments : segments.slice(0, -1);
      if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        phase = "gameover";
        return;
      }

      segments.unshift(newHead);
      if (eating) {
        score += SCORE_PER_FRUIT;
        level = Math.floor(score / (SCORE_PER_FRUIT * FRUITS_PER_LEVEL)) + 1;
        spawnFruit();
      } else {
        segments.pop();
      }
    }

    let lastReportedScore = -1;
    let lastReportedLevel = -1;

    function reportState() {
      if (score === lastReportedScore && level === lastReportedLevel) return;
      lastReportedScore = score;
      lastReportedLevel = level;
      onStateChangeRef.current({ score, lives: 1, level });
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (CONTROL_KEYS.includes(e.code)) e.preventDefault();
      if (pausedRef.current || phase === "gameover") return;

      let newDir: Cell | null = null;
      switch (e.code) {
        case "ArrowUp":
          newDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
          newDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
          newDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
          newDir = { x: 1, y: 0 };
          break;
      }
      if (!newDir || turnedThisTick) return;
      if (newDir.x === -dir.x && newDir.y === -dir.y) return;
      pendingDir = newDir;
      turnedThisTick = true;
    }

    window.addEventListener("keydown", handleKeyDown);

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

      const moveInterval = Math.max(
        MIN_INTERVAL_MS,
        START_INTERVAL_MS - (level - 1) * INTERVAL_DECREASE_PER_LEVEL_MS,
      );
      moveAccum += dt;
      if (moveAccum >= moveInterval) {
        moveAccum = 0;
        step();
      }

      reportState();
    }

    function draw() {
      ctx.fillStyle = "#020403";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }

      const sprite = FRUIT_SPRITES[fruit.spriteIndex];
      if (fruitImg.complete && fruitImg.naturalWidth > 0) {
        ctx.drawImage(
          fruitImg,
          sprite.x,
          sprite.y,
          sprite.w,
          sprite.h,
          fruit.gx * CELL,
          fruit.gy * CELL,
          CELL,
          CELL,
        );
      } else {
        ctx.fillStyle = "#ff006e";
        ctx.fillRect(
          fruit.gx * CELL + 2,
          fruit.gy * CELL + 2,
          CELL - 4,
          CELL - 4,
        );
      }

      for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        ctx.fillStyle = i === 0 ? "#7cffb2" : "#00ff88";
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      }
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
      width={W}
      height={H}
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

export default forwardRef<SnakeHandle, SnakeProps>(Snake);
