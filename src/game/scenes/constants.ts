import {
  ANIMAL_DEFINITIONS,
  ANIMAL_SPRITESHEET,
  type AnimalKind,
} from '@/game/entities/animal-definitions';

export const MapKeys = {
  world: 'world',
} as const;

export const SceneKeys = {
  loading: 'Loading',
  main: 'Main',
} as const;

export const AssetPaths = {
  world: '/assets/game/world.json',
} as const;

export const ObjectLayers = {
  areas: 'Areas',
  events: 'Events',
  player: 'Player',
  npc: 'NPC',
  objects: 'Objects',
  collisions: 'Collisions',
  collisionObjects: 'CollisionObjects',
} as const;

export const EventKeys = {
  ufoTrigger: 'UfoTrigger',
} as const;

export const AreaKeys = {
  sheep: 'sheepArea',
  chicken: 'chickenArea',
  cow: 'CowArea',
  pig: 'PigsArea',
} as const;

export const SpawnKeys = {
  player: 'PlayerSpawn',
  sheep: 'sheepSpawn',
  chicken: 'chickenSpawn',
  cow: 'CowSpawn',
  pig: 'PigsSpawn',
} as const;

export const TilemapProperties = {
  depth: 'depth',
} as const;

export const ObjectProperties = {
  enabled: 'enabled',
} as const;

export const WanderSettings = {
  spawnAttempts: 12,
  targetAttempts: 8,
  minTargetDistance: 12,
  fallbackRadiusFactor: 0.7,
} as const;

export const TILESETS = [
  { name: 'chest', url: '/assets/game/Outdoor decoration/Chest.png' },
  {
    name: 'decor',
    url: '/assets/game/Outdoor decoration/OutdoorDecor.png',
  },
  { name: 'farm', url: '/assets/game/Tiles/FarmLandTile.png' },
  { name: 'fence', url: '/assets/game/Outdoor decoration/Fences.png' },
  { name: 'grass', url: '/assets/game/Tiles/GrassMiddle.png' },
  {
    name: 'house',
    url: '/assets/game/Outdoor decoration/HouseWoodBaseBlue.png',
  },
  { name: 'oak', url: '/assets/game/Outdoor decoration/OakTree.png' },
  { name: 'path', url: '/assets/game/Tiles/PathTile.png' },
  { name: 'water', url: '/assets/game/Tiles/WaterTile.png' },
  { name: 'village', url: '/assets/game/Outdoor decoration/Village.png' },
] as const;

const DEFAULT_ANIMAL_CONFIG = {
  speed: 18,
  spawnRadius: 28,
  minSpawnDistance: 14,
  minPause: 700,
  maxPause: 1800,
  targetReachRadius: 2,
  stuckCheckInterval: 500,
  minProgress: 2,
  targetTimeoutGrace: 1000,
  targetTimeoutFactor: 2,
  stuckPause: 500,
  facingDistanceThreshold: 0.05,
} as const;

export type AnimalConfig = {
  kind: AnimalKind;
  count: number;
  speed: number;
  spawnRadius: number;
  minSpawnDistance: number;
  minPause: number;
  maxPause: number;
  halfFrameSize: number;
  targetReachRadius: number;
  stuckCheckInterval: number;
  minProgress: number;
  targetTimeoutGrace: number;
  targetTimeoutFactor: number;
  stuckPause: number;
  facingDistanceThreshold: number;
  areaKey: string;
  spawnKey: string;
};

const createAnimalConfig = (
  kind: AnimalKind,
  count: number,
  areaKey: string,
  spawnKey: string,
): AnimalConfig => ({
  ...DEFAULT_ANIMAL_CONFIG,
  kind,
  count,
  areaKey,
  spawnKey,
  halfFrameSize:
    (ANIMAL_SPRITESHEET.frameWidth * ANIMAL_DEFINITIONS[kind].scale) / 2,
});

export const ANIMAL_CONFIGS = {
  sheep: createAnimalConfig('sheep', 4, AreaKeys.sheep, SpawnKeys.sheep),
  chicken: createAnimalConfig(
    'chicken',
    7,
    AreaKeys.chicken,
    SpawnKeys.chicken,
  ),
  cow: createAnimalConfig('cow', 3, AreaKeys.cow, SpawnKeys.cow),
  pig: createAnimalConfig('pig', 2, AreaKeys.pig, SpawnKeys.pig),
} as const satisfies Record<AnimalKind, AnimalConfig>;
