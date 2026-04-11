import type { TimeGrain } from "@workspace/types";

export interface NetWorthDataPoint {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

function randomWalk(start: number, steps: number, volatility: number): number[] {
  const values = [start];
  for (let i = 1; i < steps; i++) {
    const change = (Math.random() - 0.4) * volatility;
    values.push(Math.round((values[i - 1] + change) * 100) / 100);
  }
  return values;
}

function formatDate(d: Date, grain: TimeGrain): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (grain === "yearly" || grain === "all") {
    return String(d.getFullYear());
  }
  if (grain === "monthly") {
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  // weekly
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function generateDummyData(grain: TimeGrain): NetWorthDataPoint[] {
  let count: number;
  let stepMs: number;

  switch (grain) {
    case "weekly":
      count = 26; // ~6 months of weeks
      stepMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case "monthly":
      count = 12;
      stepMs = 30 * 24 * 60 * 60 * 1000;
      break;
    case "yearly":
      count = 5;
      stepMs = 365 * 24 * 60 * 60 * 1000;
      break;
    case "all":
      count = 8;
      stepMs = 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      count = 12;
      stepMs = 30 * 24 * 60 * 60 * 1000;
  }

  const now = Date.now();
  const startDate = now - (count - 1) * stepMs;
  const assets = randomWalk(85000, count, 3000);
  const liabilities = randomWalk(32000, count, 1200);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(startDate + i * stepMs);
    return {
      date: formatDate(d, grain),
      assets: assets[i],
      liabilities: liabilities[i],
      netWorth: Math.round((assets[i] - liabilities[i]) * 100) / 100,
    };
  });
}
