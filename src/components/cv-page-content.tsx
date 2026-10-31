import Link from 'next/link';

import {
  cvData,
  type CvContactsSection,
  type CvExperienceSection,
  type CvTechnologiesSection,
} from '@/content/cv';

import './cv-page-content.style.css';

function formatDate(value: string | null) {
  if (!value) return 'по настоящее время';

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

const aboutSection = cvData.sections.find(
  (section) => section.type === 'about',
);
const experienceSection = cvData.sections.find(
  (section): section is CvExperienceSection => section.type === 'cv',
);
const technologiesSection = cvData.sections.find(
  (section): section is CvTechnologiesSection =>
    section.type === 'technologies',
);
const frontendCategory = technologiesSection?.content.categories.find(
  (category) => category.id === 'frontend',
);
const contactsSection = cvData.sections.find(
  (section): section is CvContactsSection => section.type === 'contacts',
);

export function CvPageContent() {
  return (
    <main className="cv-page">
      <div className="cv-page__shell">
        <header className="cv-page__header">
          <div>
            <p className="cv-page__eyebrow">Резюме / CV</p>
            <h1>{cvData.profile.name}</h1>
            <p className="cv-page__role">{cvData.profile.role}</p>
          </div>
          <nav aria-label="Навигация по резюме" className="cv-page__actions">
            <Link className="cv-page__play" href="/game">
              Play
            </Link>
            <a
              className="cv-page__download"
              download="anton-cherednichenko-cv.pdf"
              href="/cv.pdf"
              aria-label="Скачать резюме"
              title="Скачать резюме"
            >
              <svg
                aria-hidden="true"
                className="cv-page__download-icon"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2" />
              </svg>
            </a>
          </nav>
        </header>

        <div className="cv-page__summary">
          <p>{cvData.profile.experience} в frontend-разработке</p>
          {frontendCategory ? (
            <p>{frontendCategory.items.join(' · ')}</p>
          ) : null}
        </div>

        <div className="cv-page__layout">
          <aside className="cv-page__sidebar">
            {technologiesSection ? (
              <section aria-labelledby="cv-technologies-title">
                <h2 id="cv-technologies-title">{technologiesSection.title}</h2>
                <div className="cv-page__technology-list">
                  {technologiesSection.content.categories.map((category) => (
                    <div key={category.id}>
                      <h3>{category.title}</h3>
                      <ul>
                        {category.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {contactsSection ? (
              <section aria-labelledby="cv-contacts-title">
                <h2 id="cv-contacts-title">{contactsSection.title}</h2>
                <ul className="cv-page__contacts">
                  {contactsSection.content.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.label}</span>
                      <a href={item.href}>{item.value}</a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>

          <div className="cv-page__main">
            {aboutSection ? (
              <section aria-labelledby="cv-about-title">
                <h2 id="cv-about-title">{aboutSection.title}</h2>
                <div className="cv-page__paragraphs">
                  {aboutSection.content.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {experienceSection ? (
              <section aria-labelledby="cv-experience-title">
                <h2 id="cv-experience-title">{experienceSection.title}</h2>
                <div className="cv-page__experience">
                  {experienceSection.content.items.map((item) => (
                    <article className="cv-page__job" key={item.id}>
                      <div className="cv-page__job-heading">
                        <div>
                          <h3>{item.title}</h3>
                          <p className="cv-page__position">{item.position}</p>
                        </div>
                        <p className="cv-page__period">
                          {formatDate(item.period.start)} —{' '}
                          {formatDate(item.period.end)}
                        </p>
                      </div>
                      <p className="cv-page__description">{item.description}</p>
                      {item.responsibilities.length > 0 ? (
                        <ul>
                          {item.responsibilities.map((responsibility) => (
                            <li key={responsibility}>{responsibility}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default CvPageContent;
