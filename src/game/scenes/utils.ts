import Phaser from 'phaser';

import type { Animal } from '@/game/entities/animal';
import {
  ObjectProperties,
  WanderSettings,
  type AnimalConfig,
} from './constants';

export type AnimalWanderer = {
  animal: Animal;
  target: Phaser.Math.Vector2;
  pauseUntil: number;
  targetTimeoutAt: number;
  lastProgressAt: number;
  lastProgressPosition: Phaser.Math.Vector2;
  lastObservedPosition: Phaser.Math.Vector2;
};

const normalizeName = (name: string | undefined) => name?.trim().toLowerCase();

export function findMapObject(
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  objectName: string,
) {
  return map
    .getObjectLayer(layerName)
    ?.objects.find(
      ({ name }) => normalizeName(name) === normalizeName(objectName),
    );
}

export function getAnimalArea(
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  areaName: string,
) {
  const area = findMapObject(map, layerName, areaName);

  if (!area || area.width === undefined || area.height === undefined) {
    throw new Error(
      `Unable to find ${areaName} in the ${layerName} object layer`,
    );
  }

  return new Phaser.Geom.Rectangle(
    area.x ?? 0,
    area.y ?? 0,
    area.width,
    area.height,
  );
}

export function getPlayerSpawn(
  map: Phaser.Tilemaps.Tilemap,
  layerName: string,
  spawnName: string,
) {
  const spawn = findMapObject(map, layerName, spawnName);

  if (!spawn) {
    throw new Error(
      `Unable to find ${spawnName} in the ${layerName} object layer`,
    );
  }

  return new Phaser.Math.Vector2(spawn.x ?? 0, spawn.y ?? 0);
}

export function getMovementBounds(
  area: Phaser.Geom.Rectangle,
  halfFrameSize: number,
) {
  return new Phaser.Geom.Rectangle(
    area.left + halfFrameSize,
    area.top + halfFrameSize,
    Math.max(0, area.width - halfFrameSize * 2),
    Math.max(0, area.height - halfFrameSize * 2),
  );
}

export function getSpawnPosition(
  spawn: Phaser.Math.Vector2,
  movementBounds: Phaser.Geom.Rectangle,
  occupied: Phaser.Math.Vector2[],
  index: number,
  config: AnimalConfig,
) {
  const left = Math.max(movementBounds.left, spawn.x - config.spawnRadius);
  const right = Math.min(movementBounds.right, spawn.x + config.spawnRadius);
  const top = Math.max(movementBounds.top, spawn.y - config.spawnRadius);
  const bottom = Math.min(movementBounds.bottom, spawn.y + config.spawnRadius);

  for (let attempt = 0; attempt < WanderSettings.spawnAttempts; attempt += 1) {
    const candidate = new Phaser.Math.Vector2(
      Phaser.Math.FloatBetween(left, right),
      Phaser.Math.FloatBetween(top, bottom),
    );

    if (
      occupied.every(
        (other) =>
          Phaser.Math.Distance.BetweenPoints(candidate, other) >=
          config.minSpawnDistance,
      )
    ) {
      return candidate;
    }
  }

  const angle = (index / config.count) * Math.PI * 2;
  const fallback = new Phaser.Math.Vector2(
    spawn.x +
      Math.cos(angle) *
        config.spawnRadius *
        WanderSettings.fallbackRadiusFactor,
    spawn.y +
      Math.sin(angle) *
        config.spawnRadius *
        WanderSettings.fallbackRadiusFactor,
  );

  return new Phaser.Math.Vector2(
    Phaser.Math.Clamp(fallback.x, movementBounds.left, movementBounds.right),
    Phaser.Math.Clamp(fallback.y, movementBounds.top, movementBounds.bottom),
  );
}

export function getTarget(
  movementBounds: Phaser.Geom.Rectangle,
  current: Phaser.Math.Vector2,
) {
  for (let attempt = 0; attempt < WanderSettings.targetAttempts; attempt += 1) {
    const target = new Phaser.Math.Vector2(
      Phaser.Math.FloatBetween(movementBounds.left, movementBounds.right),
      Phaser.Math.FloatBetween(movementBounds.top, movementBounds.bottom),
    );

    if (
      Phaser.Math.Distance.BetweenPoints(current, target) >
      WanderSettings.minTargetDistance
    ) {
      return target;
    }
  }

  return current.clone();
}

export function getTargetTimeout(
  current: Phaser.Math.Vector2,
  target: Phaser.Math.Vector2,
  startsAt: number,
  config: AnimalConfig,
) {
  const distance = Phaser.Math.Distance.BetweenPoints(current, target);
  const expectedTravelTime = (distance / config.speed) * 1000;

  return (
    startsAt +
    expectedTravelTime * config.targetTimeoutFactor +
    config.targetTimeoutGrace
  );
}

export function createWanderer(
  animal: Animal,
  position: Phaser.Math.Vector2,
  movementBounds: Phaser.Geom.Rectangle,
  config: AnimalConfig,
): AnimalWanderer {
  const target = getTarget(movementBounds, position);

  return {
    animal,
    target,
    pauseUntil: 0,
    targetTimeoutAt: getTargetTimeout(position, target, 0, config),
    lastProgressAt: 0,
    lastProgressPosition: position.clone(),
    lastObservedPosition: position.clone(),
  };
}

