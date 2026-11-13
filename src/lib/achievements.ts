import type { PlayerAchievement } from '../data/mockProfile';
import type { MyStats } from '../services/stats';

const ULTRA_KM = 500;

export function deriveAchievements(stats: MyStats): PlayerAchievement[] {
  const km = Math.floor(stats.totalDistanceKm || 0);
  const ultra = stats.totalDistanceKm >= ULTRA_KM;
  const explorer = stats.cellsOwned >= 25;
  return [
    { id: 'first-stride', name: 'First Stride', description: 'Complete your first run.', icon: 'footprints', unlocked: stats.runCount >= 1 },
    { id: 'groundbreaker', name: 'Groundbreaker', description: 'Own 1 km² of territory.', icon: 'territory', unlocked: stats.areaOwnedKm2 >= 1 },
    { id: 'explorer', name: 'Explorer', description: 'Own 25 territory cells.', icon: 'trophy', unlocked: explorer, progress: explorer ? undefined : `${stats.cellsOwned} / 25` },
    { id: 'ultra-runner', name: 'Ultra Runner', description: 'Reach 500 km total distance.', icon: 'distance', unlocked: ultra, progress: ultra ? undefined : `${km} / ${ULTRA_KM} km` },
  ];
}
