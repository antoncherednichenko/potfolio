import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cv = JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'cv.json'), 'utf8'),
);
const outputPath = path.join(root, 'public', 'cv.pdf');
const fontsPath = path.join(
  root,
  'node_modules',
  '@fontsource',
  'noto-sans',
  'files',
);
const fonts = {
  regularCyrillic: path.join(fontsPath, 'noto-sans-cyrillic-400-normal.woff'),
  regularLatin: path.join(fontsPath, 'noto-sans-latin-400-normal.woff'),
  boldCyrillic: path.join(fontsPath, 'noto-sans-cyrillic-700-normal.woff'),
  boldLatin: path.join(fontsPath, 'noto-sans-latin-700-normal.woff'),
};

for (const fontPath of Object.values(fonts)) {
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Missing PDF font: ${fontPath}. Run npm ci first.`);
  }
}

const document = new PDFDocument({
  autoFirstPage: false,
  bufferPages: true,
  margin: 48,
  size: 'A4',
  info: {
    Author: cv.profile.name,
    Title: `${cv.profile.name} — CV`,
  },
});
const stream = fs.createWriteStream(outputPath);
document.pipe(stream);

const colors = {
  text: '#171717',
  muted: '#686868',
  line: '#deded9',
};
const page = {
  width: 595.28,
  height: 841.89,
  margin: 48,
};
const contentWidth = page.width - page.margin * 2;
let cursorY = page.margin;

function isCyrillic(character) {
  return /[А-Яа-яЁё]/.test(character);
}

function fontPath(weight, text) {
  const cyrillic = [...text].some(isCyrillic);
  return weight === 'bold'
    ? cyrillic
      ? fonts.boldCyrillic
      : fonts.boldLatin
    : cyrillic
      ? fonts.regularCyrillic
      : fonts.regularLatin;
}

function textRuns(text) {
  const runs = [];
  for (const character of text) {
    const useCyrillic = isCyrillic(character);
    const previous = runs.at(-1);
    if (previous && previous.useCyrillic === useCyrillic) {
      previous.text += character;
    } else {
      runs.push({ text: character, useCyrillic });
    }
  }
  return runs;
}

function measureText(text, size, weight = 'regular') {
  return textRuns(text).reduce((total, run) => {
    document.font(fontPath(weight, run.text));
    return total + document.fontSize(size).widthOfString(run.text);
  }, 0);
}

function splitLongWord(word, width, size, weight) {
  const parts = [];
  let current = '';
  for (const character of word) {
    const candidate = current + character;
    if (current && measureText(candidate, size, weight) > width) {
      parts.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(text, width, size, weight = 'regular') {
  const lines = [];
  for (const paragraph of text.split(/\n/)) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (!word) continue;
      const candidate = line ? `${line} ${word}` : word;
      if (measureText(candidate, size, weight) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (measureText(word, size, weight) <= width) {
        line = word;
      } else {
        const parts = splitLongWord(word, width, size, weight);
        lines.push(...parts.slice(0, -1));
        line = parts.at(-1) ?? '';
      }
    }
    if (line) lines.push(line);
  }
  return lines.length > 0 ? lines : [''];
}

function ensureSpace(height) {
  if (cursorY + height <= page.height - page.margin) return;
  document.addPage();
  cursorY = page.margin;
}

function drawText(text, options = {}) {
  const {
    color = colors.text,
    indent = 0,
    lineGap = 4,
    size = 10,
    spacingAfter = 0,
    weight = 'regular',
    width = contentWidth,
  } = options;
  const lineHeight = size + lineGap;
  const lines = wrapText(text, width - indent, size, weight);
  ensureSpace(lines.length * lineHeight + spacingAfter);

  for (const line of lines) {
    let x = page.margin + indent;
    for (const run of textRuns(line)) {
      document
        .font(fontPath(weight, run.text))
        .fontSize(size)
        .fillColor(color)
        .text(run.text, x, cursorY, { lineBreak: false });
      x += document.widthOfString(run.text);
    }
    cursorY += lineHeight;
  }
  cursorY += spacingAfter;
}

function drawRule(spacingBefore = 14, spacingAfter = 18) {
  ensureSpace(spacingBefore + 1 + spacingAfter);
  cursorY += spacingBefore;
  document
    .moveTo(page.margin, cursorY)
    .lineTo(page.width - page.margin, cursorY)
    .lineWidth(0.6)
    .strokeColor(colors.line)
    .stroke();
  cursorY += 1 + spacingAfter;
}

function drawSectionTitle(title) {
  drawRule(8, 16);
  drawText(title.toUpperCase(), {
    lineGap: 2,
    size: 9,
    spacingAfter: 14,
    weight: 'bold',
  });
}

function formatDate(value) {
  if (!value) return 'по настоящее время';
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

document.addPage();
drawText(cv.profile.name, {
  lineGap: 4,
  size: 25,
  spacingAfter: 4,
  weight: 'bold',
});
drawText(cv.profile.role, {
  color: colors.muted,
  lineGap: 3,
  size: 12,
  spacingAfter: 2,
});
drawText(`${cv.profile.experience} в frontend-разработке`, {
  color: colors.muted,
  lineGap: 2,
  size: 9,
  spacingAfter: 2,
});
drawRule(14, 20);

for (const section of cv.sections) {
  drawSectionTitle(section.title);

  if (section.type === 'about') {
    for (const paragraph of section.content.paragraphs) {
      drawText(paragraph, { lineGap: 4, size: 10, spacingAfter: 10 });
    }
  }

  if (section.type === 'cv') {
    section.content.items.forEach((item, index) => {
      ensureSpace(70);
      drawText(item.title, {
        lineGap: 3,
        size: 12,
        spacingAfter: 2,
        weight: 'bold',
      });
      drawText(
        `${item.position} · ${formatDate(item.period.start)} — ${formatDate(item.period.end)}`,
        {
          color: colors.muted,
          lineGap: 3,
          size: 9,
          spacingAfter: 8,
        },
      );
      drawText(item.description, { lineGap: 3, size: 10, spacingAfter: 6 });
      for (const responsibility of item.responsibilities) {
        drawText(`• ${responsibility}`, {
          indent: 10,
          lineGap: 3,
          size: 9,
          spacingAfter: 3,
        });
      }
      if (index < section.content.items.length - 1) drawRule(10, 14);
    });
  }

  if (section.type === 'technologies') {
    for (const category of section.content.categories) {
      drawText(category.title, {
        lineGap: 2,
        size: 9,
        spacingAfter: 4,
        weight: 'bold',
      });
      drawText(category.items.join(' · '), {
        lineGap: 3,
        size: 10,
        spacingAfter: 10,
      });
    }
  }

  if (section.type === 'contacts') {
    for (const item of section.content.items) {
      drawText(`${item.label}: ${item.value}`, {
        lineGap: 3,
        size: 10,
        spacingAfter: 6,
      });
    }
  }
}

document.end();
await new Promise((resolve, reject) => {
  stream.once('finish', resolve);
  stream.once('error', reject);
});

console.log(`Generated ${path.relative(root, outputPath)}`);
