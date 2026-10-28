import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/game/game.style.css';
import '@/game/ui/button/button.style.css';
import '@/game/ui/icon-button/icon-button.style.css';
import '@/game/ui/modal/modal.style.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cherednichenko Anton',
  description: 'Frontend developer',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
