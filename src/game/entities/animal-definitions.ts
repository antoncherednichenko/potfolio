export const ANIMAL_SPRITESHEET = {
  frameWidth: 32,
  frameHeight: 32,
  margin: 0,
  spacing: 0,
} as const;

// Every source sheet is 64×64: idle on the first row, walk on the second.
// The artwork faces left. Right-facing sprites use flipX, not negative scale.
export const ANIMAL_ANIMATIONS = {
  idle: { frames: [0, 1], frameRate: 2 },
  walk: { frames: [2, 3], frameRate: 6 },
} as const;

export const ANIMAL_DEFINITIONS = {
  chicken: {
    texture: 'animal-chicken',
    url: '/assets/game/Animals/Chicken/Chicken.png',
    scale: 1,
    body: { x: 11, y: 19, width: 10, height: 4 },
  },
  cow: {
    texture: 'animal-cow',
    url: '/assets/game/Animals/Cow/Cow.png',
    scale: 1.2,
    body: { x: 7, y: 20, width: 18, height: 6 },
  },
  pig: {
    texture: 'animal-pig',
    url: '/assets/game/Animals/Pig/Pig.png',
    scale: 1,
    body: { x: 7, y: 18, width: 18, height: 5 },
  },
  sheep: {
    texture: 'animal-sheep',
    url: '/assets/game/Animals/Sheep/Sheep.png',
    scale: 1,
    body: { x: 8, y: 18, width: 16, height: 5 },
  },
} as const;

export type AnimalKind = keyof typeof ANIMAL_DEFINITIONS;
export type AnimalAnimation = keyof typeof ANIMAL_ANIMATIONS;
export type AnimalFacing = 'left' | 'right';