function setTarget(
  wanderer: AnimalWanderer,
  movementBounds: Phaser.Geom.Rectangle,
  sprite: Phaser.Physics.Arcade.Sprite,
  startsAt: number,
  config: AnimalConfig,
) {
  const current = new Phaser.Math.Vector2(sprite.x, sprite.y);
  wanderer.target = getTarget(movementBounds, current);
  wanderer.targetTimeoutAt = getTargetTimeout(
    current,
    wanderer.target,
    startsAt,
    config,
  );
  wanderer.lastProgressAt = startsAt;
  wanderer.lastProgressPosition.set(sprite.x, sprite.y);
}

function abandonTarget(
  wanderer: AnimalWanderer,
  movementBounds: Phaser.Geom.Rectangle,
  sprite: Phaser.Physics.Arcade.Sprite,
  time: number,
  config: AnimalConfig,
) {
  wanderer.animal.stop();
  wanderer.pauseUntil = time + config.stuckPause;
  setTarget(wanderer, movementBounds, sprite, wanderer.pauseUntil, config);
}

export function updateWanderers(
  wanderers: AnimalWanderer[],
  area: Phaser.Geom.Rectangle | undefined,
  time: number,
  delta: number,
  config: AnimalConfig,
) {
  if (!area) return;

  const movementBounds = getMovementBounds(area, config.halfFrameSize);
  const step = config.speed * (delta / 1000);

  for (const wanderer of wanderers) {
    const { animal } = wanderer;
    if (animal.isAbducted) {
      animal.stop();
      continue;
    }

    const sprite = animal.sprite;
    updateFacing(wanderer, config.facingDistanceThreshold);
    clampAnimalToBounds(animal, movementBounds);

    if (time < wanderer.pauseUntil) {
      animal.stop();
      continue;
    }

    const distance = Phaser.Math.Distance.Between(
      sprite.x,
      sprite.y,
      wanderer.target.x,
      wanderer.target.y,
    );

    if (
      distance <= config.targetReachRadius ||
      (step > 0 && distance <= step)
    ) {
      sprite.setPosition(wanderer.target.x, wanderer.target.y);
      animal.stop();
      wanderer.pauseUntil =
        time + Phaser.Math.Between(config.minPause, config.maxPause);
      setTarget(wanderer, movementBounds, sprite, wanderer.pauseUntil, config);
      continue;
    }

    if (time >= wanderer.targetTimeoutAt) {
      abandonTarget(wanderer, movementBounds, sprite, time, config);
      continue;
    }

    if (time - wanderer.lastProgressAt >= config.stuckCheckInterval) {
      const progress = Phaser.Math.Distance.BetweenPoints(
        wanderer.lastProgressPosition,
        sprite,
      );

      if (progress < config.minProgress) {
        abandonTarget(wanderer, movementBounds, sprite, time, config);
        continue;
      }

      wanderer.lastProgressAt = time;
      wanderer.lastProgressPosition.set(sprite.x, sprite.y);
    }

    const angle = Phaser.Math.Angle.Between(
      sprite.x,
      sprite.y,
      wanderer.target.x,
      wanderer.target.y,
    );
    animal.setVelocity(
      Math.cos(angle) * config.speed,
      Math.sin(angle) * config.speed,
      {
        updateFacing: false,
      },
    );
  }
}

function updateFacing(wanderer: AnimalWanderer, threshold: number) {
  const sprite = wanderer.animal.sprite;
  const deltaX = sprite.x - wanderer.lastObservedPosition.x;

  if (Math.abs(deltaX) >= threshold) {
    wanderer.animal.setFacingFromMovement(deltaX > 0 ? 'right' : 'left');
  }

  wanderer.lastObservedPosition.set(sprite.x, sprite.y);
}

export function clampAnimalToBounds(
  animal: Animal,
  movementBounds: Phaser.Geom.Rectangle,
) {
  if (animal.isAbducted) return;

  const sprite = animal.sprite;
  const x = Phaser.Math.Clamp(
    sprite.x,
    movementBounds.left,
    movementBounds.right,
  );
  const y = Phaser.Math.Clamp(
    sprite.y,
    movementBounds.top,
    movementBounds.bottom,
  );

  if (x !== sprite.x || y !== sprite.y) {
    sprite.setPosition(x, y);
    animal.stop();
  }
}

export function clampWanderersToBounds(
  wanderers: AnimalWanderer[],
  area: Phaser.Geom.Rectangle | undefined,
  config: AnimalConfig,
) {
  if (!area) return;

  const movementBounds = getMovementBounds(area, config.halfFrameSize);
  for (const { animal } of wanderers) {
    clampAnimalToBounds(animal, movementBounds);
  }
}

export function getEnabledCollisionObjects(
  map: Phaser.Tilemaps.Tilemap,
  layerNames: string[],
) {
  return layerNames.flatMap(
    (name) =>
      map
        .getObjectLayer(name)
        ?.objects.filter(
          ({ width, height, properties }) =>
            (width ?? 0) > 0 &&
            (height ?? 0) > 0 &&
            !properties?.some(
              (property: { name: string; value: unknown }) =>
                property.name === ObjectProperties.enabled &&
                property.value === false,
            ),
        )
        .map(({ x, y, width, height }) => ({
          x: x ?? 0,
          y: y ?? 0,
          width: width ?? 0,
          height: height ?? 0,
        })) ?? [],
  );
}
