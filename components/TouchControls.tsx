"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { TOUCH_LAYOUTS } from "@/lib/touch-controls";
import type { TouchButtonSpec } from "@/lib/touch-controls";

interface TouchControlsProps {
  gameId: string;
  disabled?: boolean;
}

// Solo Tetris marca `repeat`: actúa una vez por keydown, así que sin repeat
// mover una pieza varias columnas exigiría un toque por columna.
const REPEAT_DELAY_MS = 170;
const REPEAT_INTERVAL_MS = 50;

// Los juegos escuchan `window`; BloqueBuster lee `e.key` y el resto `e.code`,
// así que el evento sintético lleva los dos campos.
function dispatchKey(type: "keydown" | "keyup", b: TouchButtonSpec) {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      code: b.code,
      key: b.key,
      bubbles: true,
      cancelable: true,
    }),
  );
}

export default function TouchControls({
  gameId,
  disabled = false,
}: TouchControlsProps) {
  // `TOUCH_LAYOUTS[gameId]` es siempre la misma referencia de array mientras
  // gameId no cambie (objeto de módulo), así que sirve como dependencia estable.
  const layout = TOUCH_LAYOUTS[gameId];

  // botón (por code) → pointerId que lo tiene apretado. Cada botón gestiona su
  // propio puntero, así que dos dedos en dos botones son dos pares independientes.
  const activePointers = useRef(new Map<string, number>());
  // code → { timeout: arranca el auto-repeat tras el delay inicial; interval: el
  // auto-repeat en sí, mientras el botón siga apretado }.
  const repeatTimers = useRef(
    new Map<string, { timeout?: number; interval?: number }>(),
  );
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());

  const setButtonPressed = (code: string, on: boolean) => {
    setPressed((prev) => {
      const next = new Set(prev);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
  };

  const stopRepeat = useCallback((code: string) => {
    const timers = repeatTimers.current.get(code);
    if (!timers) return;
    window.clearTimeout(timers.timeout);
    window.clearInterval(timers.interval);
    repeatTimers.current.delete(code);
  }, []);

  const startRepeat = (b: TouchButtonSpec) => {
    if (!b.repeat) return;
    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        dispatchKey("keydown", b);
      }, REPEAT_INTERVAL_MS);
      repeatTimers.current.set(b.code, { interval });
    }, REPEAT_DELAY_MS);
    repeatTimers.current.set(b.code, { timeout });
  };

  // Red de seguridad: suelta todos los botones apretados (keyup + fin de
  // repeat) sin esperar a un pointerup/pointercancel que puede no llegar.
  const releaseAll = useCallback(() => {
    if (activePointers.current.size === 0) return;
    activePointers.current.forEach((_pointerId, code) => {
      stopRepeat(code);
      const spec = layout?.find((b) => b.code === code);
      if (spec) dispatchKey("keyup", spec);
    });
    activePointers.current.clear();
    setPressed(new Set());
  }, [layout, stopRepeat]);

  // El navegador puede llevarse el puntero sin avisar (cambio de pestaña/app,
  // una llamada entrante): sin esto, una tecla quedaría marcada para siempre.
  useEffect(() => {
    const onBlur = () => releaseAll();
    const onVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseAll();
    };
  }, [releaseAll]);

  // Con la partida en pausa o en fin de juego, el pad no debe dejar ninguna
  // tecla marcada al otro lado de la pausa.
  useEffect(() => {
    if (disabled) releaseAll();
  }, [disabled, releaseAll]);

  if (!layout) return null;

  const handlePointerDown = (
    e: PointerEvent<HTMLButtonElement>,
    b: TouchButtonSpec,
  ) => {
    e.preventDefault();
    if (activePointers.current.has(b.code)) return;
    // Sin captura, un dedo que se desliza fuera del botón no entrega el
    // pointerup, el keyup nunca sale y la tecla queda marcada para siempre.
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointers.current.set(b.code, e.pointerId);
    dispatchKey("keydown", b);
    setButtonPressed(b.code, true);
    startRepeat(b);
  };

  // Sirve para pointerup y pointercancel: el navegador emite cancel cuando se
  // queda con el gesto (llamada entrante, gesto del sistema).
  const handlePointerEnd = (
    e: PointerEvent<HTMLButtonElement>,
    b: TouchButtonSpec,
  ) => {
    if (activePointers.current.get(b.code) !== e.pointerId) return;
    activePointers.current.delete(b.code);
    stopRepeat(b.code);
    dispatchKey("keyup", b);
    setButtonPressed(b.code, false);
  };

  const renderButton = (b: TouchButtonSpec) => (
    <button
      key={b.code}
      type="button"
      className={pressed.has(b.code) ? "touch-btn is-pressed" : "touch-btn"}
      data-cell={b.cell}
      aria-label={b.aria}
      disabled={disabled}
      onPointerDown={(e) => handlePointerDown(e, b)}
      onPointerUp={(e) => handlePointerEnd(e, b)}
      onPointerCancel={(e) => handlePointerEnd(e, b)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {b.label}
    </button>
  );

  const dpad = layout.filter((b) => b.group === "dpad");
  const actions = layout.filter((b) => b.group === "actions");

  return (
    <div
      className="touch-controls"
      role="group"
      aria-label="Controles táctiles"
    >
      <div className="touch-group touch-dpad">{dpad.map(renderButton)}</div>
      {actions.length > 0 && (
        <div className="touch-group touch-actions">
          {actions.map(renderButton)}
        </div>
      )}
    </div>
  );
}
