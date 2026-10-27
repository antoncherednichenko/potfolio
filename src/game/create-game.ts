import Phaser from 'phaser';

import { Loading } from '@/game/scenes/loading';
import { Main } from '@/game/scenes/main';

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    audio: { noAudio: true },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: { mode: Phaser.Scale.RESIZE },
    scene: [Loading, Main],
  });
}
