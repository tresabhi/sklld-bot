import { Flex, Heading } from '@radix-ui/themes';
import { use } from 'react';
import { ProvisionButton } from '../../../../../../../components/ModuleButtons/ProvisionButton';
import { checkConsumableProvisionInclusivity } from '../../../../../../../core/blitzkrieg/checkConsumableProvisionInclusivity';
import { provisionDefinitions } from '../../../../../../../core/blitzkrieg/provisionDefinitions';
import { useDuel } from '../../../../../../../stores/duel';
import {
  mutateTankopediaTemporary,
  useTankopediaTemporary,
} from '../../../../../../../stores/tankopedia';
import { ConfigurationChildWrapper } from './ConfigurationChildWrapper';

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
    <ConfigurationChildWrapper>
      <Heading size="4">Provisions</Heading>

      <Flex wrap="wrap">
        {provisionsList.map((provision, index) => {
          const selected = provisions.includes(provision.id);

          return (
            <ProvisionButton
              key={provision.id}
              first={index === 0}
              last={index === provisionsList.length - 1}
              rowChild
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
    </ConfigurationChildWrapper>
  );
}