import Phaser from 'phaser';

import { createObjectLayer } from '@/game/create-object-layer';
import { Animal } from '@/game/entities/animal';
import { Player } from '@/game/entities/player';
import { Ufo } from '@/game/entities/ufo';
import {
  ANIMAL_CONFIGS,
  AreaKeys,
  EventKeys,
  MapKeys,
  ObjectLayers,
  SceneKeys,
  SpawnKeys,
  TILESETS,
  TilemapProperties,
  type AnimalConfig,
} from './constants';
import {
  clampWanderersToBounds,
  createWanderer,
  findMapObject,
  getAnimalArea,
  getEnabledCollisionObjects,
  getMovementBounds,
  getPlayerSpawn,
  getSpawnPosition,
  type AnimalWanderer,
  updateWanderers,
} from './utils';

export class Main extends Phaser.Scene {
  private player?: Player;
  private sheepArea?: Phaser.Geom.Rectangle;
  private chickenArea?: Phaser.Geom.Rectangle;
  private cowArea?: Phaser.Geom.Rectangle;
  private pigArea?: Phaser.Geom.Rectangle;
  private sheepWanderers: AnimalWanderer[] = [];
  private chickenWanderers: AnimalWanderer[] = [];
  private cowWanderers: AnimalWanderer[] = [];
  private pigWanderers: AnimalWanderer[] = [];
  private ufo?: Ufo;
  private ufoTrigger?: Phaser.Physics.Arcade.StaticBody;
  private ufoEventStarted = false;

  constructor() {
    super(SceneKeys.main);
  }

  create() {
    const map = this.make.tilemap({ key: MapKeys.world });
    const tilesets = map.tilesets.map(({ name }) => {
      // Image collections use image paths as tileset names.
      const textureKey = TILESETS.find(
        (asset) => asset.name === name || asset.url === `/assets/game/${name}`,
      )?.name;
      const tileset = map.addTilesetImage(name, textureKey ?? name);

      if (!tileset) {
        throw new Error(`Unable to load tileset: ${name}`);
      }

      return tileset;
    });

    const tileLayers = map.layers.map(({ properties }, index) => {
      const layer = map.createLayer(index, tilesets);
      const depth = properties?.find(
        (property): property is { value: number } =>
          'name' in property &&
          property.name === TilemapProperties.depth &&
          'value' in property &&
          typeof property.value === 'number',
      )?.value;

      return { layer, depth: depth ?? index };
    });

    const objectBodies = createObjectLayer(
      map,
      ObjectLayers.objects,
      this.cache.tilemap.get(MapKeys.world).data.tilesets,
    );

    this.sheepArea = getAnimalArea(map, ObjectLayers.areas, AreaKeys.sheep);
    this.chickenArea = getAnimalArea(map, ObjectLayers.areas, AreaKeys.chicken);
    this.cowArea = getAnimalArea(map, ObjectLayers.areas, AreaKeys.cow);
    this.pigArea = getAnimalArea(map, ObjectLayers.areas, AreaKeys.pig);

    // Terrain (including fences painted in Decorations) stays below the world.
    // Preserve its authored depth order, even when an object crosses y = 0.
    const minWorldDepth = Math.min(
      0,
      ...this.children.list
        .filter((object) => object instanceof Phaser.GameObjects.Image)
        .map((object) => object.depth),
    );
    tileLayers
      .sort((a, b) => a.depth - b.depth)
      .forEach(({ layer }, index) => {
        layer?.setDepth(minWorldDepth - tileLayers.length + index);
      });

    this.player = new Player(
      this,
      new Phaser.Geom.Rectangle(0, 0, map.widthInPixels, map.heightInPixels),
      getPlayerSpawn(map, ObjectLayers.player, SpawnKeys.player),
    );

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.ufo = new Ufo(this);
    this.createUfoTrigger(map);

    const obstacles = getEnabledCollisionObjects(map, [
      ObjectLayers.collisions,
      ObjectLayers.collisionObjects,
    ]).map(({ x, y, width, height }) =>
      this.physics.add.staticBody(x, y, width, height),
    );

    this.physics.add.collider(this.player.sprite, [
      ...obstacles,
      ...objectBodies,
    ]);
    // Sheep use the authored pasture bounds as their walkable space. Adding
    // every world obstacle as a collider can leave a sheep pressed against a
    // fence while its random target points through that fence.
    this.createSheep(map);
    this.createChickens(map, [...obstacles, ...objectBodies]);
    this.createCows(map);
    this.createPigs(map);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.player.sprite, true);

    const resize = () => {
      const { width, height } = this.scale.gameSize;

      camera.setZoom(
        Math.max(width / map.widthInPixels, height / map.heightInPixels),
      );
    };

