'use client';

import { useEffect, useRef } from 'react';

import type {
  GameStartHandler,
  InteractableClickHandler,
} from '@/game/create-game';

const GAME_FONT = '7px "Press Start 2P"';
const GAME_FONT_SAMPLE = 'Привет! Меня зовут Антон.';

export type GameCanvasProps = {
  onLoadingComplete?: (startMain: GameStartHandler) => void;
  onInteractableClick?: InteractableClickHandler;
};

async function waitForGameFont() {
  if (!document.fonts) return;

  await document.fonts.load(GAME_FONT, GAME_FONT_SAMPLE);
  await document.fonts.ready;
}

export function GameCanvas({
  onInteractableClick,
  onLoadingComplete,
}: GameCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const onLoadingCompleteRef = useRef(onLoadingComplete);
  const onInteractableClickRef = useRef(onInteractableClick);

  useEffect(() => {
    onLoadingCompleteRef.current = onLoadingComplete;
  }, [onLoadingComplete]);

  useEffect(() => {
    onInteractableClickRef.current = onInteractableClick;
  }, [onInteractableClick]);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let disposed = false;
    let game:
      ReturnType<typeof import('@/game/create-game').createGame> | undefined;

    Promise.all([import('@/game/create-game'), waitForGameFont()])
      .then(([{ createGame }]) => {
        if (disposed) return;

        const loadingCompleteHandler = onLoadingCompleteRef.current;
        const interactableClickHandler = onInteractableClickRef.current;
        game = createGame(
          parent,
          loadingCompleteHandler || interactableClickHandler
            ? {
                ...(loadingCompleteHandler
                  ? {
                      onLoadingComplete: (startMain: GameStartHandler) => {
                        if (!disposed) {
                          onLoadingCompleteRef.current?.(startMain);
                        }
                      },
                    }
                  : {}),
                ...(interactableClickHandler
                  ? {
                      onInteractableClick: (sectionId: string) => {
                        if (!disposed) {
                          onInteractableClickRef.current?.(sectionId);
                        }
                      },
                    }
                  : {}),
              }
            : undefined,
        );
      })
      .catch((error: unknown) => {
        if (!disposed) console.error('Unable to initialize Phaser', error);
      });

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return <div className="game-canvas" ref={parentRef} />;
}
