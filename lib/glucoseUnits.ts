export const GLUCOSE_UNITS = ["mg/dL", "g/L", "mmol/L"] as const;

export type GlucoseUnit = (typeof GLUCOSE_UNITS)[number];

export function estUniteGlycemie(value: unknown): value is GlucoseUnit {
  return typeof value === "string" && GLUCOSE_UNITS.includes(value as GlucoseUnit);
}

export function convertirEnMgDl(value: number, unit: GlucoseUnit): number {
  if (!Number.isFinite(value)) return Number.NaN;

  const converted = unit === "g/L"
    ? value * 100
    : unit === "mmol/L"
      ? value * 18.0182
      : value;

  return Math.round(converted * 10) / 10;
}

export function exemplePourUnite(unit: GlucoseUnit): string {
  if (unit === "g/L") return "1,20";
  if (unit === "mmol/L") return "6,7";
  return "120";
}
