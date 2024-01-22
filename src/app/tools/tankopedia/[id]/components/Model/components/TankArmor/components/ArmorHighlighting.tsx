import { useEffect, useRef } from 'react';
import { Euler, Group, Mesh, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import { ArmorMesh } from '../../../../../../../../../components/ArmorMesh';
import { I_HAT, J_HAT, K_HAT } from '../../../../../../../../../constants/axis';
import {
  ModelTransformEventData,
  modelTransformEvent,
} from '../../../../../../../../../core/blitzkrieg/modelTransform';
import { nameToArmorId } from '../../../../../../../../../core/blitzkrieg/nameToArmorId';
import { resolveArmor } from '../../../../../../../../../core/blitzkrieg/resolveThickness';
import { useArmor } from '../../../../../../../../../hooks/useArmor';
import { useModelDefinitions } from '../../../../../../../../../hooks/useModelDefinitions';
import { useTankopediaTemporary } from '../../../../../../../../../stores/tankopedia';
import { Duel } from '../../../../../page';

interface ArmorHighlightingProps {
  duel: Duel;
}

export function ArmorHighlighting({ duel }: ArmorHighlightingProps) {
  const wrapper = useRef<Group>(null);
  const modelDefinitions = useModelDefinitions();
  const turretContainer = useRef<Group>(null);
  const initialTankopediaState = useTankopediaTemporary.getState();

  useEffect(() => {
    const hullOrigin = new Vector3(
      tankModelDefinition.hullOrigin[0],
      tankModelDefinition.hullOrigin[1],
      -tankModelDefinition.hullOrigin[2],
    ).applyAxisAngle(I_HAT, Math.PI / 2);
    const turretOrigin = new Vector3(
      tankModelDefinition.turretOrigin[0],
      tankModelDefinition.turretOrigin[1],
      -tankModelDefinition.turretOrigin[2],
    ).applyAxisAngle(I_HAT, Math.PI / 2);
    const turretPosition = new Vector3();
    const turretRotation = new Euler();

    function handleModelTransform({ yaw }: ModelTransformEventData) {
      if (yaw === undefined) return;

      turretPosition
        .set(0, 0, 0)
        .sub(hullOrigin)
        .sub(turretOrigin)
        .applyAxisAngle(new Vector3(0, 0, 1), yaw);
      turretRotation.set(0, 0, yaw);

      if (tankModelDefinition.turretRotation) {
        const initialPitch = -degToRad(
          tankModelDefinition.turretRotation.pitch,
        );
        const initialYaw = -degToRad(tankModelDefinition.turretRotation.yaw);
        const initialRoll = -degToRad(tankModelDefinition.turretRotation.roll);

        turretPosition
          .applyAxisAngle(I_HAT, initialPitch)
          .applyAxisAngle(J_HAT, initialRoll)
          .applyAxisAngle(K_HAT, initialYaw);
        turretRotation.x += initialPitch;
        turretRotation.y += initialRoll;
        turretRotation.z += initialYaw;
      }

      turretPosition.add(turretOrigin).add(hullOrigin);
      turretContainer.current?.position.copy(turretPosition);
      turretContainer.current?.rotation.copy(turretRotation);
    }

    handleModelTransform(useTankopediaTemporary.getState().model.pose);
    modelTransformEvent.on(handleModelTransform);

    return () => {
      modelTransformEvent.off(handleModelTransform);
    };
  });

  useEffect(() => {
    const unsubscribe = useTankopediaTemporary.subscribe(
      (state) => state.mode,
      (mode) => {
        if (wrapper.current) wrapper.current.visible = mode === 'armor';
      },
    );

    return unsubscribe;
  });

  const armorGltf = useArmor(duel.protagonist.tank.id);
  const armorNodes = Object.values(armorGltf.nodes);
  const tankModelDefinition = modelDefinitions[duel.protagonist.tank.id];
  const turretModelDefinition =
    tankModelDefinition.turrets[duel.protagonist.turret.id];
  const gunModelDefinition =
    turretModelDefinition.guns[duel.protagonist.gun.id];
  const hullOrigin = new Vector3(
    tankModelDefinition.hullOrigin[0],
    tankModelDefinition.hullOrigin[1],
    -tankModelDefinition.hullOrigin[2],
  );
  const turretOrigin = new Vector3(
    tankModelDefinition.turretOrigin[0],
    tankModelDefinition.turretOrigin[1],
    -tankModelDefinition.turretOrigin[2],
  ).applyAxisAngle(I_HAT, Math.PI / 2);
  const maxThickness = Math.max(
    tankModelDefinition.trackThickness,
    gunModelDefinition.barrelThickness,
    ...armorNodes
      .map((node) => {
        const armorId = nameToArmorId(node.name);
        return resolveArmor(tankModelDefinition.armor, armorId).thickness;
      })
      .filter(Boolean),
  );

  return (
    <group
      ref={wrapper}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={initialTankopediaState.mode === 'armor'}
      position={hullOrigin}
    >
      {armorNodes.map((node) => {
        const isHull = node.name.startsWith('hull_');
        const isVisible = isHull;
        const armorId = nameToArmorId(node.name);
        const { spaced, thickness } = resolveArmor(
          tankModelDefinition.armor,
          armorId,
        );

        if (!isVisible || thickness === undefined || spaced) return null;

        return (
          <ArmorMesh
            maxThickness={maxThickness}
            duel={duel}
            key={node.uuid}
            geometry={(node as Mesh).geometry}
            thickness={thickness}
          />
        );
      })}

      <group ref={turretContainer}>
        {armorNodes.map((node) => {
          const isCurrentTurret = node.name.startsWith(
            `turret_${turretModelDefinition.model.toString().padStart(2, '0')}`,
          );
          const isVisible = isCurrentTurret;
          const armorId = nameToArmorId(node.name);
          const { spaced, thickness } = resolveArmor(
            turretModelDefinition.armor,
            armorId,
          );

          if (!isVisible || thickness === undefined || spaced) return null;

          return (
            <ArmorMesh
              maxThickness={maxThickness}
              duel={duel}
              key={node.uuid}
              geometry={(node as Mesh).geometry}
              position={turretOrigin}
              thickness={thickness}
            />
          );
        })}
      </group>
    </group>
  );
}
