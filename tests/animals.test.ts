import { describe, expect, it } from 'vitest';

import {
  ANIMAL_ANIMATIONS,
  ANIMAL_DEFINITIONS,
  ANIMAL_SPRITESHEET,
} from '@/game/entities/animal-definitions';

describe('animal sprite preparation', () => {
  it('describes every source animal sheet as a 2×2 32px sheet', () => {
    expect(Object.keys(ANIMAL_DEFINITIONS)).toEqual([
      'chicken',
      'cow',
      'pig',
      'sheep',
    ]);
    expect(ANIMAL_SPRITESHEET).toEqual({
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    });
  });

  it('keeps idle and walk frames separate and loops both animations', () => {
    expect(ANIMAL_ANIMATIONS.idle.frames).toEqual([0, 1]);
    expect(ANIMAL_ANIMATIONS.walk.frames).toEqual([2, 3]);
    expect(ANIMAL_ANIMATIONS.idle.frameRate).toBeGreaterThan(0);
    expect(ANIMAL_ANIMATIONS.walk.frameRate).toBeGreaterThan(0);
  });

  it('defines a compact, grounded collision footprint for every animal', () => {
    for (const { body } of Object.values(ANIMAL_DEFINITIONS)) {
      expect(body.width).toBeGreaterThan(0);
      expect(body.height).toBeGreaterThan(0);
      expect(body.x + body.width / 2).toBe(16);
      expect(body.x + body.width).toBeLessThanOrEqual(32);
      expect(body.y + body.height).toBeLessThanOrEqual(32);
    }
  });
});
