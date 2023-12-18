import { Vector3Tuple, Vector4Tuple } from 'three';

export interface SC2 {
  '#dataNodes': DataNode[];
  '#hierarchy': Hierarchy[];
  '#sceneComponents': SceneComponents;
}

type DataNode = {
  '##name': 'NMaterial';
  '#id': Buffer;
  materialName: string;
  parentMaterialKey?: string;
  configCount?: number;
  qualityGroup?: string;
  fxName?: string;
} & Record<`configArchive_${number}`, ConfigArchive>;

interface ConfigArchive {
  configName: string;
  fxName: string;
  properties: Properties;
  textureSampleStates: TextureSampleStates;
  textures: Textures;
  customCullMode?: number;
  enabledPresets?: EnabledPresets;
  flags?: Flags;
}

interface EnabledPresets {
  AlphaTest: boolean;
}

interface Flags {
  AMBIENT_ATTENUATION_BOX: number;
}

interface Properties {
  alphatestThreshold: Buffer;
  attenuationBoxHalfSize: Buffer;
  attenuationBoxSmoothness: Buffer;
  baseColorFactor?: Buffer;
  decalTileCoordScale?: Buffer;
  inGlossiness: Buffer;
  inSpecularity: Buffer;
  metalFresnelReflectance: Buffer;
  metallicRoughnessFactor?: Buffer;
}

interface TextureSampleStates {
  albedo: number;
  baseColorMap: number;
  baseNormalMap: number;
  baseRMMap: number;
  decalmask?: number;
  maskMap: number;
  miscMap: number;
  normalmap: number;
}

interface Textures {
  albedo: string;
  baseColorMap: string;
  baseNormalMap: string;
  baseRMMap: string;
  decalmask?: string;
  maskMap: string;
  miscMap: string;
  normalmap: string;
}

export interface Hierarchy {
  '##name': 'Entity';
  '#hierarchy'?: Hierarchy[];
  components: Components;
  flags: number;
  id: bigint;
  name: string;
}

// 0001, 0002, 0003...: Component
type Components = {
  count: number;
} & Record<string, Component>;

type LODDistance = Record<`distance${number}`, number>;

// 0001, 0002, 0003...
type RoBatches = Record<
  string,
  {
    '##name': 'RenderBatch';
    'rb.aabbox': RbAabbox;
    'rb.classname': 'RenderBatch';
    'rb.datasource': bigint;
    'rb.nmatname': string;
    'rb.sortingKey': number;
  }
>;

interface RbAabbox {
  minimum: number[];
  maximum: number[];
}

type Component =
  | {
      'comp.typename': 'TransformComponent';
      'tc.localRotation': Vector4Tuple;
      'tc.localScale': Vector3Tuple;
      'tc.localTranslation': Vector3Tuple;
      'tc.worldRotation': Vector4Tuple;
      'tc.worldScale': Vector3Tuple;
      'tc.worldTranslation': Vector3Tuple;
    }
  | {
      'comp.typename': 'RenderComponent';
      'rc.renderObj': {
        '##name': 'Mesh';
        'ro.batchCount': number;
        'ro.batches': RoBatches;
        'ro.debugflags': number;
        'ro.flags': number;
        'ro.notShadowOnly': boolean;
        'ro.sOclCull': boolean;
        'ro.sOclIndex': number;
      } & Record<`rb${number}.${'lodIndex' | 'switchIndex'}`, number>;
    }
  | {
      'comp.typename': 'SlotComponent';
      'sc.attachmentRotation': number[];
      'sc.attachmentScale': number[];
      'sc.attachmentTranslation': number[];
      'sc.configFilePath': string;
      'sc.slotName': string;
      'sc.template': string;
      'sc.typeFiltersCount': number;
    }
  | {
      'comp.typename': 'LodComponent';
      'lc.loddist': LODDistance;
    };

interface SceneComponents {
  count: number;
}