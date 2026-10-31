import '@/game/game.style.css';
import '@/game/ui/button/button.style.css';
import '@/game/ui/icon-button/icon-button.style.css';
import '@/game/ui/menu/menu.style.css';
import '@/game/ui/modal/modal.style.css';
import PortfolioHome from '@/components/portfolio-home';

export default function GamePage() {
  return (
    <main className="game-shell" aria-label="Игра">
      <PortfolioHome />
    </main>
  );
}
