import Phaser from 'phaser';

import { Loading } from '@/game/scenes/loading';
import { Main } from '@/game/scenes/main';
import { GameEventKeys, SceneKeys } from '@/game/scenes/constants';

export type GameStartHandler = () => void;
export type InteractableClickHandler = (sectionId: string) => void;

export type CreateGameOptions = {
  onLoadingComplete?: (startMain: GameStartHandler) => void;
  onInteractableClick?: InteractableClickHandler;
};

export function createGame(
  parent: HTMLElement,
  { onLoadingComplete, onInteractableClick }: CreateGameOptions = {},
) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: '#ffffff',
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

  if (onInteractableClick) {
    game.events.on(GameEventKeys.interactableClick, onInteractableClick);
  }

  game.events.once(GameEventKeys.loadingComplete, () => {
    const startMain = () => game.scene.start(SceneKeys.main);

    if (onLoadingComplete) {
      onLoadingComplete(startMain);
      return;
    }

    startMain();
  });

  return game;
}
