"use client";

import { SKIN_ACCENTS, SKIN_IDS, SKIN_LABELS } from "@/lib/skins";
import type { SkinId } from "@/lib/skins";

interface SkinPickerProps {
  value: SkinId;
  onChange: (skin: SkinId) => void;
}

/**
 * Mando de tubo del mueble: cada chip muestra la paleta que selecciona
 * (tres puntos con sus colores) y el activo se enciende con su propio acento.
 */
export default function SkinPicker({ value, onChange }: SkinPickerProps) {
  return (
    <div className="skin-picker" role="group" aria-label="Paleta del juego">
      <span className="skin-picker-label">Tubo</span>
      {SKIN_IDS.map((id) => {
        const accents = SKIN_ACCENTS[id];
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            className={`skin-chip${active ? " active" : ""}`}
            style={{ "--skin-accent": accents[0] } as React.CSSProperties}
            aria-pressed={active}
            onClick={() => onChange(id)}
          >
            <span className="skin-swatches" aria-hidden="true">
              {accents.map((color) => (
                <span
                  key={color}
                  className="skin-swatch"
                  style={{ background: color }}
                />
              ))}
            </span>
            {SKIN_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
