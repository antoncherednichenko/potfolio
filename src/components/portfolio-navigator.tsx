'use client';

import Link from 'next/link';

import {
  cvData,
  cvSectionIds,
  getCvSection,
  type CvSectionId,
} from '@/content/cv';
import { Button, Modal } from '@/game/ui';
import { CvSectionContent } from './cv-section-content';

import './portfolio-navigator.style.css';

const NAVIGATION_ITEMS: Array<{ id: CvSectionId; label: string }> =
  cvData.sections.map(({ id, title }) => ({ id, label: title }));

export type PortfolioNavigatorProps = {
  open: boolean;
  activeSectionId?: CvSectionId;
  onOpenSection: (sectionId: CvSectionId) => void;
  onCloseSection: () => void;
};

export function PortfolioNavigator({
  activeSectionId,
  onCloseSection,
  onOpenSection,
  open,
}: PortfolioNavigatorProps) {
  const activeSection = activeSectionId
    ? getCvSection(activeSectionId)
    : undefined;

  return (
    <>
      {open && !activeSection ? (
        <nav aria-label="Разделы портфолио" className="portfolio-navigator">
          <div className="portfolio-navigator__buttons">
            {NAVIGATION_ITEMS.map(({ id, label }) => (
              <Button
                key={id}
                onClick={() => onOpenSection(id)}
                size="small"
                variant={activeSectionId === id ? 'secondary' : 'ghost'}
              >
                {label}
              </Button>
            ))}
            <Link
              className="game-button game-button--primary game-button--small"
              href="/cv"
            >
              <span className="game-button__label">CV</span>
            </Link>
          </div>
        </nav>
      ) : null}
      <Modal
        onClose={onCloseSection}
        open={Boolean(activeSection)}
        title={activeSection?.title ?? ''}
      >
        {activeSection ? <CvSectionContent section={activeSection} /> : null}
      </Modal>
    </>
  );
}

export function isPortfolioSectionId(value: string): value is CvSectionId {
  return cvSectionIds.includes(value as CvSectionId);
}
