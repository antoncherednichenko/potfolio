import { describe, expect, it } from 'vitest';

import {
  getObjectCollisionBounds,
  type TiledTileset,
} from '@/game/object-collisions';

const shape = { x: 10, y: 20, width: 30, height: 40 };
const tilesets: TiledTileset[] = [
  {
    firstgid: 216,
    tiles: [{ id: 0, objectgroup: { objects: [shape] } }],
  },
];
const image = {
  x: 100,
  y: 200,
  width: 100,
  height: 100,
  displayOriginX: 50,
  displayOriginY: 50,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
};

describe('Tiled object collisions', () => {
  it('places the embedded shape in world coordinates instead of blocking the whole image', () => {
    expect(getObjectCollisionBounds(tilesets, 216, image)).toEqual([
      { x: 60, y: 170, width: 30, height: 40 },
    ]);
  });

  it('scales collision offsets and dimensions with the object', () => {
    expect(
      getObjectCollisionBounds(tilesets, 216, {
        ...image,
        scaleX: 2,
        scaleY: 0.5,
      }),
    ).toEqual([{ x: 20, y: 185, width: 60, height: 20 }]);
  });

  it('mirrors embedded shapes when the image is flipped', () => {
    expect(
      getObjectCollisionBounds(tilesets, 216, {
        ...image,
        flipX: true,
        flipY: true,
      }),
    ).toEqual([{ x: 110, y: 190, width: 30, height: 40 }]);
  });

  it('rotates collision bounds with the object', () => {
    const [bounds] = getObjectCollisionBounds(tilesets, 216, {
      ...image,
      rotation: Math.PI / 2,
    });
    expect(bounds.x).toBeCloseTo(90);
    expect(bounds.y).toBeCloseTo(160);
    expect(bounds.width).toBeCloseTo(40);
    expect(bounds.height).toBeCloseTo(30);
  });

  it('handles multiple shapes and skips disabled or empty shapes', () => {
    const sets: TiledTileset[] = [
      {
        firstgid: 47,
        tiles: [
          {
            id: 2,
            objectgroup: {
              objects: [
                shape,
                { ...shape, x: 50 },
                { ...shape, width: 0 },
                {
                  ...shape,
                  properties: [{ name: 'enabled', value: false }],
                },
              ],
            },
          },
        ],
      },
    ];
    expect(getObjectCollisionBounds(sets, 49, image)).toEqual([
      { x: 60, y: 170, width: 30, height: 40 },
      { x: 100, y: 170, width: 30, height: 40 },
    ]);
    expect(getObjectCollisionBounds(sets, 47, image)).toEqual([]);
  });

  it('does not create obstacles for tiles without embedded collisions', () => {
    expect(getObjectCollisionBounds([{ firstgid: 1 }], 1, image)).toEqual([]);
  });
});
