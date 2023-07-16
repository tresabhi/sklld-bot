import { REGION_NAMES, Region } from '../../constants/regions';
import { TanksStats } from '../../types/tanksStats';
import { secrets } from '../node/secrets';
import throwError from '../node/throwError';
import getWargamingResponse from './getWargamingResponse';

export default async function getTankStats(server: Region, id: number) {
  const tankStats = await getWargamingResponse<TanksStats>(
    `https://api.wotblitz.${server}/wotb/tanks/stats/?application_id=${secrets.WARGAMING_APPLICATION_ID}&account_id=${id}`,
  );

  if (tankStats[id] === null) {
    throw throwError(
      'No tank stats available',
      `Wargaming says there is no tank stats for this account. This account may not have any battles/tanks or exist in the ${REGION_NAMES[server]} server.`,
    );
  }

  return tankStats[id];
}
