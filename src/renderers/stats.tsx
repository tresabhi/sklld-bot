import AllStatsOverview from '../components/AllStatsOverview';
import NoData, { NoDataType } from '../components/NoData';
import PoweredBy, { PoweredByType } from '../components/PoweredBy';
import { TierWeightsRecord } from '../components/TierWeights';
import TitleBar from '../components/TitleBar';
import Wrapper from '../components/Wrapper';
import { REGION_NAMES } from '../constants/regions';
import calculateWN8 from '../core/blitz/calculateWN8';
import getWargamingResponse from '../core/blitz/getWargamingResponse';
import resolveTankName from '../core/blitz/resolveTankName';
import sumStats from '../core/blitz/sumStats';
import { Tier, tankopedia } from '../core/blitz/tankopedia';
import getDiffedTankStats from '../core/blitzstars/getDiffedTankStats';
import { tankAverages } from '../core/blitzstars/tankAverages';
import { ResolvedPeriod } from '../core/discord/resolvePeriodFromCommand';
import { ResolvedPlayer } from '../core/discord/resolvePlayerFromCommand';
import { secrets } from '../core/node/secrets';
import { theme } from '../stitches.config';
import {
  AccountInfo,
  AllStats,
  SupplementaryStats,
} from '../types/accountInfo';
import { PlayerClanData } from '../types/playerClanData';
import { PossiblyPromise } from '../types/possiblyPromise';

export type StatType = 'player' | 'tank';

export default async function stats<Type extends StatType>(
  type: Type,
  { start, end, statsName }: ResolvedPeriod,
  { region: server, id }: ResolvedPlayer,
  tankId: Type extends 'tank' ? number : null,
  naked = false,
) {
  let nameDiscriminator: string | undefined;
  let image: string | undefined;

  if (type === 'player') {
    const clan = (
      await getWargamingResponse<PlayerClanData>(
        `https://api.wotblitz.${server}/wotb/clans/accountinfo/?application_id=${secrets.WARGAMING_APPLICATION_ID}&account_id=${id}&extra=clan`,
      )
    )[id]?.clan;

    if (clan) nameDiscriminator = `[${clan.tag}]`;
    image = clan
      ? `https://wotblitz-gc.gcdn.co/icons/clanEmblems1x/clan-icon-v2-${clan.emblem_set_id}.png`
      : undefined;
  } else if (type === 'tank') {
    nameDiscriminator = `(${await resolveTankName(tankId!)})`;
    image = (await tankopedia)[tankId!]?.images.normal;
  }

  const { diffed } = await getDiffedTankStats(server, id, start, end);
  let stats: AllStats | undefined;
  let supplementaryStats: SupplementaryStats;
  let tierWeights: TierWeightsRecord;

  if (type === 'player') {
    const entries = Object.entries(diffed);
    stats = sumStats(entries.map(([, stats]) => stats));
    const battlesOfTanksWithAverages = await entries.reduce<
      PossiblyPromise<number>
    >(async (accumulator, [tankIdString, stats]) => {
      const tankId = parseInt(tankIdString);
      const tankAverage = (await tankAverages)[tankId];

      return tankAverage ? (await accumulator) + stats.battles : accumulator;
    }, 0);
    const battlesOfTanksWithTankopediaEntry = await entries.reduce<
      PossiblyPromise<number>
    >(async (accumulator, [tankIdString, stats]) => {
      const tankId = parseInt(tankIdString);
      const tankopediaEntry = (await tankopedia)[tankId];

      return tankopediaEntry
        ? (await accumulator) + stats.battles
        : accumulator;
    }, 0);

    supplementaryStats = {
      WN8:
        (await entries.reduce<PossiblyPromise<number>>(
          async (accumulator, [tankIdString, stats]) => {
            const tankId = parseInt(tankIdString);
            const tankAverage = (await tankAverages)[tankId];

            return tankAverage
              ? (await accumulator) +
                  calculateWN8(tankAverage.all, stats) * stats.battles
              : accumulator;
          },
          0,
        )) / battlesOfTanksWithAverages,
      tier:
        (await entries.reduce<PossiblyPromise<number>>(
          async (accumulator, [tankIdString, stats]) => {
            const tankId = parseInt(tankIdString);
            const tankopediaEntry = (await tankopedia)[tankId];

            return tankopediaEntry
              ? (await accumulator) + tankopediaEntry.tier * stats.battles
              : accumulator;
          },
          0,
        )) / battlesOfTanksWithTankopediaEntry,
    };
    tierWeights = await entries.reduce<PossiblyPromise<TierWeightsRecord>>(
      async (accumulator, [tankIdString, stats]) => {
        const tankId = parseInt(tankIdString);
        const tankopediaEntry = (await tankopedia)[tankId];

        if (!tankopediaEntry) return accumulator;

        const tier = tankopediaEntry.tier as Tier;

        if ((await accumulator)[tier]) {
          (await accumulator)[tier]! += stats.battles;
        } else {
          (await accumulator)[tier] = stats.battles;
        }

        return accumulator;
      },
      {},
    );
  } else {
    stats = diffed[tankId!];

    supplementaryStats = {
      WN8: stats
        ? calculateWN8((await tankAverages)[tankId!].all, diffed[tankId!])
        : undefined,
      tier: (await tankopedia)[tankId!]?.tier,
    };
  }

  const accountInfo = await getWargamingResponse<AccountInfo>(
    `https://api.wotblitz.${server}/wotb/account/info/?application_id=${secrets.WARGAMING_APPLICATION_ID}&account_id=${id}`,
  );
  const overview = (
    <AllStatsOverview stats={stats} supplementaryStats={supplementaryStats} />
  );
  const footer = (
    <span
      style={{
        color: theme.colors.textLowContrast,
        fontSize: 16,
        display: 'flex',
        gap: 4,
      }}
    >
      <u>/statsfull</u> for all statistics
    </span>
  );

  return naked ? (
    <Wrapper naked>{overview}</Wrapper>
  ) : (
    <Wrapper>
      <TitleBar
        name={accountInfo[id].nickname}
        nameDiscriminator={nameDiscriminator}
        image={image}
        description={`${statsName} • ${new Date().toDateString()} • ${
          REGION_NAMES[server]
        }`}
      />

      {!stats?.battles && <NoData type={NoDataType.BattlesInPeriod} />}
      {stats?.battles > 0 && overview}

      <PoweredBy type={PoweredByType.BlitzStars} footer={footer} />
    </Wrapper>
  );
}
