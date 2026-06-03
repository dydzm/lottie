import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { AnimationSlot } from "@/lib/lottie-player";

/** Presentation metadata for a slot, loaded from /controls.json. */
export interface ControlMeta {
  sid: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface PropertiesPanelProps {
  slots: AnimationSlot[];
  /** sid → metadata, merged onto each slot for labels and slider ranges. */
  meta: Record<string, ControlMeta>;
  onScalar: (id: string, value: number) => void;
  onColor: (id: string, rgba: [number, number, number, number]) => void;
  onVec2: (id: string, xy: [number, number]) => void;
  onText: (id: string, value: string) => void;
}

function labelFor(slot: AnimationSlot, meta?: ControlMeta): string {
  return meta?.label ?? slot.id;
}

// Color slots are RGBA 0..1; <input type="color"> works in #rrggbb hex, so we
// convert at the boundary and carry the slot's alpha through untouched.
function rgbToHex([r, g, b]: [number, number, number, number]): string {
  const h = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export function PropertiesPanel({
  slots,
  meta,
  onScalar,
  onColor,
  onVec2,
  onText,
}: PropertiesPanelProps) {
  // The slot's own value (from the player) is the baseline; we only track the
  // user's edits here, falling back to the baseline for anything untouched.
  // (Seeding state from the slots prop would go stale, since slots arrive empty
  // on first render and populate once the player loads.)
  const [edits, setEdits] = useState<Record<string, AnimationSlot["value"]>>({});

  if (slots.length === 0) return null;

  const set = (id: string, value: AnimationSlot["value"]) =>
    setEdits((v) => ({ ...v, [id]: value }));
  const values = Object.fromEntries(
    slots.map((s) => [s.id, edits[s.id] ?? s.value])
  );

  return (
    <Card className="pointer-events-auto w-72 gap-0 py-4 bg-card/80 backdrop-blur-md border-border/60 shadow-lg">
      <CardContent className="flex flex-col gap-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Properties
        </div>

        {slots.map((slot) => {
          const m = meta[slot.id];
          const label = labelFor(slot, m);

          if (slot.type === "scalar") {
            const value = values[slot.id] as number;
            const min = m?.min ?? 0;
            const max = m?.max ?? 100;
            const step = m?.step ?? ((max - min) / 100 || 1);
            return (
              <div key={slot.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">{label}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {Number(value.toFixed(2))}
                  </span>
                </div>
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={[value]}
                  onValueChange={([v]) => {
                    set(slot.id, v);
                    onScalar(slot.id, v);
                  }}
                  aria-label={label}
                />
              </div>
            );
          }

          if (slot.type === "color") {
            const value = values[slot.id] as [number, number, number, number];
            return (
              <div key={slot.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{label}</span>
                <input
                  type="color"
                  value={rgbToHex(value)}
                  onChange={(e) => {
                    const [r, g, b] = hexToRgb(e.target.value);
                    const rgba: [number, number, number, number] = [r, g, b, value[3]];
                    set(slot.id, rgba);
                    onColor(slot.id, rgba);
                  }}
                  className="h-8 w-12 cursor-pointer rounded-md border border-input bg-transparent"
                  aria-label={label}
                />
              </div>
            );
          }

          if (slot.type === "vec2") {
            const value = values[slot.id] as [number, number];
            const update = (i: 0 | 1, n: number) => {
              const next: [number, number] = i === 0 ? [n, value[1]] : [value[0], n];
              set(slot.id, next);
              onVec2(slot.id, next);
            };
            return (
              <div key={slot.id} className="flex flex-col gap-2">
                <span className="text-sm">{label}</span>
                <div className="flex gap-2">
                  {([0, 1] as const).map((i) => (
                    <Input
                      key={i}
                      type="number"
                      step={m?.step ?? 1}
                      value={value[i]}
                      onChange={(e) => update(i, Number(e.target.value))}
                      aria-label={`${label} ${i === 0 ? "x" : "y"}`}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // text
          const value = values[slot.id] as string;
          return (
            <div key={slot.id} className="flex flex-col gap-2">
              <span className="text-sm">{label}</span>
              <Input
                type="text"
                value={value}
                onChange={(e) => {
                  set(slot.id, e.target.value);
                  onText(slot.id, e.target.value);
                }}
                aria-label={label}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
