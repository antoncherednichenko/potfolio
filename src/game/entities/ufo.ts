import Phaser from 'phaser';

import { Animal } from '@/game/entities/animal';

const UFO_TEXTURE = 'ufo-normal';
const UFO_URL = '/assets/game/Enemies/UFONormal.png';
const BEAM_TEXTURE = 'ufo-abduction-beam';
const BEAM_URL = '/assets/game/Enemies/UFOAbductionBeamNormal.png';

// Both assets are 30-frame, 80x80 horizontal spritesheets. The transparent
// padding is part of the art: it keeps the UFO and its beam on the same grid.
const FRAME_SIZE = 80;
const FRAME_COUNT = 30;
const FRAME_RATE = 12;

// Keep the UFO close to the size used by the previous implementation while
// retaining the new sheet's proportions.
const DISPLAY_SIZE = 96;
const DISPLAY_SCALE = DISPLAY_SIZE / FRAME_SIZE;
const BEAM_REACH = 52;

// In the source frames the UFO ends around y=54 and the beam begins around
// y=42. The beam sprite uses a top origin, so this offset makes those opaque
// pixels meet below the saucer without stretching or drawing a second beam.
const UFO_ART_BOTTOM = 54;
const BEAM_ART_TOP = 42;
const BEAM_OFFSET_Y =
  (UFO_ART_BOTTOM - FRAME_SIZE / 2 - BEAM_ART_TOP) * DISPLAY_SCALE;

const UFO_DEPTH = 10_000;
const ARRIVAL_DURATION = 1_500;
const ABDUCTION_DURATION = 1_400;
const DEPARTURE_DURATION = 1_100;
const BEAM_ANIMATION = `${BEAM_TEXTURE}-loop`;
const UFO_ANIMATION = `${UFO_TEXTURE}-loop`;

export class Ufo {
  private readonly image: Phaser.GameObjects.Sprite;
  private readonly beam: Phaser.GameObjects.Sprite;
  private activeTween?: Phaser.Tweens.Tween;
  private destroyed = false;

  static preload(scene: Phaser.Scene) {
    if (!scene.textures.exists(UFO_TEXTURE)) {
      scene.load.spritesheet(UFO_TEXTURE, UFO_URL, {
        frameWidth: FRAME_SIZE,
        frameHeight: FRAME_SIZE,
      });
    }

    if (!scene.textures.exists(BEAM_TEXTURE)) {
      scene.load.spritesheet(BEAM_TEXTURE, BEAM_URL, {
        frameWidth: FRAME_SIZE,
        frameHeight: FRAME_SIZE,
      });
    }
  }

  constructor(private readonly scene: Phaser.Scene) {
    Ufo.createAnimations(scene);

    this.image = scene.add
      .sprite(0, 0, UFO_TEXTURE, 0)
      .setScale(DISPLAY_SCALE)
      .setDepth(UFO_DEPTH)
      .setVisible(false);
    this.beam = scene.add
      .sprite(0, 0, BEAM_TEXTURE, 0)
      .setOrigin(0.5, 0)
      .setScale(DISPLAY_SCALE)
      .setDepth(UFO_DEPTH - 1)
      .setVisible(false);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      this.syncBeamPosition,
      this,
    );
  }

  abduct(cow: Animal, onComplete: () => void) {
    if (this.destroyed || this.image.visible) return;

    cow.setAbducted(true);
    const targetX = cow.sprite.x;
    const targetY = cow.sprite.y - BEAM_REACH;

    this.image
      .stop()
      .setFrame(0)
      .play(UFO_ANIMATION)
      .setPosition(targetX - 260, targetY - 180)
      .setVisible(true);

    this.activeTween = this.scene.tweens.add({
      targets: this.image,
      x: targetX,
      y: targetY,
      duration: ARRIVAL_DURATION,
      ease: 'Sine.easeInOut',
      onComplete: () => this.beginBeam(cow, onComplete),
    });
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;
    this.activeTween?.stop();
    this.scene.events.off(
      Phaser.Scenes.Events.POST_UPDATE,
      this.syncBeamPosition,
      this,
    );
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.beam.destroy();
    this.image.destroy();
  }

  private beginBeam(cow: Animal, onComplete: () => void) {
    if (this.destroyed) return;

    this.beam.setFrame(0).play(BEAM_ANIMATION, true).setVisible(true);
    this.syncBeamPosition();

    this.activeTween = this.scene.tweens.add({
      targets: cow.sprite,
      x: this.image.x,
      y: this.image.y + 6,
      duration: ABDUCTION_DURATION,
      ease: 'Sine.easeIn',
      onComplete: () => {
        cow.sprite.setVisible(false);
        this.scene.time.delayedCall(260, () => this.depart(cow, onComplete));
      },
    });
  }

  private depart(cow: Animal, onComplete: () => void) {
    if (this.destroyed) return;

    this.beam.stop().setFrame(0).setVisible(false);
    this.image.play(UFO_ANIMATION, true);
    this.activeTween = this.scene.tweens.add({
      targets: this.image,
      x: this.image.x + 260,
      y: this.image.y - 190,
      duration: DEPARTURE_DURATION,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.image.setVisible(false);
        onComplete();
        cow.destroy();
      },
    });
  }

  private syncBeamPosition() {
    if (!this.beam.visible) return;

    this.beam.setPosition(this.image.x, this.image.y + BEAM_OFFSET_Y);
  }

  private static createAnimations(scene: Phaser.Scene) {
    if (!scene.anims.exists(UFO_ANIMATION)) {
      scene.anims.create({
        key: UFO_ANIMATION,
        frames: scene.anims.generateFrameNumbers(UFO_TEXTURE, {
          start: 0,
          end: FRAME_COUNT - 1,
        }),
        frameRate: FRAME_RATE,
        repeat: -1,
      });
    }

    if (!scene.anims.exists(BEAM_ANIMATION)) {
      scene.anims.create({
        key: BEAM_ANIMATION,
        frames: scene.anims.generateFrameNumbers(BEAM_TEXTURE, {
          start: 0,
          end: FRAME_COUNT - 1,
        }),
        frameRate: FRAME_RATE,
        repeat: -1,
      });
    }
  }
}
