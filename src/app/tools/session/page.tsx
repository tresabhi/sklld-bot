'use client';

import { CopyIcon, PersonIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Button, DropdownMenu, TextField } from '@radix-ui/themes';
import { debounce } from 'lodash';
import { ChangeEvent, useRef, useState } from 'react';
import PageWrapper from '../../../components/PageWrapper';
import { REGION_NAMES, Region } from '../../../constants/regions';
import { WARGAMING_APPLICATION_ID } from '../../../constants/wargamingApplicationID';
import getWargamingResponse from '../../../core/blitz/getWargamingResponse';
import listPlayers, {
  AccountListWithServer,
} from '../../../core/blitz/listPlayers';
import { useSession } from '../../../stores/session';
import { NormalizedTankStats, TanksStats } from '../../../types/tanksStats';
import SessionPage from '../../embeds/session/page';
import * as styles from './page.css';

// 1 once per 5 seconds

export default function Page() {
  const input = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<
    AccountListWithServer | undefined
  >(undefined);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const handleChange = debounce(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value) {
        setSearchResults(await listPlayers(event.target.value));
      } else {
        setSearchResults(undefined);
        setShowSearchResults(false);
      }
    },
    500,
  );
  const session = useSession();

  async function setSession(region: Region, id: number, nickname: string) {
    input.current!.value = nickname;

    const rawTankStats = (
      await getWargamingResponse<TanksStats>(
        `https://api.wotblitz.${region}/wotb/tanks/stats/?application_id=${WARGAMING_APPLICATION_ID}&account_id=${id}`,
      )
    )[id];
    const tankStats = rawTankStats.reduce<NormalizedTankStats>(
      (accumulator, tank) => ({
        ...accumulator,
        [tank.tank_id]: tank,
      }),
      {},
    );

    useSession.setState({
      isTracking: true,
      id,
      region,
      nickname,
      tankStats,
      time: Date.now(),
    });
  }

  return (
    <PageWrapper>
      <div className={styles.toolBar}>
        <div style={{ flex: 1, boxSizing: 'border-box', position: 'relative' }}>
          <TextField.Root>
            <TextField.Slot>
              <PersonIcon height="16" width="16" />
            </TextField.Slot>

            <TextField.Input
              defaultValue={session.isTracking ? session.nickname : undefined}
              ref={input}
              onChange={(event) => {
                event.stopPropagation();

                if (event.target.value) {
                  setShowSearchResults(true);
                  setSearchResults(undefined);
                } else {
                  setShowSearchResults(false);
                }

                handleChange(event);
              }}
              onBlur={(event) => {
                // TODO: remove this hack when https://github.com/radix-ui/primitives/issues/2193 is fixed
                showSearchResults && event.target.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setShowSearchResults(false);
                  input.current?.blur();
                }
              }}
              placeholder="Search for a player..."
            />
          </TextField.Root>

          <DropdownMenu.Root open={showSearchResults} modal={false}>
            <DropdownMenu.Trigger>
              <div />
            </DropdownMenu.Trigger>

            <DropdownMenu.Content>
              {searchResults === undefined ? (
                <DropdownMenu.Item disabled>Searching...</DropdownMenu.Item>
              ) : searchResults.length === 0 ? (
                <DropdownMenu.Item disabled>No results</DropdownMenu.Item>
              ) : (
                searchResults?.map(
                  ({ account_id: id, nickname, region }, index) => (
                    <DropdownMenu.Item
                      key={id}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSession(region, id, nickname);
                      }}
                      shortcut={REGION_NAMES[region]}
                    >
                      {nickname}
                    </DropdownMenu.Item>
                  ),
                )
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            className={styles.toolbarButton}
            color="red"
            onClick={async () => {
              const session = useSession.getState();
              if (!session.isTracking) return;
              setSession(session.region, session.id, session.nickname);
            }}
          >
            <ReloadIcon width="16" height="16" /> Reset
          </Button>
          <Button
            className={styles.toolbarButton}
            onClick={() =>
              navigator.clipboard.writeText(`${location.origin}/embeds/session`)
            }
          >
            <CopyIcon width="16" height="16" /> Embed
          </Button>
        </div>
      </div>

      <SessionPage />
    </PageWrapper>
  );
}
