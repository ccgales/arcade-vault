"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const W = 800;
const H = 600;

const COLS = 10;
const ROWS = 20;
const BLOCK = 24;

const BOARD_X = 90;
const BOARD_Y = 60;

const NEXT_LABEL_X = 430;
const NEXT_LABEL_Y = 108;
const NEXT_BOX_X = 430;
const NEXT_BOX_Y = 130;
const NEXT_BOX_SIZE = 140;
const NEXT_CELL = NEXT_BOX_SIZE / 4;

const COLORS: Array<string | null> = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca
];

const PIECES: number[][][] = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const CONTROL_KEYS = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyX",
  "Space",
];

type Board = number[][];
type Piece = { type: number; shape: number[][]; x: number; y: number };
type GamePhase = "playing" | "gameover";

export interface TetrisState {
  score: number;
  lives: number;
  level: number;
}

export interface TetrisProps {
  paused: boolean;
  onStateChange: (state: TetrisState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface TetrisHandle {
  endGame: () => void;
}

function Tetris(
  { paused, onStateChange, onGameOver }: TetrisProps,
  ref: React.Ref<TetrisHandle>,
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

    function createBoard(): Board {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 8) + 1;
      const shape = PIECES[type].map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number): boolean {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]): number[][] {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array(rows).fill(0),
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += (LINE_SCORES[cleared] || 0) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }

    function ghostY(): number {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) {
        phase = "gameover";
      }
    }

    function drawBlock(
      px: number,
      py: number,
      colorIndex: number,
      size: number,
      alpha = 1,
    ) {
      if (!colorIndex) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[colorIndex] as string;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(px + 1, py + 1, size - 2, 4);
      ctx.globalAlpha = 1;
    }

    function drawBoardPanel() {
      ctx.save();
      ctx.translate(BOARD_X, BOARD_Y);

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          drawBlock(c * BLOCK, r * BLOCK, board[r][c], BLOCK);

      const gy = ghostY();
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              (current.x + c) * BLOCK,
              (gy + r) * BLOCK,
              current.shape[r][c],
              BLOCK,
              0.2,
            );

      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          drawBlock(
            (current.x + c) * BLOCK,
            (current.y + r) * BLOCK,
            current.shape[r][c],
            BLOCK,
          );

      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
      ctx.restore();
    }

    function drawNextPanel() {
      ctx.save();
      ctx.fillStyle = "#0ff";
      ctx.font = "16px monospace";
      ctx.textAlign = "left";
      ctx.fillText("SIGUIENTE", NEXT_LABEL_X, NEXT_LABEL_Y);

      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(NEXT_BOX_X, NEXT_BOX_Y, NEXT_BOX_SIZE, NEXT_BOX_SIZE);

      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(
            NEXT_BOX_X + (offX + c) * NEXT_CELL,
            NEXT_BOX_Y + (offY + r) * NEXT_CELL,
            shape[r][c],
            NEXT_CELL,
          );
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      drawBoardPanel();
      drawNextPanel();
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
      switch (e.code) {
        case "ArrowLeft":
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case "ArrowRight":
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case "ArrowDown":
          softDrop();
          break;
        case "ArrowUp":
        case "KeyX":
          tryRotate();
          break;
        case "Space":
          hardDrop();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    const board: Board = createBoard();
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropAccum = 0;
    let dropInterval = 1000;
    let phase: GamePhase = "playing";
    let gameOverReported = false;
    let next: Piece = randomPiece();
    let current: Piece = randomPiece();
    spawn();
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

      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(current.shape, current.x, current.y + 1)) {
          current.y++;
        } else {
          lockPiece();
        }
      }

      reportState();
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

export default forwardRef<TetrisHandle, TetrisProps>(Tetris);