    resize();
    this.scale.on(Phaser.Scale.Events.RESIZE, resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, resize);
      this.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.keepAnimalsInsideAreas,
        this,
      );
      this.ufoTrigger?.destroy();
      this.ufo?.destroy();
    });

    this.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      this.keepAnimalsInsideAreas,
      this,
    );
  }

  update(time: number, delta: number) {
    this.player?.update();
    updateWanderers(
      this.sheepWanderers,
      this.sheepArea,
      time,
      delta,
      ANIMAL_CONFIGS.sheep,
    );
    updateWanderers(
      this.chickenWanderers,
      this.chickenArea,
      time,
      delta,
      ANIMAL_CONFIGS.chicken,
    );
    updateWanderers(
      this.cowWanderers,
      this.cowArea,
      time,
      delta,
      ANIMAL_CONFIGS.cow,
    );
    updateWanderers(
      this.pigWanderers,
      this.pigArea,
      time,
      delta,
      ANIMAL_CONFIGS.pig,
    );
  }

  private createSheep(map: Phaser.Tilemaps.Tilemap) {
    this.sheepWanderers = this.createAnimals(
      map,
      ANIMAL_CONFIGS.sheep,
      this.sheepArea,
    );
  }

  private createChickens(
    map: Phaser.Tilemaps.Tilemap,
    obstacles: Phaser.Physics.Arcade.StaticBody[],
  ) {
    this.chickenWanderers = this.createAnimals(
      map,
      ANIMAL_CONFIGS.chicken,
      this.chickenArea,
      obstacles,
    );
  }

  private createCows(map: Phaser.Tilemaps.Tilemap) {
    this.cowWanderers = this.createAnimals(
      map,
      ANIMAL_CONFIGS.cow,
      this.cowArea,
    );
  }

  private createPigs(map: Phaser.Tilemaps.Tilemap) {
    this.pigWanderers = this.createAnimals(
      map,
      ANIMAL_CONFIGS.pig,
      this.pigArea,
    );
  }

  private createUfoTrigger(map: Phaser.Tilemaps.Tilemap) {
    const trigger = findMapObject(
      map,
      ObjectLayers.events,
      EventKeys.ufoTrigger,
    );

    if (
      !trigger ||
      trigger.width === undefined ||
      trigger.height === undefined
    ) {
      throw new Error(
        `Unable to find ${EventKeys.ufoTrigger} in the ${ObjectLayers.events} object layer`,
      );
    }

    this.ufoTrigger = this.physics.add.staticBody(
      trigger.x ?? 0,
      trigger.y ?? 0,
      trigger.width,
      trigger.height,
    );
    this.physics.add.overlap(
      this.player!.sprite,
      this.ufoTrigger,
      this.startUfoEvent,
      undefined,
      this,
    );
  }

  private startUfoEvent() {
    if (this.ufoEventStarted || !this.ufo) return;

    this.ufoEventStarted = true;
    const cow =
      this.cowWanderers[Phaser.Math.Between(0, this.cowWanderers.length - 1)];

    if (!cow) return;

    this.ufo.abduct(cow.animal, () => {
      this.cowWanderers = this.cowWanderers.filter(
        (wanderer) => wanderer !== cow,
      );
    });
  }

  private createAnimals(
    map: Phaser.Tilemaps.Tilemap,
    config: AnimalConfig,
    area: Phaser.Geom.Rectangle | undefined,
    obstacles: Phaser.Physics.Arcade.StaticBody[] = [],
  ) {
    const spawn = findMapObject(map, ObjectLayers.npc, config.spawnKey);

    if (!spawn) {
      throw new Error(
        `Unable to find ${config.spawnKey} in the ${ObjectLayers.npc} object layer`,
      );
    }

    if (!area) return [];

    const movementBounds = getMovementBounds(area, config.halfFrameSize);
    const spawnPoint = new Phaser.Math.Vector2(spawn.x ?? 0, spawn.y ?? 0);
    const occupied: Phaser.Math.Vector2[] = [];

    return Array.from({ length: config.count }, (_, index) => {
      const position = getSpawnPosition(
        spawnPoint,
        movementBounds,
        occupied,
        index,
        config,
      );
      occupied.push(position);

      const animal = new Animal(this, config.kind, position.x, position.y);
      if (obstacles.length > 0) {
        animal.collideWith(obstacles);
      }

      return createWanderer(animal, position, movementBounds, config);
    });
  }

  private keepAnimalsInsideAreas() {
    clampWanderersToBounds(
      this.sheepWanderers,
      this.sheepArea,
      ANIMAL_CONFIGS.sheep,
    );
    clampWanderersToBounds(
      this.chickenWanderers,
      this.chickenArea,
      ANIMAL_CONFIGS.chicken,
    );
    clampWanderersToBounds(this.cowWanderers, this.cowArea, ANIMAL_CONFIGS.cow);
    clampWanderersToBounds(this.pigWanderers, this.pigArea, ANIMAL_CONFIGS.pig);
  }
}
