import Phaser from 'phaser';

import { getBaseY } from '@/game/depth';
import {
  ANIMAL_ANIMATIONS,
  ANIMAL_DEFINITIONS,
  ANIMAL_SPRITESHEET,
  type AnimalAnimation,
  type AnimalFacing,
  type AnimalKind,
} from '@/game/entities/animal-definitions';

const FACING_SPEED_THRESHOLD = 2;
const FACING_CHANGE_COOLDOWN = 200;

type VelocityOptions = {
  /** Skip command-based facing updates when facing is driven by actual motion. */
  updateFacing?: boolean;
};

export class Animal {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly colliders = new Set<Phaser.Physics.Arcade.Collider>();
  private facing: AnimalFacing = 'left';
  private lastFacingChangeAt = Number.NEGATIVE_INFINITY;
  private abducted = false;

  static preload(scene: Phaser.Scene) {
    for (const { texture, url } of Object.values(ANIMAL_DEFINITIONS)) {
      if (!scene.textures.exists(texture)) {
        scene.load.spritesheet(texture, url, ANIMAL_SPRITESHEET);
      }
    }
  }

  constructor(
    private readonly scene: Phaser.Scene,
    readonly kind: AnimalKind,
    x: number,
    y: number,
  ) {
    const { texture, body, scale } = ANIMAL_DEFINITIONS[kind];

    for (const [state, animation] of Object.entries(ANIMAL_ANIMATIONS)) {
      const key = `${texture}-${state}`;

      if (!scene.anims.exists(key)) {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(texture, {
            frames: [...animation.frames],
          }),
          frameRate: animation.frameRate,
          repeat: -1,
        });
      }
    }

    this.sprite = scene.physics.add.sprite(x, y, texture, 0);
    this.sprite.setScale(scale);
    // Ground footprints exclude the head and transparent frame padding.
    // Each footprint is symmetric, so flipX keeps collisions under the feet.
    this.sprite.setBodySize(body.width, body.height, false);
    this.sprite.setOffset(body.x, body.y);
    this.sprite.setPushable(false);
    const physicsBody = this.sprite.body;
    if (!(physicsBody instanceof Phaser.Physics.Arcade.Body)) {
      throw new Error('Animal sprites require a dynamic Arcade Physics body');
    }
    physicsBody.setAllowGravity(false);
    this.sprite.setCollideWorldBounds(true);
    this.play('idle');
    this.updateDepth();

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateDepth, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.sprite.once(Phaser.GameObjects.Events.DESTROY, this.cleanup, this);
  }

  play(state: AnimalAnimation) {
    this.sprite.play(`${ANIMAL_DEFINITIONS[this.kind].texture}-${state}`, true);
    return this;
  }

  setFacing(facing: AnimalFacing) {
    if (this.facing === facing) return this;

    this.facing = facing;
    this.sprite.setFlipX(facing === 'right');
    this.lastFacingChangeAt = this.scene.time.now;
    return this;
  }

  /** Update facing from measured motion without reacting to brief reversals. */
  setFacingFromMovement(facing: AnimalFacing) {
    if (
      facing === this.facing ||
      this.scene.time.now - this.lastFacingChangeAt >= FACING_CHANGE_COOLDOWN
    ) {
      this.setFacing(facing);
    }

    return this;
  }

  /** Velocity is in world pixels per second; vertical motion keeps facing. */
  setVelocity(x: number, y: number, options: VelocityOptions = {}) {
    this.sprite.setVelocity(x, y);

    // Ignore tiny horizontal components from mostly vertical movement. They
    // can change sign from frame to frame and make an animal flicker between
    // left and right while it appears to stand still.
    if (
      options.updateFacing !== false &&
      Math.abs(x) >= FACING_SPEED_THRESHOLD
    ) {
      const facing = x > 0 ? 'right' : 'left';
      this.setFacingFromMovement(facing);
    }

    return this.play(x !== 0 || y !== 0 ? 'walk' : 'idle');
  }

  stop() {
    return this.setVelocity(0, 0);
  }

  setAbducted(abducted: boolean) {
    this.abducted = abducted;
    if (abducted) this.stop();
    return this;
  }

  get isAbducted() {
    return this.abducted;
  }

  /** Call explicitly when integrating with a player, obstacles or animals. */
  collideWith(target: Phaser.Types.Physics.Arcade.ArcadeColliderType) {
    const collider = this.scene.physics.add.collider(this.sprite, target);
    this.colliders.add(collider);
    return collider;
  }

  destroy() {
    this.sprite.destroy();
  }

  private updateDepth() {
    const body = this.sprite.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      this.sprite.setDepth(
        getBaseY(this.sprite, body.offset.y + body.sourceHeight),
      );
    }
  }

  private cleanup() {
    this.scene.events.off(
      Phaser.Scenes.Events.POST_UPDATE,
      this.updateDepth,
      this,
    );
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    for (const collider of this.colliders) {
      // A caller may have already destroyed a returned collider.
      if (collider.world) collider.destroy();
    }

    this.colliders.clear();
  }
}
