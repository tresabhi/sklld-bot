import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Region } from '../../constants/regions';
import getPeriodNow from '../blitzstars/getPeriodNow';
import getPeriodStart from '../blitzstars/getPeriodStart';
import getTimeDaysAgo from '../blitzstars/getTimeDaysAgo';
import { PeriodSize, PeriodType } from '../discord/addPeriodSubCommands';

export function getPeriodOptionName(period: PeriodSize) {
  return period === 'career' ? 'Career' : `${period}-day`;
}

export interface ResolvedPeriod {
  statsName: string;
  evolutionName: string;
  start: number;
  end: number;
}

export default function resolvePeriodFromCommand(
  region: Region,
  interaction: ChatInputCommandInteraction<CacheType>,
) {
  let statsName: string;
  let evolutionName: string;
  let start: number;
  let end: number;
  const periodSubcommand = interaction.options.getSubcommand() as PeriodType;
  const periodOption = interaction.options.getString('period') as PeriodSize;

  if (periodSubcommand === 'custom') {
    const startRaw = interaction.options.getInteger('start', true);
    const endRaw = interaction.options.getInteger('end', true);
    const startDaysAgoMin = Math.min(startRaw, endRaw);
    const endDaysAgoMax = Math.max(startRaw, endRaw);

    statsName = `${startDaysAgoMin} to ${endDaysAgoMax} days' statistics`;
    evolutionName = `${startDaysAgoMin} to ${endDaysAgoMax} days' evolution`;
    start = getTimeDaysAgo(region, endDaysAgoMax);
    end = getTimeDaysAgo(region, startDaysAgoMin);
  } else {
    statsName = `${getPeriodOptionName(periodOption)} Statistics`;
    evolutionName = `${getPeriodOptionName(periodOption)} Evolution`;
    start = getPeriodStart(region, periodOption);
    end = getPeriodNow();
  }

  return {
    statsName,
    evolutionName,
    start,
    end,
  } satisfies ResolvedPeriod;
}
