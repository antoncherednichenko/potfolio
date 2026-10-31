import Link from 'next/link';

import { Button } from '../button/button';

import './menu.style.css';

export type PortfolioMenuProps = {
  open: boolean;
  onPlay: () => void;
};

export function PortfolioMenu({ onPlay, open }: PortfolioMenuProps) {
  if (!open) return null;

  return (
    <section aria-labelledby="portfolio-menu-title" className="portfolio-menu">
      <h1 className="portfolio-menu__title" id="portfolio-menu-title">
        Front-end, React, Node js Typescript разработчик
      </h1>
      <div className="portfolio-menu__content">
        <div aria-hidden="true" className="portfolio-menu__dog" />
        <Button onClick={onPlay} size="large">
          Играть
        </Button>
      </div>
      <p className="portfolio-menu__resume">
        Нет времени изучать мое портфолио? Посмотри{' '}
        <Link href="/cv">резюме</Link>
      </p>
    </section>
  );
}

export default PortfolioMenu;
