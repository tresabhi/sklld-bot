import { memo, useRef } from 'react';
import { Group } from 'three';
import { correctZYTuple } from '../../../core/blitz/correctZYTuple';
import { nameToArmorId } from '../../../core/blitzkit/nameToArmorId';
import { resolveArmor } from '../../../core/blitzkit/resolveThickness';
import { useArmor } from '../../../hooks/useArmor';
import { useTankModelDefinition } from '../../../hooks/useTankModelDefinition';
import { useTankTransform } from '../../../hooks/useTankTransform';
import { Duel } from '../../../stores/duel';
import { ModelTankWrapper } from './ModelTankWrapper';
import { PrimaryArmorSceneComponent } from './PrimaryArmorSceneComponent';

export const PrimaryArmorScene = memo(() => {
  const wrapper = useRef<Group>(null);
  const turretContainer = useRef<Group>(null);
  const gunContainer = useRef<Group>(null);
  const protagonist = Duel.use((draft) => draft.protagonist);
  const tank = Duel.use((state) => state.protagonist.tank);
  const track = Duel.use((state) => state.protagonist.track);
  const turret = Duel.use((state) => state.protagonist.turret);
  const gun = Duel.use((state) => state.protagonist.gun);
  const armorGltf = useArmor(tank.id).gltf;
  const armorNodes = Object.values(armorGltf.nodes);
  const tankModelDefinition = useTankModelDefinition();
  const trackModelDefinition = tankModelDefinition.tracks[track.id];
  const turretModelDefinition = tankModelDefinition.turrets[turret.id];
  const gunModelDefinition =
    turretModelDefinition.guns[gun.gun_type!.value.base.id];
  const hullOrigin = correctZYTuple(trackModelDefinition.origin);
  const turretOrigin = correctZYTuple(tankModelDefinition.turret_origin);
  const gunOrigin = correctZYTuple(turretModelDefinition.gun_origin);
  const isDynamicArmorActive = Duel.use((state) =>
    state.protagonist.consumables.includes(73),
  );

  useTankTransform(protagonist, turretContainer, gunContainer);

  return (
    <ModelTankWrapper ref={wrapper}>
      <group position={hullOrigin}>
        {armorNodes.map((node) => {
          const isHull = node.name.startsWith('hull_');
          const isVisible = isHull;
          const armorId = nameToArmorId(node.name);
          const { spaced, thickness } = resolveArmor(
            tankModelDefinition.armor,
            armorId,
          );

          if (
            !isVisible ||
            spaced ||
            thickness === undefined ||
            (isDynamicArmorActive && node.name.includes('state_01')) ||
            (!isDynamicArmorActive && node.name.includes('state_00'))
          )
            return null;

          return (
            <PrimaryArmorSceneComponent
              key={node.uuid}
              thickness={thickness}
              node={node}
            />
          );
        })}
      </group>

      <group ref={turretContainer}>
        {armorNodes.map((node) => {
          const isCurrentTurret = node.name.startsWith(
            `turret_${turretModelDefinition.model_id.toString().padStart(2, '0')}`,
          );
          const isVisible = isCurrentTurret;
          const armorId = nameToArmorId(node.name);
          const { spaced, thickness } = resolveArmor(
            turretModelDefinition.armor,
            armorId,
          );

          if (
            !isVisible ||
            spaced ||
            thickness === undefined ||
            (isDynamicArmorActive && node.name.includes('state_01')) ||
            (!isDynamicArmorActive && node.name.includes('state_00'))
          )
            return null;

          return (
            <group position={hullOrigin} key={node.uuid}>
              <group position={turretOrigin}>
                <PrimaryArmorSceneComponent
                  key={node.uuid}
                  thickness={thickness}
                  node={node}
                />
              </group>
            </group>
          );
        })}

        <group ref={gunContainer}>
          {armorNodes.map((node) => {
            const isCurrentGun = node.name.startsWith(
              `gun_${gunModelDefinition.model_id.toString().padStart(2, '0')}`,
            );
            const isVisible = isCurrentGun;
            const armorId = nameToArmorId(node.name);
            const { spaced, thickness } = resolveArmor(
              gunModelDefinition.armor,
              armorId,
            );

            if (
              !isVisible ||
              spaced ||
              thickness === undefined ||
              (isDynamicArmorActive && node.name.includes('state_01')) ||
              (!isDynamicArmorActive && node.name.includes('state_00'))
            )
              return null;

            return (
              <group position={hullOrigin} key={node.uuid}>
                <group position={turretOrigin.clone().add(gunOrigin)}>
                  <PrimaryArmorSceneComponent
                    thickness={thickness}
                    node={node}
                  />
                </group>
              </group>
            );
          })}
        </group>
      </group>
    </ModelTankWrapper>
  );
});