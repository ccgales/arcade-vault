"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const W = 800;
const H = 600;

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

const PADDLE_W = 81;
const PADDLE_H = 14;
const PADDLE_Y = 560;
const BALL_SIZE = 16;

const BLOCK_COLORS: Record<string, string> = {
  red: "#ff3b3b",
  yellow: "#f5ff00",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  hotpink: "#ff4fd8",
  green: "#00ff88",
  gray: "#8a8a8a",
};

interface Level {
  speed: number;
  blocks: { col: number; row: number; color: string }[];
}

const LEVELS: Level[] = (() => {
  const rowColors1 = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
  const rowColors2 = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
  const rowColors4 = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

  const l1: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: Level["blocks"] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) {
      const isFrame =
        col === 0 ||
        col === BLOCK_COLS - 1 ||
        row === 0 ||
        row === BLOCK_ROWS - 1;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(60, 220);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.life = rand(0.15, 0.32);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = Math.max(this.ttl / this.life, 0);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
}

function collideAABB(
  ball: { x: number; y: number; w: number; h: number },
  block: Block,
) {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}

type GamePhase = "playing" | "gameover";

export interface BloqueBusterState {
  score: number;
  lives: number;
  level: number;
}

export interface BloqueBusterProps {
  paused: boolean;
  onStateChange: (state: BloqueBusterState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface BloqueBusterHandle {
  endGame: () => void;
}

const CONTROL_KEYS = ["ArrowLeft", "ArrowRight"];

function BloqueBuster(
  { paused, onStateChange, onGameOver }: BloqueBusterProps,
  ref: React.Ref<BloqueBusterHandle>,
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

    const keys: Record<string, boolean> = {};

    function handleKeyDown(e: KeyboardEvent) {
      if (CONTROL_KEYS.includes(e.key)) {
        e.preventDefault();
        keys[e.key] = true;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (CONTROL_KEYS.includes(e.key)) e.preventDefault();
      keys[e.key] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const paddle = {
      x: (W - PADDLE_W) / 2,
      y: PADDLE_Y,
      w: PADDLE_W,
      h: PADDLE_H,
    };
    const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };
    let blocks: Block[] = [];
    let particles: Particle[] = [];
    let score = 0;
    let lives = 3;
    let level = 1;
    let state: GamePhase = "playing";
    let gameOverReported = false;

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

    function initBall() {
      const speed = LEVELS[level - 1].speed;
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * speed;
      ball.vy = BASE_BALL_VY * speed;
    }

    function loadLevel(n: number) {
      level = n;
      const lvl = LEVELS[n - 1];
      blocks = lvl.blocks.map((b) => ({
        x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
        y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: b.color,
        alive: true,
      }));
      initBall();
    }

    function explode(x: number, y: number, color: string) {
      for (let i = 0; i < 8; i++) particles.push(new Particle(x, y, color));
    }

    function initGame() {
      paddle.x = (W - paddle.w) / 2;
      particles = [];
      score = 0;
      lives = 3;
      state = "playing";
      gameOverReported = false;
      loadLevel(1);
      reportState();
    }

    function update(dt: number) {
      if (forceEndRef.current) {
        forceEndRef.current = false;
        state = "gameover";
      }

      if (state === "gameover") {
        reportState();
        if (!gameOverReported) {
          gameOverReported = true;
          onGameOverRef.current(score);
        }
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }

      if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
      if (keys.ArrowRight)
        paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + ball.w >= W) {
        ball.x = W - ball.w;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
      }

      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h;
        ball.vy = -Math.abs(ball.vy);
      }

      for (const block of blocks) {
        if (!block.alive) continue;
        if (collideAABB(ball, block)) {
          block.alive = false;
          explode(
            block.x + block.w / 2,
            block.y + block.h / 2,
            BLOCK_COLORS[block.color],
          );
          score += 10;
          ball.vy = -ball.vy;
          if (blocks.every((b) => !b.alive)) {
            if (level < 5) loadLevel(level + 1);
            else state = "gameover";
          }
          break;
        }
      }

      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);

      if (ball.y > H) {
        lives--;
        if (lives <= 0) {
          lives = 0;
          state = "gameover";
        } else {
          initBall();
        }
      }

      reportState();
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      for (const block of blocks) {
        if (!block.alive) continue;
        const color = BLOCK_COLORS[block.color];
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);
        ctx.shadowBlur = 0;
      }

      particles.forEach((p) => p.draw(ctx));

      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#00f5ff";
      ctx.shadowBlur = 8;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        ball.x + ball.w / 2,
        ball.y + ball.h / 2,
        ball.w / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let lastTime: number | null = null;
    let rafId: number;

    function loop(ts: number) {
      if (pausedRef.current) {
        lastTime = null;
      } else {
        const dt =
          lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
        lastTime = ts;
        update(dt);
      }
      draw();
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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

export default forwardRef<BloqueBusterHandle, BloqueBusterProps>(BloqueBuster);
