import cvJson from '../../public/cv.json';

export type CvAboutSection = {
  id: 'about';
  type: 'about';
  title: string;
  content: { paragraphs: string[] };
};

export type CvExperienceItem = {
  id: string;
  title: string;
  position: string;
  description: string;
  period: { start: string; end: string | null };
  responsibilities: string[];
};

export type CvExperienceSection = {
  id: 'cv';
  type: 'cv';
  title: string;
  content: { items: CvExperienceItem[] };
};

export type CvTechnologiesSection = {
  id: 'technologies';
  type: 'technologies';
  title: string;
  content: {
    categories: Array<{ id: string; title: string; items: string[] }>;
  };
};

export type CvContactsSection = {
  id: 'contacts';
  type: 'contacts';
  title: string;
  content: {
    items: Array<{
      id: string;
      type: string;
      label: string;
      value: string;
      href: string;
    }>;
  };
};

export type CvSection =
  | CvAboutSection
  | CvExperienceSection
  | CvTechnologiesSection
  | CvContactsSection;

export type CvData = {
  schemaVersion: number;
  profile: { name: string; role: string; experience: string };
  sections: CvSection[];
};

export const cvData = cvJson as CvData;

export type CvSectionId = CvSection['id'];

export const cvSectionIds = [
  'about',
  'cv',
  'technologies',
  'contacts',
] as const satisfies readonly CvSectionId[];

export function getCvSection(id: CvSectionId) {
  return cvData.sections.find((section) => section.id === id);
}

export function isCvSectionId(value: string): value is CvSectionId {
  return cvSectionIds.includes(value as CvSectionId);
}
