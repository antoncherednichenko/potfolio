import { describe, expect, it } from 'vitest';

import { getBaseY, getObjectDepth } from '@/game/depth';
import { getObjectCollisionBounds } from '@/game/object-collisions';

const tree = {
  y: 160,
  width: 64,
  height: 80,
  displayOriginX: 32,
  displayOriginY: 40,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
};

describe('world depth anchors', () => {
  it('keeps the player in front of roots when the tree texture has bottom padding', () => {
    const footprint = getObjectCollisionBounds(
      [
        {
          firstgid: 1,
          tiles: [
            {
              id: 0,
              objectgroup: {
                objects: [{ x: 27, y: 48, width: 10, height: 16 }],
              },
            },
          ],
        },
      ],
      1,
      { ...tree, x: 100, flipX: false, flipY: false },
    );
    const player = {
      ...tree,
      y: 177,
      width: 32,
      height: 32,
      displayOriginX: 16,
      displayOriginY: 16,
    };

    expect(getObjectDepth(tree, footprint)).toBe(184);
    expect(getBaseY(player, 24)).toBe(185);
    expect(getBaseY(player, 24)).toBeGreaterThan(
      getObjectDepth(tree, footprint),
    );
    expect(getBaseY(player, 24)).toBeLessThan(getBaseY(tree));
  });

  it('falls back to the image base without a footprint and uses the frontmost ground shape', () => {
    expect(getObjectDepth(tree, [])).toBe(200);
    expect(
      getObjectDepth(tree, [
        { y: 130, height: 20 },
        { y: 120, height: 10 },
      ]),
    ).toBe(150);
  });

  it('recovers the Tiled bottom Y after Phaser centers a tile object', () => {
    expect(getBaseY(tree)).toBe(200);
  });

  it('sorts overlapping trees by their bases regardless of height or creation order', () => {
    const tallBackTree = {
      ...tree,
      y: 120,
      height: 160,
      displayOriginY: 80,
    };
    const shortFrontTree = { ...tree, y: 170 };

    for (const objects of [
      [shortFrontTree, tallBackTree],
      [tallBackTree, shortFrontTree],
    ]) {
      expect(objects.sort((a, b) => getBaseY(a) - getBaseY(b))).toEqual([
        tallBackTree,
        shortFrontTree,
      ]);
    }
  });

  it('accounts for bottom origins, nonuniform scale and translated positions', () => {
    expect(getBaseY({ ...tree, y: 220, displayOriginY: 80, scaleY: 2 })).toBe(
      220,
    );
    expect(getBaseY({ ...tree, y: -30, scaleY: 0.5 })).toBe(-10);
  });

  it('transforms the base anchor around a noncentral origin when rotated', () => {
    expect(
      getBaseY({
        ...tree,
        displayOriginX: 0,
        displayOriginY: 0,
        scaleX: 2,
        scaleY: 0.5,
        rotation: Math.PI / 2,
      }),
    ).toBeCloseTo(224);
  });

  it('moves the player from behind to in front using feet rather than frame padding', () => {
    const player = {
      ...tree,
      width: 32,
      height: 32,
      displayOriginX: 16,
      displayOriginY: 16,
    };
    const footY = 16 + 8;

    // At y=190 the frame bottom is 206, but the feet are still behind y=200.
    expect(getBaseY({ ...player, y: 190 }, footY)).toBe(198);
    expect(getBaseY({ ...player, y: 190 }, footY)).toBeLessThan(getBaseY(tree));
    expect(getBaseY({ ...player, y: 194 }, footY)).toBeGreaterThan(
      getBaseY(tree),
    );
    expect(getBaseY({ ...player, y: 190, scaleY: 2 }, footY)).toBe(206);
  });
});
