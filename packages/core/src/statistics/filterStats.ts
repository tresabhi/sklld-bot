import { DiffedTankStats } from '../../../bot/src/core/blitzstars/getStatsInPeriod';
import { SupplementaryStats } from '../../../website/src/core/blitz/getAccountInfo';
import { tankAverages } from '../../../website/src/core/blitzstars/tankAverages';
import { tankDefinitions, TreeType } from '../blitzkit/tankDefinitions';
import calculateWN8 from './calculateWN8';
import sumStats from './sumStats';

export interface StatFilters {
  nation?: string;
  tier?: number;
  tankType?: string;
  treeType?: TreeType;
  tank?: number;
}

export async function filterStats(
  { diff, order }: DiffedTankStats,
  filters: StatFilters,
) {
  // tank, if provided, takes priority over all other filters
  if (filters.tank) filters = { tank: filters.tank };

  const awaitedTankDefinitions = await tankDefinitions;
  const awaitedTankAverages = await tankAverages;
  const filteredOrder = order.filter((id) => {
    const entry = awaitedTankDefinitions[id];

    return (
      entry &&
      (filters.nation === undefined || entry.nation === filters.nation) &&
      (filters.tier === undefined || entry.tier === filters.tier) &&
      (filters.tankType === undefined || entry.class === filters.tankType) &&
      (filters.treeType === undefined ||
        (filters.treeType === 'collector' && entry.treeType === 'collector') ||
        (filters.treeType === 'premium' && entry.treeType === 'premium') ||
        (filters.treeType === 'researchable' &&
          entry.treeType === 'researchable')) &&
      (filters.tank === undefined || entry.id === filters.tank)
    );
  });
  const stats = sumStats(filteredOrder.map((id) => diff[id]));
  const battlesOfTanksWithAverages = filteredOrder.reduce<number>(
    (accumulator, id) =>
      awaitedTankAverages[id] ? accumulator + diff[id].battles : accumulator,
    0,
  );
  const battlesOfTanksWithTankDefinition = filteredOrder.reduce<number>(
    (accumulator, id) =>
      awaitedTankDefinitions[id] ? accumulator + diff[id].battles : accumulator,
    0,
  );
  const supplementary = {
    WN8:
      filteredOrder.reduce<number>(
        (accumulator, id) =>
          awaitedTankAverages[id]
            ? accumulator +
              calculateWN8(awaitedTankAverages[id].all, diff[id]) *
                diff[id].battles
            : accumulator,
        0,
      ) / battlesOfTanksWithAverages,
    tier:
      filteredOrder.reduce<number>(
        (accumulator, id) =>
          awaitedTankDefinitions[id]
            ? accumulator + awaitedTankDefinitions[id]!.tier * diff[id].battles
            : accumulator,
        0,
      ) / battlesOfTanksWithTankDefinition,
  } satisfies SupplementaryStats;

  return { stats, supplementary, filteredOrder };
}
