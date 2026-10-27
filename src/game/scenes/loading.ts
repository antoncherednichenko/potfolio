import Phaser from 'phaser';

import { Animal } from '@/game/entities/animal';
import { Player } from '@/game/entities/player';
import { Ufo } from '@/game/entities/ufo';
import { AssetPaths, MapKeys, SceneKeys, TILESETS } from './constants';

const DOG_SOURCE_TEXTURE = 'loading-dog-source';
const DOG_TEXTURE = 'loading-dog-frame';
const DOG_URL = '/assets/game/Animals/Dog.png';
const DOG_ANIMATION = `${DOG_TEXTURE}-run`;
const DOG_SCALE = 0.65;
const DOG_FRAME_CANVAS_WIDTH = 200;
const DOG_FRAME_CANVAS_HEIGHT = 180;
const DOG_ART_BASELINE = 160;

// The running row in Dog.png is tightly packed and several poses cross the
// 181px cell boundaries. Crop the opaque bounds of each pose into its own
// canvas so a nose or tail can never reveal pixels from a neighboring pose.
const DOG_FRAME_BOUNDS = [
  { x: 9, y: 646, width: 195, height: 145 },
  { x: 206, y: 643, width: 162, height: 151 },
  { x: 394, y: 643, width: 160, height: 151 },
  { x: 573, y: 646, width: 152, height: 148 },
  { x: 738, y: 647, width: 163, height: 147 },
  { x: 907, y: 643, width: 172, height: 151 },
  { x: 1088, y: 643, width: 158, height: 148 },
  { x: 1267, y: 650, width: 169, height: 141 },
] as const;
const MINIMUM_LOADING_TIME = 400;

export class Loading extends Phaser.Scene {
  private progress = 0;
  private startedAt = 0;
  private progressTrack?: Phaser.GameObjects.Graphics;
  private progressFill?: Phaser.GameObjects.Graphics;
  private progressText?: Phaser.GameObjects.Text;
  private dog?: Phaser.GameObjects.Sprite;

  constructor() {
    super(SceneKeys.loading);
  }

  preload() {
    this.startedAt = Date.now();
    this.cameras.main.setBackgroundColor('#ffffff');

    this.progressTrack = this.add.graphics();
    this.progressFill = this.add.graphics();
    this.progressText = this.add
      .text(0, 0, 'Загрузка 0%', {
        color: '#000000',
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.layout();
    this.redrawProgress();

    this.load.on('progress', this.handleProgress, this);
    this.load.once(
      'filecomplete-image-loading-dog-source',
      this.createDog,
      this,
    );

    this.load.image(DOG_SOURCE_TEXTURE, DOG_URL);
    Player.preload(this);
    Animal.preload(this);
    Ufo.preload(this);
    this.load.tilemapTiledJSON(MapKeys.world, AssetPaths.world);

    for (const { name, url } of TILESETS) {
      this.load.image(name, url);
    }

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  create() {
    this.createDog();
    this.layout();
    this.redrawProgress();

    const waitForMinimumDuration = Math.max(
      0,
      MINIMUM_LOADING_TIME - (Date.now() - this.startedAt),
    );

    this.time.delayedCall(waitForMinimumDuration, () => {
      this.scene.start(SceneKeys.main);
    });
  }

  private createDog() {
    if (this.dog) return;

    const frameKeys = this.createDogFrameTextures();

    if (!this.anims.exists(DOG_ANIMATION)) {
      this.anims.create({
        key: DOG_ANIMATION,
        frames: frameKeys.map((key) => ({ key })),
        frameRate: 10,
        repeat: -1,
      });
    }

    this.dog = this.add
      .sprite(0, 0, frameKeys[0])
      .setScale(DOG_SCALE)
      .play(DOG_ANIMATION);
    this.layout();
  }

  private createDogFrameTextures() {
    const source = this.textures
      .get(DOG_SOURCE_TEXTURE)
      .getSourceImage() as CanvasImageSource;

    return DOG_FRAME_BOUNDS.map((bounds, index) => {
      const key = `${DOG_TEXTURE}-${index}`;

      if (this.textures.exists(key)) return key;

      const canvas = document.createElement('canvas');
      canvas.width = DOG_FRAME_CANVAS_WIDTH;
      canvas.height = DOG_FRAME_CANVAS_HEIGHT;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to create the loading dog canvas');

      context.imageSmoothingEnabled = false;
      context.drawImage(
        source,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        (DOG_FRAME_CANVAS_WIDTH - bounds.width) / 2,
        DOG_ART_BASELINE - bounds.height,
        bounds.width,
        bounds.height,
      );
      this.textures.addCanvas(key, canvas);

      return key;
    });
  }

  private handleProgress(value: number) {
    this.progress = Phaser.Math.Clamp(value, 0, 1);
    this.redrawProgress();
  }

  private handleResize() {
    this.layout();
    this.redrawProgress();
  }

  private layout() {
    const { width, height } = this.scale.gameSize;
    const centerX = width / 2;
    const barWidth = Math.min(420, Math.max(180, width - 48));
    const barHeight = 22;
    const barX = centerX - barWidth / 2;
    const barY = height / 2 - barHeight / 2;

    this.progressText?.setPosition(centerX, barY + barHeight + 28);
    this.dog?.setPosition(centerX, barY - 62);

    if (this.progressTrack) {
      this.progressTrack.clear();
      this.progressTrack.fillStyle(0xffffff, 1);
      this.progressTrack.fillRect(
        barX - 5,
        barY - 5,
        barWidth + 10,
        barHeight + 10,
      );
      this.progressTrack.lineStyle(3, 0x000000, 1);
      this.progressTrack.strokeRect(
        barX - 5,
        barY - 5,
        barWidth + 10,
        barHeight + 10,
      );
    }
  }

  private redrawProgress() {
    if (!this.progressFill) return;

    const { width, height } = this.scale.gameSize;
    const barWidth = Math.min(420, Math.max(180, width - 48));
    const barHeight = 22;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 - barHeight / 2;
    const innerPadding = 3;

    this.progressFill.clear();
    this.progressFill.fillStyle(0xffffff, 1);
    this.progressFill.fillRect(barX, barY, barWidth, barHeight);
    this.progressFill.fillStyle(0x000000, 1);
    this.progressFill.fillRect(
      barX + innerPadding,
      barY + innerPadding,
      (barWidth - innerPadding * 2) * this.progress,
      barHeight - innerPadding * 2,
    );
    this.progressText?.setText(`Загрузка ${Math.round(this.progress * 100)}%`);
  }

  private cleanup() {
    this.load.off('progress', this.handleProgress, this);
    this.load.off(
      'filecomplete-image-loading-dog-source',
      this.createDog,
      this,
    );
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }
}
