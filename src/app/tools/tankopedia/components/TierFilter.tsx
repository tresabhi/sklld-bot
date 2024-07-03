import { Flex, IconButton, Text } from '@radix-ui/themes';
import { times } from 'lodash';
import { memo } from 'react';
import { Tier } from '../../../../core/blitzkit/tankDefinitions';
import { TIER_ROMAN_NUMERALS } from '../../../../core/blitzkit/tankDefinitions/constants';
import {
  mutateTankFilters,
  useTankFilters,
} from '../../../../stores/tankFilters';
import { useTankopediaSort } from '../../../../stores/tankopediaSort';

export const TierFilter = memo(() => {
  const tierFilter = useTankFilters((state) => state.tiers);
  const sort = useTankopediaSort();
  const search = useTankFilters((state) => state.search);

  if (sort.by !== 'meta.none' || search) return null;

  return (
    <Flex justify="center">
      <Flex
        direction="row"
        overflow="hidden"
        style={{ borderRadius: 'var(--radius-full)' }}
      >
        {times(10, (index) => {
          const tier = (10 - index) as Tier;
          const selected = tierFilter === tier;

          return (
            <IconButton
              key={tier}
              variant={selected ? 'solid' : 'soft'}
              radius="none"
              color={selected ? undefined : 'gray'}
              highContrast
              onClick={() =>
                mutateTankFilters((draft) => {
                  draft.tiers = tier;
                })
              }
            >
              <Text size="2">{TIER_ROMAN_NUMERALS[tier]}</Text>
            </IconButton>
          );
        })}
      </Flex>
    </Flex>
  );
});
