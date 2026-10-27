import Phaser from 'phaser';

import { getBaseY } from '@/game/depth';

const TEXTURE = 'player';
const FRAME_SIZE = 32;
const FRAMES_PER_ROW = 6;
const SPEED = 80;
const BODY_WIDTH = 12;
const BODY_HEIGHT = 8;
const ANIMATION_ROWS = {
  down: { idle: 0, walk: 3 },
  side: { idle: 1, walk: 4 },
  up: { idle: 2, walk: 5 },
} as const;

type Direction = keyof typeof ANIMATION_ROWS;
type MovementKeys = Record<
  'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd',
  Phaser.Input.Keyboard.Key
>;

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly keys?: MovementKeys;
  private readonly movement = new Phaser.Math.Vector2();
  private direction: Direction = 'down';

  static preload(scene: Phaser.Scene) {
    // 192×320 sheet: 6×10 square frames, without spacing or margins.
    scene.load.spritesheet(TEXTURE, '/assets/game/Player/Player.png', {
      frameWidth: FRAME_SIZE,
      frameHeight: FRAME_SIZE,
    });
  }

  constructor(
    scene: Phaser.Scene,
    bounds: Phaser.Geom.Rectangle,
    spawn = new Phaser.Math.Vector2(bounds.centerX, bounds.centerY),
  ) {
    for (const [direction, rows] of Object.entries(ANIMATION_ROWS)) {
      for (const [state, row] of Object.entries(rows)) {
        const key = `${TEXTURE}-${state}-${direction}`;

        if (!scene.anims.exists(key)) {
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(TEXTURE, {
              start: row * FRAMES_PER_ROW,
              end: (row + 1) * FRAMES_PER_ROW - 1,
            }),
            frameRate: state === 'walk' ? 10 : 6,
            repeat: -1,
          });
        }
      }
    }

    this.sprite = scene.physics.add.sprite(spawn.x, spawn.y, TEXTURE);
    // Only the feet collide, so the character can walk behind tall objects.
    this.sprite.setSize(BODY_WIDTH, BODY_HEIGHT);
    this.sprite.setOffset((FRAME_SIZE - BODY_WIDTH) / 2, FRAME_SIZE / 2);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play(`${TEXTURE}-idle-down`);

    this.updateDepth();
    // Arcade synchronizes the sprite after movement/collision resolution in
    // POST_UPDATE. Sort using that final position before the scene renders.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateDepth, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.updateDepth,
        this,
      );
    });

    const keyboard = scene.input.keyboard;

    if (keyboard) {
      this.keys = {
        up: keyboard.addKey('UP'),
        down: keyboard.addKey('DOWN'),
        left: keyboard.addKey('LEFT'),
        right: keyboard.addKey('RIGHT'),
        w: keyboard.addKey('W'),
        a: keyboard.addKey('A'),
        s: keyboard.addKey('S'),
        d: keyboard.addKey('D'),
      };
    }
  }

  private updateDepth() {
    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) return;

    // The sheet has transparent pixels below the feet. Use the existing foot
    // body's lower edge in texture coordinates without changing its geometry.
    this.sprite.setDepth(
      getBaseY(this.sprite, body.offset.y + body.sourceHeight),
    );
  }

  update() {
    const keys = this.keys;

    if (!keys) return;

    const x =
      Number(keys.right.isDown || keys.d.isDown) -
      Number(keys.left.isDown || keys.a.isDown);
    const y =
      Number(keys.down.isDown || keys.s.isDown) -
      Number(keys.up.isDown || keys.w.isDown);

    this.movement.set(x, y).normalize();

    this.sprite.setVelocity(this.movement.x * SPEED, this.movement.y * SPEED);

    if (x !== 0) {
      this.direction = 'side';
      this.sprite.setFlipX(x < 0);
    } else if (y !== 0) {
      this.direction = y < 0 ? 'up' : 'down';
      this.sprite.setFlipX(false);
    }

    const state = x !== 0 || y !== 0 ? 'walk' : 'idle';
    this.sprite.play(`${TEXTURE}-${state}-${this.direction}`, true);
  }
}
