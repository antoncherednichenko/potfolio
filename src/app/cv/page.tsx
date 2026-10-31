import type { Metadata } from 'next';

import { CvPageContent } from '@/components/cv-page-content';

export const metadata: Metadata = {
  title: 'Антон Чередниченко — CV',
  description: 'Резюме frontend-разработчика Антона Чередниченко',
};

export default function CvPage() {
  return <CvPageContent />;
}
