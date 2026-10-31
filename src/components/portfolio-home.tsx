'use client';

import { useCallback, useState } from 'react';

import { GameCanvas } from '@/components/game-canvas';
import { isCvSectionId, type CvSectionId } from '@/content/cv';
import { PortfolioMenu } from '@/game/ui';
import type { GameStartHandler } from '@/game/create-game';
import { PortfolioNavigator } from './portfolio-navigator';

export function PortfolioHome() {
  const [startMain, setStartMain] = useState<GameStartHandler>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<CvSectionId>();

  const handlePlay = () => {
    startMain?.();
    setIsPlaying(true);
  };

  const handleInteractableClick = useCallback((sectionId: string) => {
    if (isCvSectionId(sectionId)) setActiveSectionId(sectionId);
  }, []);

  return (
    <main className="game-shell" aria-label="Портфолио">
      <GameCanvas
        onInteractableClick={handleInteractableClick}
        onLoadingComplete={(start) => setStartMain(() => start)}
      />
      <PortfolioMenu
        onPlay={handlePlay}
        open={Boolean(startMain) && !isPlaying}
      />
      <PortfolioNavigator
        activeSectionId={activeSectionId}
        onCloseSection={() => setActiveSectionId(undefined)}
        onOpenSection={setActiveSectionId}
        open={isPlaying}
      />
    </main>
  );
}

export default PortfolioHome;
