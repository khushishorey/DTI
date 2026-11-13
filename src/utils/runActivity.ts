import { getHexagonAreaAvg } from 'h3-js';
import { Colors } from '../constants/theme';
import { TERRITORY_RESOLUTION } from '../lib/h3';
import type { RecentRun } from '../services/runs';
import { rejectReasonMessage } from '../services/runs';

const AVG_CELL_KM2 = getHexagonAreaAvg(TERRITORY_RESOLUTION, 'km2');

export interface ActivityRowData {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  distanceKm: number;
  territoryKm2: number;
  color: string;
}

/** Turn a saved run into the Profile "Recent activity" row. */
export function runToActivity(run: RecentRun, now = new Date()): ActivityRowData {
  const started = new Date(run.started_at);
  const minutes = Math.max(1, Math.round(run.duration_s / 60));
  const rejected = run.status === 'rejected';
  return {
    id: run.id,
    title: `${timeOfDay(started)} run`,
    subtitle: rejected
      ? `Didn’t count · ${rejectReasonMessage(run.reject_reason).replace(/[.,].*$/, '')}`
      : `${run.cells_captured} ${run.cells_captured === 1 ? 'cell' : 'cells'} · ${minutes} min · +${run.xp_earned} XP`,
    date: relativeDate(started, now),
    distanceKm: run.distance_m / 1000,
    territoryKm2: rejected ? 0 : run.cells_captured * AVG_CELL_KM2,
    color: rejected ? Colors.danger : Colors.primary,
  };
}

function timeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
}

function relativeDate(date: Date, now: Date): string {
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 3600 * 1000;
  if (date.getTime() >= startOfToday) return `Today · ${time}`;
  if (date.getTime() >= startOfToday - dayMs) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}
