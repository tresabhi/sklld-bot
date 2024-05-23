import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { AlertDialog, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { go } from 'fuzzysort';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { isMobileOnly } from 'react-device-detect';
import { TreeType } from '../../../../../components/Tanks';
import { TANK_CLASSES } from '../../../../../components/Tanks/components/Item/constants';
import { resolveNearPenetration } from '../../../../../core/blitz/resolveNearPenetration';
import { modelDefinitions } from '../../../../../core/blitzkit/modelDefinitions';
import { normalizeBoundingBox } from '../../../../../core/blitzkit/normalizeBoundingBox';
import { resolveDpm } from '../../../../../core/blitzkit/resolveDpm';
import { resolveReload } from '../../../../../core/blitzkit/resolveReload';
import {
  NATIONS,
  TankDefinition,
  tanksDefinitionsArray,
} from '../../../../../core/blitzkit/tankDefinitions';
import { unionBoundingBox } from '../../../../../core/blitzkit/unionBoundingBox';
import mutateTankopediaPersistent, {
  SORT_NAMES,
  useTankopediaPersistent,
} from '../../../../../stores/tankopedia';
import { PageTurner } from '../PageTurner';
import { Options } from './components/Options';
import { Results } from './components/Results';
import { Sort } from './components/Sort';

interface TankSearchProps {
  compact?: boolean;
  onSelect?: (tank: TankDefinition) => void;
  onSelectAll?: (tanks: TankDefinition[]) => void;
}

const treeTypeOrder: TreeType[] = ['researchable', 'premium', 'collector'];

export function TankSearch({
  compact,
  onSelect = () => {},
  onSelectAll,
}: TankSearchProps) {
  const tanksPerPage = (compact ? 16 : 96) * (isMobileOnly ? 0.5 : 1);
  const nations = use(NATIONS);
  const filters = useTankopediaPersistent((state) => state.filters);
  const sort = useTankopediaPersistent((state) => state.sort);
  const awaitedTanks = use(tanksDefinitionsArray);
  const awaitedModelDefinitions = use(modelDefinitions);
  const defaultSortedTanks = useMemo(
    () =>
      awaitedTanks
        .sort(
          (a, b) =>
            (treeTypeOrder.indexOf(a.treeType) -
              treeTypeOrder.indexOf(b.treeType)) *
            (sort.direction === 'descending' ? -1 : 1),
        )
        .sort(
          (a, b) =>
            (TANK_CLASSES.indexOf(a.class) - TANK_CLASSES.indexOf(b.class)) *
            (sort.direction === 'descending' ? -1 : 1),
        )
        .sort(
          (a, b) =>
            (nations.indexOf(a.nation) - nations.indexOf(b.nation)) *
            (sort.direction === 'descending' ? -1 : 1),
        ),
    [],
  );
  const input = useRef<HTMLInputElement>(null);
  const searchableTanks = useMemo(() => {
    const filtered = defaultSortedTanks.filter(
      (tank) =>
        (filters.tiers.length === 0
          ? true
          : filters.tiers.includes(tank.tier)) &&
        (filters.types.length === 0
          ? true
          : filters.types.includes(tank.class)) &&
        (filters.treeTypes.length === 0
          ? true
          : filters.treeTypes.includes(tank.treeType)) &&
        (filters.nations.length === 0
          ? true
          : filters.nations.includes(tank.nation)) &&
        (filters.test === 'include'
          ? true
          : filters.test === 'exclude'
            ? !tank.testing
            : tank.testing),
    );
    let sorted: TankDefinition[] = [];

    switch (sort.by) {
      case 'meta.tier':
        sorted = filtered.sort((a, b) => a.tier - b.tier);
        break;

      case 'meta.name':
        sorted = filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;

      case 'survivability.health': {
        sorted = filtered.sort((a, b) => {
          const aHealth = a.health + a.turrets.at(-1)!.health;
          const bHealth = b.health + b.turrets.at(-1)!.health;

          return aHealth - bHealth;
        });
        break;
      }

      case 'survivability.viewRange':
        sorted = filtered.sort(
          (a, b) => a.turrets.at(-1)!.viewRange - b.turrets.at(-1)!.viewRange,
        );
        break;

      case 'survivability.camouflageStill':
        sorted = filtered.sort(
          (a, b) => a.camouflage.still - b.camouflage.still,
        );
        break;

      case 'survivability.camouflageMoving':
        sorted = filtered.sort(
          (a, b) => a.camouflage.moving - b.camouflage.moving,
        );
        break;

      case 'survivability.camouflageShooting':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.camouflageLoss -
            b.turrets.at(-1)!.guns.at(-1)!.camouflageLoss,
        );
        break;

      case 'survivability.volume':
        sorted = filtered.sort((a, b) => {
          const aTankModelDefinition = awaitedModelDefinitions[a.id];
          const bTankModelDefinition = awaitedModelDefinitions[b.id];
          const aTurretModelDefinition =
            aTankModelDefinition.turrets[a.turrets.at(-1)!.id];
          const bTurretModelDefinition =
            bTankModelDefinition.turrets[b.turrets.at(-1)!.id];
          const aSize = normalizeBoundingBox(
            unionBoundingBox(
              aTankModelDefinition.boundingBox,
              aTurretModelDefinition.boundingBox,
            ),
          );
          const bSize = normalizeBoundingBox(
            unionBoundingBox(
              bTankModelDefinition.boundingBox,
              bTurretModelDefinition.boundingBox,
            ),
          );
          const aVolume = aSize[0] * aSize[1] * aSize[2];
          const bVolume = bSize[0] * bSize[1] * bSize[2];

          return aVolume - bVolume;
        });
        break;

      case 'survivability.length':
        sorted = filtered.sort((a, b) => {
          const aTankModelDefinition = awaitedModelDefinitions[a.id];
          const bTankModelDefinition = awaitedModelDefinitions[b.id];
          const aTurretModelDefinition =
            aTankModelDefinition.turrets[a.turrets.at(-1)!.id];
          const bTurretModelDefinition =
            bTankModelDefinition.turrets[b.turrets.at(-1)!.id];
          const aSize = normalizeBoundingBox(
            unionBoundingBox(
              aTankModelDefinition.boundingBox,
              aTurretModelDefinition.boundingBox,
            ),
          );
          const bSize = normalizeBoundingBox(
            unionBoundingBox(
              bTankModelDefinition.boundingBox,
              bTurretModelDefinition.boundingBox,
            ),
          );
          const aLength = Math.max(aSize[0], aSize[1], aSize[2]);
          const bLength = Math.max(bSize[0], bSize[1], bSize[2]);

          return aLength - bLength;
        });
        break;

      case 'fire.dpm':
        sorted = filtered.sort(
          (a, b) =>
            resolveDpm(
              a.turrets.at(-1)!.guns.at(-1)!,
              a.turrets.at(-1)!.guns.at(-1)!.shells[0],
            ) -
            resolveDpm(
              b.turrets.at(-1)!.guns.at(-1)!,
              b.turrets.at(-1)!.guns.at(-1)!.shells[0],
            ),
        );
        break;

      case 'fire.reload':
        sorted = filtered.sort(
          (a, b) =>
            resolveReload(a.turrets.at(-1)!.guns.at(-1)!) -
            resolveReload(b.turrets.at(-1)!.guns.at(-1)!),
        );
        break;

      case 'fire.caliber':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.shells[0].caliber -
            b.turrets.at(-1)!.guns.at(-1)!.shells[0].caliber,
        );
        break;

      case 'fire.standardPenetration':
        sorted = filtered.sort(
          (a, b) =>
            resolveNearPenetration(
              a.turrets.at(-1)!.guns.at(-1)!.shells[0].penetration,
            ) -
            resolveNearPenetration(
              b.turrets.at(-1)!.guns.at(-1)!.shells[0].penetration,
            ),
        );
        break;

      case 'fire.premiumPenetration':
        sorted = filtered.sort(
          (a, b) =>
            resolveNearPenetration(
              (
                a.turrets.at(-1)!.guns.at(-1)!.shells[1] ??
                a.turrets.at(-1)!.guns.at(-1)!.shells[0]
              ).penetration,
            ) -
            resolveNearPenetration(
              (
                b.turrets.at(-1)!.guns.at(-1)!.shells[1] ??
                b.turrets.at(-1)!.guns.at(-1)!.shells[0]
              ).penetration,
            ),
        );
        break;

      case 'fire.damage':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.shells[0].damage.armor -
            b.turrets.at(-1)!.guns.at(-1)!.shells[0].damage.armor,
        );
        break;

      case 'fire.shellVelocity':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.shells[0].speed -
            b.turrets.at(-1)!.guns.at(-1)!.shells[0].speed,
        );
        break;

      case 'fire.aimTime':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.aimTime -
            b.turrets.at(-1)!.guns.at(-1)!.aimTime,
        );
        break;

      case 'fire.dispersionStill':
        sorted = filtered.sort(
          (a, b) =>
            a.turrets.at(-1)!.guns.at(-1)!.dispersion.base -
            b.turrets.at(-1)!.guns.at(-1)!.dispersion.base,
        );
        break;

      case 'fire.dispersionMoving':
        sorted = filtered.sort(
          (a, b) =>
            a.tracks.at(-1)!.dispersion.move - b.tracks.at(-1)!.dispersion.move,
        );
        break;

      case 'fire.gunDepression':
        sorted = filtered.sort(
          (a, b) =>
            awaitedModelDefinitions[a.id].turrets[a.turrets.at(-1)!.id].guns[
              a.turrets.at(-1)!.guns.at(-1)!.id
            ].pitch.max -
            awaitedModelDefinitions[b.id].turrets[b.turrets.at(-1)!.id].guns[
              b.turrets.at(-1)!.guns.at(-1)!.id
            ].pitch.max,
        );
        break;

      case 'fire.gunElevation':
        sorted = filtered.sort(
          (a, b) =>
            // reversed because of negative values
            awaitedModelDefinitions[b.id].turrets[b.turrets.at(-1)!.id].guns[
              b.turrets.at(-1)!.guns.at(-1)!.id
            ].pitch.min -
            awaitedModelDefinitions[a.id].turrets[a.turrets.at(-1)!.id].guns[
              a.turrets.at(-1)!.guns.at(-1)!.id
            ].pitch.min,
        );
        break;

      case 'maneuverability.forwardsSpeed':
        sorted = filtered.sort((a, b) => a.speed.forwards - b.speed.forwards);
        break;

      case 'maneuverability.backwardsSpeed':
        sorted = filtered.sort((a, b) => a.speed.backwards - b.speed.backwards);
        break;

      case 'maneuverability.power':
        sorted = filtered.sort(
          (a, b) => a.engines.at(-1)!.power - b.engines.at(-1)!.power,
        );
        break;

      case 'maneuverability.powerToWeight':
        sorted = filtered.sort(
          (a, b) =>
            a.engines.at(-1)!.power /
              (a.weight +
                a.engines.at(-1)!.weight +
                a.tracks.at(-1)!.weight +
                a.turrets.at(-1)!.weight +
                a.turrets.at(-1)!.guns.at(-1)!.weight) -
            b.engines.at(-1)!.power /
              (b.weight +
                b.engines.at(-1)!.weight +
                b.tracks.at(-1)!.weight +
                b.turrets.at(-1)!.weight +
                b.turrets.at(-1)!.guns.at(-1)!.weight),
        );
        break;

      case 'maneuverability.weight':
        sorted = filtered.sort(
          (a, b) =>
            a.weight +
            a.engines.at(-1)!.weight +
            a.tracks.at(-1)!.weight +
            a.turrets.at(-1)!.weight +
            a.turrets.at(-1)!.guns.at(-1)!.weight -
            (b.weight +
              b.engines.at(-1)!.weight +
              b.tracks.at(-1)!.weight +
              b.turrets.at(-1)!.weight +
              b.turrets.at(-1)!.guns.at(-1)!.weight),
        );
        break;

      case 'maneuverability.traverseSpeed':
        sorted = filtered.sort(
          (a, b) =>
            a.tracks.at(-1)!.traverseSpeed - b.tracks.at(-1)!.traverseSpeed,
        );
        break;
    }

    return sort.direction === 'ascending' ? sorted : sorted.reverse();
  }, [
    sort,
    ...Object.entries(filters)
      .filter(([name]) => name !== 'page')
      .map(([, value]) => value),
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(
    () =>
      go(searchQuery, searchableTanks, {
        keys: ['name', 'nameFull', 'id'] satisfies (keyof TankDefinition)[],
        all: true,
      }).map(({ obj }) => obj),
    [searchQuery, searchableTanks],
  );
  const page = useTankopediaPersistent((state) => state.filters.page);
  const searchResultsPageSlice = searchResults.slice(
    page * tanksPerPage,
    (page + 1) * tanksPerPage,
  );

  useEffect(() => {
    mutateTankopediaPersistent((draft) => {
      draft.filters.page = Math.min(
        Math.max(0, page),
        Math.ceil(searchResults.length / tanksPerPage) - 1,
      );
    });
  }, [searchResults]);

  return (
    <>
      <Flex direction="column" gap="4">
        <Flex gap="2">
          <TextField.Root
            style={{ flex: 1 }}
            ref={input}
            placeholder="Search tanks..."
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (
                  searchResults.length > 0 &&
                  input.current &&
                  input.current.value.length > 0
                ) {
                  onSelect(searchResults[0]);
                }
              }
            }}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon height="16" width="16" />
            </TextField.Slot>

            {searchResults.length > 0 &&
              input.current &&
              input.current.value.length > 0 && (
                <TextField.Slot>
                  <Button
                    variant="ghost"
                    onClick={() => onSelect(searchResults[0])}
                  >
                    {searchResults[0].name} <CaretRightIcon />
                  </Button>
                </TextField.Slot>
              )}
          </TextField.Root>

          <Sort />

          <Button
            color="red"
            variant="soft"
            onClick={() =>
              useTankopediaPersistent.setState({
                filters: {
                  nations: [],
                  tiers: [],
                  treeTypes: [],
                  types: [],
                  test: 'include',
                  page: 0,
                },
                sort: {
                  by: 'meta.tier',
                  direction: 'descending',
                },
              })
            }
          >
            <TrashIcon />
          </Button>
        </Flex>

        <Options />
      </Flex>

      <Flex justify="center" gap="4" align="center">
        <Text color="gray">
          Sorting: {SORT_NAMES[sort.by]}, {sort.direction}
        </Text>

        {onSelectAll && searchResults.length <= 8 && (
          <Button variant="ghost" onClick={() => onSelectAll(searchResults)}>
            Select all
          </Button>
        )}
        {onSelectAll && searchResults.length > 8 && (
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button variant="ghost">Select all</Button>
            </AlertDialog.Trigger>

            <AlertDialog.Content>
              <AlertDialog.Title>
                Woah! That's a lot of tanks.
              </AlertDialog.Title>
              <AlertDialog.Description>
                Would you like to select{' '}
                <Text color="red">all {searchResults.length} tanks</Text>?
              </AlertDialog.Description>

              <Flex gap="2" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>

                <AlertDialog.Action onClick={() => onSelectAll(searchResults)}>
                  <Button variant="solid" color="red">
                    Select {searchResults.length} tanks
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        )}
      </Flex>

      {!compact && (
        <PageTurner tanksPerPage={tanksPerPage} searchedList={searchResults} />
      )}

      <Results
        compact={compact}
        results={searchResultsPageSlice}
        onSelect={onSelect}
      />

      {searchResultsPageSlice.length > tanksPerPage / 4 && (
        <PageTurner tanksPerPage={tanksPerPage} searchedList={searchResults} />
      )}
    </>
  );
}
