export const COLD_DAYS_THRESHOLD = 30;

export const COLD_LABEL = `Sin actividad hace más de ${COLD_DAYS_THRESHOLD} días`;

export type ColdState = {
  isCold: boolean;
  lastActivityAt: Date | null;
  daysSinceActivity: number | null;
};

export function computeCold(
  lastActivityAt: Date | null | undefined,
  now: Date = new Date()
): ColdState {
  if (!lastActivityAt) {
    return { isCold: false, lastActivityAt: null, daysSinceActivity: null };
  }
  const days = Math.floor(
    (now.getTime() - new Date(lastActivityAt).getTime()) / 86_400_000
  );
  return {
    isCold: days >= COLD_DAYS_THRESHOLD,
    lastActivityAt: new Date(lastActivityAt),
    daysSinceActivity: days,
  };
}

export const VALUATION_BANDS = {
  greenMax: 10,
  yellowMax: 25,
} as const;

export type TrafficLight = "GREEN" | "YELLOW" | "RED" | null;

export function trafficLightFor(deviationPct: number | null): TrafficLight {
  if (deviationPct === null) return null;
  const abs = Math.abs(deviationPct);
  if (abs <= VALUATION_BANDS.greenMax) return "GREEN";
  if (abs <= VALUATION_BANDS.yellowMax) return "YELLOW";
  return "RED";
}