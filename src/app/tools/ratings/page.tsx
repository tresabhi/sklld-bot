'use client';

import {
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import {
  Button,
  Dialog,
  Flex,
  Select,
  Text,
  TextField,
} from '@radix-ui/themes';
import { produce } from 'immer';
import { debounce, findLastIndex, range } from 'lodash';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { create } from 'zustand';
import * as Leaderboard from '../../../components/Leaderboard';
import PageWrapper from '../../../components/PageWrapper';
import { LEAGUES } from '../../../constants/leagues';
import { FIRST_ARCHIVED_RATINGS_SEASON } from '../../../constants/ratings';
import { REGIONS, REGION_NAMES, Region } from '../../../constants/regions';
import { WARGAMING_APPLICATION_ID } from '../../../constants/wargamingApplicationID';
import fetchBlitz from '../../../core/blitz/fetchBlitz';
import { getAccountInfo } from '../../../core/blitz/getAccountInfo';
import { getClanAccountInfo } from '../../../core/blitz/getClanAccountInfo';
import getRatingsInfo from '../../../core/blitz/getRatingsInfo';
import { AccountList } from '../../../core/blitz/searchPlayersAcrossRegions';
import { getArchivedLatestSeasonNumber } from '../../../core/blitzkrieg/getArchivedLatestSeasonNumber';
import getArchivedRatingsInfo from '../../../core/blitzkrieg/getArchivedRatingsInfo';
import { getArchivedRatingsLeaderboard } from '../../../core/blitzkrieg/getArchivedRatingsLeaderboard';
import { noArrows } from './page.css';

const ROWS_OPTIONS = [5, 10, 25, 50, 100];

type UsernameCache = Record<Region, Record<number, string | null>>;
type ClanCache = Record<Region, Record<number, string | undefined>>;

const useUsernameCache = create<UsernameCache>(() => ({
  asia: {},
  com: {},
  eu: {},
}));
const useClanCache = create<ClanCache>(() => ({
  asia: {},
  com: {},
  eu: {},
}));

export default function Page() {
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[2]);
  const usernameCache = useUsernameCache();
  const clanCache = useClanCache();
  const [region, setRegion] = useState<Region>('com');
  // null being the latest season
  const [season, setSeason] = useState<null | number>(null);
  const { data: ratingsInfo } = useSWR(
    `ratings-info-${region}-${season}`,
    () =>
      season === null
        ? getRatingsInfo(region)
        : getArchivedRatingsInfo(region, season),
  );
  const [jumpToLeague, setJumpToLeague] = useState(0);
  const { data: latestArchivedSeasonNumber } = useSWR<number>(
    getArchivedLatestSeasonNumber.name,
    getArchivedLatestSeasonNumber,
  );
  const players = useSWR(`ratings-players-${region}-${season}`, () => {
    if (season === null) {
      // i'll deal with this later
      return null;
    } else {
      return getArchivedRatingsLeaderboard(region, season);
    }
  });
  const [page, setPage] = useState(0);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(
    null,
  );
  const playerSlice = players.data?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );
  const positionInput = useRef<HTMLInputElement>(null);
  const scoreInput = useRef<HTMLInputElement>(null);
  const previousPage = () => setPage((page) => Math.max(page - 1, 0));
  const nextPage = () =>
    setPage((page) =>
      Math.min(page + 1, Math.floor((players.data?.length ?? 0) / rowsPerPage)),
    );
  const [searchResults, setSearchResults] = useState<AccountList | undefined>(
    undefined,
  );
  const handleSearchPlayerChange = debounce(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const trimmedSearch = event.target.value.trim();

      if (trimmedSearch) {
        const encodedSearch = encodeURIComponent(trimmedSearch);
        const accountList = await fetchBlitz<AccountList>(
          `https://api.wotblitz.${region}/wotb/account/list/?application_id=${WARGAMING_APPLICATION_ID}&search=${encodedSearch}&limit=100`,
        );

        setSearchResults(
          accountList.filter(
            (searchedPlayer) =>
              players.data?.some(
                (leaderboardPlayer) =>
                  leaderboardPlayer.id === searchedPlayer.account_id,
              ),
          ),
        );
      } else {
        setSearchResults(undefined);
      }
    },
    500,
  );

  cachePage(page - 1);
  cachePage(page);
  cachePage(page + 1);

  function cachePage(page: number) {
    const ids = players.data
      ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map(({ id }) => id)
      .filter((id) => !(id in usernameCache[region]));

    if (ids && ids.length > 0) {
      getAccountInfo(region, ids).then((data) => {
        data.map((player, index) => {
          useUsernameCache.setState(
            produce((draft: UsernameCache) => {
              if (player) {
                draft[region][ids[index]] = player.nickname;
              } else {
                draft[region][ids[index]] = null;
              }
            }),
          );
        });
      });

      getClanAccountInfo(region, ids, ['clan']).then((data) => {
        data.map((player, index) => {
          useClanCache.setState(
            produce((draft: ClanCache) => {
              if (player) {
                draft[region][ids[index]] = player.clan?.tag;
              }
            }),
          );
        });
      });
    }
  }
  const handleJumpToPosition = () => {
    if (!players.data) return;

    const rawPosition = positionInput.current!.valueAsNumber - 1;
    const position = Math.max(
      0,
      Math.min(rawPosition, (players.data?.length ?? 0) - 1),
    );
    setPage(Math.floor(position / rowsPerPage));

    if (players.data) {
      setHighlightedPlayerId(players.data[position].id);
    }
  };
  const [jumpToPositionOpen, setJumpToPositionOpen] = useState(false);
  const handleJumpToScore = () => {
    if (!players.data) return;

    const playerIndex = findLastIndex(players.data, (player) => {
      return player.score >= scoreInput.current!.valueAsNumber;
    });

    if (playerIndex === -1) return;

    setPage(Math.floor(playerIndex / rowsPerPage));

    if (players.data) {
      setHighlightedPlayerId(players.data[playerIndex].id);
    }
  };
  const [jumpToScoreOpen, setJumpToScoreOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [season, region]);

  function PageTurner() {
    const pageInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (pageInput.current) pageInput.current.value = `${page + 1}`;
    }, [page]);

    return (
      <Flex justify="center" wrap="wrap" gap="2">
        <Flex gap="2">
          <Button variant="soft" onClick={previousPage}>
            <CaretLeftIcon />
          </Button>
          <TextField.Root className={noArrows}>
            <TextField.Slot>Page</TextField.Slot>
            <TextField.Input
              className={noArrows}
              type="number"
              ref={pageInput}
              style={{ width: 64, textAlign: 'center' }}
              onBlur={(event) => {
                setPage(
                  Math.max(
                    0,
                    Math.min(
                      Math.floor((players.data?.length ?? 0) / rowsPerPage),
                      event.target.valueAsNumber - 1,
                    ),
                  ),
                );
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  (event.target as HTMLInputElement).blur();
                }
              }}
            />
            <TextField.Slot>
              out of {Math.ceil((players.data?.length ?? 0) / rowsPerPage)}
            </TextField.Slot>
          </TextField.Root>
          <Button variant="soft" onClick={nextPage}>
            <CaretRightIcon />
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <PageWrapper color="orange">
      <Flex gap="4" wrap="wrap" justify="center">
        <Flex gap="2">
          <Select.Root
            defaultValue={region}
            onValueChange={(value) => setRegion(value as Region)}
          >
            <Select.Trigger style={{ flex: 1 }} />

            <Select.Content>
              {REGIONS.map((region) => (
                <Select.Item key={region} value={region}>
                  {REGION_NAMES[region]}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Select.Root
            value={`${season}`}
            onValueChange={(value) =>
              setSeason(value === 'null' ? null : parseInt(value))
            }
          >
            <Select.Trigger style={{ flex: 1 }} />

            <Select.Content>
              {ratingsInfo?.detail === undefined && (
                <Select.Item value="null">Current season</Select.Item>
              )}

              <Select.Group>
                <Select.Label>Archives</Select.Label>

                {latestArchivedSeasonNumber &&
                  range(
                    FIRST_ARCHIVED_RATINGS_SEASON,
                    latestArchivedSeasonNumber + 1,
                  )
                    .map((season) => (
                      <Select.Item key={season} value={`${season}`}>
                        Season {season}
                      </Select.Item>
                    ))
                    .reverse()}
              </Select.Group>
            </Select.Content>
          </Select.Root>

          <Select.Root
            onValueChange={(value) => setRowsPerPage(parseInt(value))}
            defaultValue={`${rowsPerPage}`}
          >
            <Select.Trigger />

            <Select.Content>
              {ROWS_OPTIONS.map((size) => (
                <Select.Item value={`${size}`} key={size}>
                  {size} per page
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex gap="3" justify="center" wrap="wrap" align="center">
          <Text>Jump to:</Text>
          <Dialog.Root open={jumpToScoreOpen} onOpenChange={setJumpToScoreOpen}>
            <Dialog.Trigger>
              <Button variant="ghost">Score</Button>
            </Dialog.Trigger>

            <Dialog.Content>
              <Flex gap="4" justify="center">
                <TextField.Input
                  ref={scoreInput}
                  onChange={handleSearchPlayerChange}
                  type="number"
                  placeholder="Type a score..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleJumpToScore();
                      setJumpToScoreOpen(false);
                    }
                  }}
                />

                <Flex gap="2">
                  <Dialog.Close>
                    <Button color="red">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button onClick={handleJumpToScore}>Jump</Button>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
          <Dialog.Root
            open={jumpToPositionOpen}
            onOpenChange={setJumpToPositionOpen}
          >
            <Dialog.Trigger>
              <Button variant="ghost">Position</Button>
            </Dialog.Trigger>

            <Dialog.Content>
              <Flex gap="4" justify="center">
                <TextField.Input
                  ref={positionInput}
                  onChange={handleSearchPlayerChange}
                  type="number"
                  placeholder="Type a position..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleJumpToPosition();
                      setJumpToPositionOpen(false);
                    }
                  }}
                />

                <Flex gap="2">
                  <Dialog.Close>
                    <Button color="red">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button onClick={handleJumpToPosition}>Jump</Button>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
          <Dialog.Root>
            <Dialog.Trigger>
              <Button variant="ghost">League</Button>
            </Dialog.Trigger>

            <Dialog.Content>
              <Flex gap="2" justify="center">
                <Select.Root
                  value={`${jumpToLeague}`}
                  onValueChange={(value) => setJumpToLeague(parseInt(value))}
                >
                  <Select.Trigger />

                  <Select.Content>
                    {ratingsInfo?.detail === undefined &&
                      ratingsInfo?.leagues.map(({ index, title }) => (
                        <Select.Item key={index} value={`${index}`}>
                          {title}
                        </Select.Item>
                      ))}
                  </Select.Content>
                </Select.Root>

                <Flex gap="2">
                  <Dialog.Close>
                    <Button color="red">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button
                      onClick={() => {
                        if (!ratingsInfo || ratingsInfo.detail || !players.data)
                          return;

                        const minScore =
                          LEAGUES[jumpToLeague - 1]?.minScore ?? Infinity;
                        const firstPlayerIndex = players.data.findIndex(
                          (player) => player.score < minScore,
                        );

                        if (firstPlayerIndex === -1) return;

                        setPage(Math.floor(firstPlayerIndex / rowsPerPage));
                        setHighlightedPlayerId(
                          players.data[firstPlayerIndex].id,
                        );
                      }}
                    >
                      Jump
                    </Button>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
          <Dialog.Root>
            <Dialog.Trigger>
              <Button variant="ghost">Player</Button>
            </Dialog.Trigger>

            <Dialog.Content>
              <Flex gap="4" direction="column">
                <TextField.Root>
                  <TextField.Slot>
                    <MagnifyingGlassIcon height="16" width="16" />
                  </TextField.Slot>

                  <TextField.Input
                    onChange={handleSearchPlayerChange}
                    placeholder="Search for player..."
                  />
                </TextField.Root>

                <Flex direction="column" gap="2">
                  {searchResults?.map((player) => (
                    <Dialog.Close>
                      <Button
                        key={player.account_id}
                        variant="ghost"
                        onClick={() => {
                          const playerIndex = players.data?.findIndex(
                            (playerData) => playerData.id === player.account_id,
                          );
                          const playerPage = Math.floor(
                            playerIndex! / rowsPerPage,
                          );

                          setPage(playerPage);
                          setHighlightedPlayerId(player.account_id);
                        }}
                      >
                        {player.nickname}
                      </Button>
                    </Dialog.Close>
                  ))}

                  {searchResults?.length === 0 && (
                    <Button disabled variant="ghost">
                      No players found in leaderboard
                    </Button>
                  )}
                </Flex>

                <Flex gap="2">
                  <Dialog.Close>
                    <Button color="red">Cancel</Button>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </Flex>

      <PageTurner />

      <Leaderboard.Root>
        {players.isLoading ? (
          <Leaderboard.Gap message="Loading players..." />
        ) : (
          playerSlice?.map((player, index) => (
            <Leaderboard.Item
              nickname={
                usernameCache[region][player.id] === null
                  ? `Deleted player ${player.id}`
                  : usernameCache[region][player.id]
                  ? usernameCache[region][player.id]!
                  : `Loading player ${player.id}...`
              }
              position={page * rowsPerPage + index + 1}
              score={player.score}
              clan={clanCache[region][player.id]}
              key={player.id}
              highlight={highlightedPlayerId === player.id}
            />
          ))
        )}
      </Leaderboard.Root>

      <PageTurner />
    </PageWrapper>
  );
}
