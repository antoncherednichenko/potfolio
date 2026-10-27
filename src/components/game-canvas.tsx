'use client';

import { useEffect, useRef } from 'react';

export function GameCanvas() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    let disposed = false;
    let game:
      ReturnType<typeof import('@/game/create-game').createGame> | undefined;

    import('@/game/create-game')
      .then(({ createGame }) => {
        if (!disposed) game = createGame(parent);
      })
      .catch((error: unknown) => {
        if (!disposed) console.error('Unable to initialize Phaser', error);
      });

    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="game-shell" aria-label="Игра">
      <div className="game-canvas" ref={parentRef} />
    </main>
  );
}
