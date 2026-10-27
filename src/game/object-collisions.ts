import type Phaser from 'phaser';

type CollisionRectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties?: { name: string; value: unknown }[];
};

export type TiledTileset = {
  firstgid: number;
  tiles?: {
    id: number;
    objectgroup?: { objects: CollisionRectangle[] };
  }[];
};

type ObjectTransform = Pick<
  Phaser.GameObjects.Image,
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'displayOriginX'
  | 'displayOriginY'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'flipX'
  | 'flipY'
>;

export function getObjectCollisionBounds(
  tilesets: TiledTileset[],
  gid: number,
  image: ObjectTransform,
) {
  // Phaser discards per-tile objectgroups when parsing image collections.
  // Read the original Tiled data for both collections and regular tilesets.
  const tile = tilesets
    .flatMap((set) =>
      (set.tiles ?? []).filter((tile) => set.firstgid + tile.id === gid),
    )
    .at(0);
  const shapes = tile?.objectgroup?.objects ?? [];
  const cos = Math.cos(image.rotation);
  const sin = Math.sin(image.rotation);

  return shapes
    .filter(
      (shape) =>
        shape.width > 0 &&
        shape.height > 0 &&
        !shape.properties?.some(
          ({ name, value }) => name === 'enabled' && value === false,
        ),
    )
    .map((shape) => {
      const angle = ((shape.rotation ?? 0) * Math.PI) / 180;
      const corners = [
        [0, 0],
        [shape.width, 0],
        [shape.width, shape.height],
        [0, shape.height],
      ].map(([dx, dy]) => {
        let x = shape.x + dx * Math.cos(angle) - dy * Math.sin(angle);
        let y = shape.y + dx * Math.sin(angle) + dy * Math.cos(angle);
        if (image.flipX) x = image.width - x;
        if (image.flipY) y = image.height - y;
        x = (x - image.displayOriginX) * image.scaleX;
        y = (y - image.displayOriginY) * image.scaleY;

        return {
          x: image.x + x * cos - y * sin,
          y: image.y + x * sin + y * cos,
        };
      });

      // Arcade bodies are axis-aligned; rotated rectangles use their bounds.
      const x = Math.min(...corners.map((point) => point.x));
      const y = Math.min(...corners.map((point) => point.y));
      return {
        x,
        y,
        width: Math.max(...corners.map((point) => point.x)) - x,
        height: Math.max(...corners.map((point) => point.y)) - y,
      };
    });
}
