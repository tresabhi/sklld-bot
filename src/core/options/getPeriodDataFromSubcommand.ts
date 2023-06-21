import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import getPeriodNow from '../blitzstars/getPeriodNow.js';
import getPeriodStart from '../blitzstars/getPeriodStart.js';
import getTimeDaysAgo from '../blitzstars/getTimeDaysAgo.js';
import { Period } from './addPeriodSubCommands.js';

export const PERIOD_NAMES: Record<Period, string> = {
  today: "Today's statistics",
  '30': "30 days' statistics",
  '60': "60 days' statistics",
  '90': "90 days' statistics",
  career: 'Career statistics',
  custom: 'Custom period',
};

export const EVOLUTION_PERIOD_NAMES: Record<Period, string> = {
  today: "Today's evolution",
  '30': "30 days' evolution",
  '60': "60 days' evolution",
  '90': "90 days' evolution",
  career: 'Career evolution',
  custom: 'Custom period',
};

export default function getPeriodDataFromSubcommand(
  interaction: ChatInputCommandInteraction<CacheType>,
) {
  const period = interaction.options.getSubcommand(true) as Period;
  let statsName: string;
  let evolutionName: string;
  let start: number;
  let end: number;

  if (period === 'custom') {
    const startRaw = interaction.options.getInteger('start')!;
    const endRaw = interaction.options.getInteger('end')!;
    const startMin = Math.min(startRaw, endRaw);
    const endMax = Math.max(startRaw, endRaw);

    statsName = `${startMin} to ${endMax} days' statistics`;
    evolutionName = `${startMin} to ${endMax} days' evolution`;
    start = getTimeDaysAgo(startMin);
    end = getTimeDaysAgo(endMax);
  } else {
    statsName = PERIOD_NAMES[period];
    evolutionName = EVOLUTION_PERIOD_NAMES[period];
    start = getPeriodStart(period);
    end = getPeriodNow();
  }

  return { statsName, evolutionName, start, end };
}
