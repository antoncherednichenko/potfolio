import type { CvSection } from '@/content/cv';

import './cv-section-content.style.css';

function formatDate(value: string | null) {
  if (!value) return 'по настоящее время';

  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function CvSectionContent({ section }: { section: CvSection }) {
  switch (section.type) {
    case 'about':
      return (
        <div className="cv-section-content__paragraphs">
          {section.content.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      );
    case 'cv':
      return (
        <div className="cv-section-content__experience">
          {section.content.items.map((item) => (
            <article className="cv-section-content__job" key={item.id}>
              <div className="cv-section-content__job-heading">
                <h3>{item.title}</h3>
                <span>
                  {formatDate(item.period.start)} —{' '}
                  {formatDate(item.period.end)}
                </span>
              </div>
              <p className="cv-section-content__position">{item.position}</p>
              <p>{item.description}</p>
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
      );
    case 'technologies':
      return (
        <div className="cv-section-content__technologies">
          {section.content.categories.map((category) => (
            <section key={category.id}>
              <h3>{category.title}</h3>
              <ul>
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );
    case 'contacts':
      return (
        <ul className="cv-section-content__contacts">
          {section.content.items.map((item) => (
            <li key={item.id}>
              <span>{item.label}</span>
              <a href={item.href}>{item.value}</a>
            </li>
          ))}
        </ul>
      );
  }
}
