import { asset } from './asset';
import { fetchCdonLz4 } from './fetchCdonLz4';
import { TankClass } from './tankDefinitions';

export interface SkillDefinitions {
  classes: Record<TankClass, string[]>;
}

export const skillDefinitions = fetchCdonLz4<SkillDefinitions>(
  asset('definitions/skills.cdon.lz4'),
);
