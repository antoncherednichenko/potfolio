import Phaser from 'phaser';

import { getObjectDepth } from '@/game/depth';
import {
  getObjectCollisionBounds,
  type TiledTileset,
} from '@/game/object-collisions';

export function createObjectLayer(
  map: Phaser.Tilemaps.Tilemap,
  name: string,
  sourceTilesets: TiledTileset[],
) {
  const bodies: Phaser.Physics.Arcade.StaticBody[] = [];
  const layer = map.getObjectLayer(name);
  if (!layer) return bodies;

  for (const { id, gid } of layer.objects) {
    if (gid === undefined) continue;

    const tileset = map.tilesets.find((set) => set.containsTileIndex(gid));
    const coordinates = tileset?.getTileTextureCoordinates(gid);
    const texture = tileset?.image;

    if (!tileset || !coordinates || !texture) {
      throw new Error(`Unable to render object ${id} in ${name}: tile ${gid}`);
    }

    // Images are loaded without spritesheet frames. Define the exact tile crop,
    // including whole images from collections, before creating the object.
    const { x, y } = coordinates as { x: number; y: number };
    const frame = `tile-${tileset.firstgid}-${gid}`;
    if (!texture.has(frame)) {
      texture.add(frame, 0, x, y, tileset.tileWidth, tileset.tileHeight);
    }

    const objects = map.createFromObjects(name, {
      id,
      key: texture.key,
      frame,
      classType: Phaser.GameObjects.Image,
    });

    for (const object of objects) {
      if (object instanceof Phaser.GameObjects.Image) {
        const collisionBounds = getObjectCollisionBounds(
          sourceTilesets,
          gid,
          object,
        );
        object.setDepth(getObjectDepth(object, collisionBounds));
        object.setAlpha(object.alpha * layer.opacity);
        object.setVisible(object.visible && layer.visible);

        if (object.getData('enabled') === false) continue;

        for (const bounds of collisionBounds) {
          bodies.push(
            map.scene.physics.add.staticBody(
              bounds.x,
              bounds.y,
              bounds.width,
              bounds.height,
            ),
          );
        }
      }
    }
  }

  return bodies;
}
