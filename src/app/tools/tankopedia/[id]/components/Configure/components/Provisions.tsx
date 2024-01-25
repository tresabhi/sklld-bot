import { Flex, Heading, Text } from '@radix-ui/themes';
import { use } from 'react';
import { ModuleButton } from '../../../../../../../components/ModuleButton';
import { checkConsumableProvisionInclusivity } from '../../../../../../../core/blitzkrieg/checkConsumableInclusivity';
import { provisionDefinitions } from '../../../../../../../core/blitzkrieg/provisionDefinitions';
import { useDuel } from '../../../../../../../stores/duel';
import {
  mutateTankopediaTemporary,
  useTankopediaTemporary,
} from '../../../../../../../stores/tankopedia';

export function Provisions() {
  const protagonist = useDuel((state) => state.protagonist!);
  const awaitedProvisionDefinitions = use(provisionDefinitions);
  const provisions = useTankopediaTemporary((state) => state.provisions);
  const provisionsList = Object.values(awaitedProvisionDefinitions).filter(
    (provision) =>
      checkConsumableProvisionInclusivity(
        provision,
        protagonist.tank,
        protagonist.gun,
      ),
  );

  return (
    <Flex gap="2" direction="column">
      <Heading size="4">
        Provisions <Text color="gray">(max {protagonist.tank.provisions})</Text>
      </Heading>

      <Flex>
        {provisionsList.map((provision, index) => {
          if (provision.id === 113) return null; // goofy useless provision
          const selected = provisions.includes(provision.id);

          return (
            <ModuleButton
              first={index === 0}
              last={index === provisionsList.length - 1}
              rowChild
              type="provision"
              disabled={
                protagonist.tank.provisions === provisions.length && !selected
              }
              provision={provision.id}
              selected={selected}
              onClick={() => {
                mutateTankopediaTemporary((draft) => {
                  if (selected) {
                    draft.provisions = draft.provisions.filter(
                      (id) => id !== provision.id,
                    );
                  } else {
                    draft.provisions.push(provision.id);
                  }
                });
              }}
            />
          );
        })}
      </Flex>
    </Flex>
  );
}
