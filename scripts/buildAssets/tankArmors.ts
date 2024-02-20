import { NodeIO } from '@gltf-transform/core';
import { readdir } from 'fs/promises';
import { DATA } from '.';
import { extractArmor } from '../../src/core/blitz/extractArmor';
import { readXMLDVPL } from '../../src/core/blitz/readXMLDVPL';
import { toUniqueId } from '../../src/core/blitz/toUniqueId';
import { commitAssets } from '../../src/core/blitzkrieg/commitAssets';
import { FileChange } from '../../src/core/blitzkrieg/commitMultipleFiles';
import { POI } from './constants';
import { VehicleDefinitionList } from './definitions';

export async function tankArmors(production: boolean) {
  console.log('Building tank armors...');

  const changes: FileChange[] = [];
  const nodeIO = new NodeIO();
  const nations = await readdir(`${DATA}/${POI.vehicleDefinitions}`).then(
    (nations) => nations.filter((nation) => nation !== 'common'),
  );

  await Promise.all(
    nations.map(async (nation) => {
      const tanks = await readXMLDVPL<{ root: VehicleDefinitionList }>(
        `${DATA}/${POI.vehicleDefinitions}/${nation}/list.xml.dvpl`,
      );

      await Promise.all(
        Object.entries(tanks.root).map(async ([tankKey, tank]) => {
          if (tankKey.includes('tutorial_bot')) return;

          const id = toUniqueId(nation, tank.id);

          if (id !== 12913) return;

          console.log(`Building armor ${id} @ ${nation}/${tankKey}`);

          const model = await extractArmor(DATA, `${nation}-${tankKey}`);

          changes.push({
            path: `3d/tanks/armor/${id}.glb`,
            encoding: 'base64',
            content: Buffer.from(await nodeIO.writeBinary(model)).toString(
              'base64',
            ),
          });
        }),
      );
    }),
  );

  await commitAssets('tank armor', changes, production);
}
