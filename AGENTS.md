# Repository Guidelines

## Project Structure & Module Organization

This farm-themed portfolio uses Next.js, React, TypeScript, and Phaser.

- `src/app/`: App Router page, root layout, and global styles.
- `src/game/create-game.ts`: Phaser game factory.
- `public/assets/game/`: tile sheets, characters, animals, and decorations.
- `.github/workflows/ci.yml`: automated quality checks and production build.

The README references `src/content/`, `tests/`, and `docs/`, but these directories
are absent from this snapshot. `layout.tsx` still imports `@/content`; account for
that missing module when investigating build or type-check failures.

## Build, Test, and Development Commands

Use Node.js 24 and npm 11; install dependencies with `npm ci`.

| Command                                   | Purpose                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| `npm run dev`                             | Start development at `http://localhost:3000`.             |
| `npm run build`                           | Create the production build.                              |
| `npm start`                               | Serve an existing production build.                       |
| `npm run check`                           | Run type checking, linting, tests, and formatting checks. |
| `npm run typecheck` / `npm run lint`      | Run TypeScript or ESLint separately.                      |
| `npm test` / `npm run test:watch`         | Run Vitest once or in watch mode.                         |
| `npm run format` / `npm run format:check` | Apply or verify Prettier formatting.                      |

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, UTF-8, LF endings, and a final
newline. Prettier enforces semicolons, single quotes, and trailing commas.
Follow existing naming: PascalCase React components, camelCase functions, and
kebab-case utility filenames such as `create-game.ts`. Use `@/` for `src/` imports.
ESLint uses Next.js rules and permits no warnings.

## Architecture Boundaries

Keep Phaser imports inside `src/game/`. Game code must remain independent of
React, Next.js, and portfolio JSON. Load the game dynamically from the client
page's effect and destroy it during cleanup, preserving browser-only startup.

## Testing Guidelines

Vitest uses a Node environment and discovers `tests/**/*.test.ts`. No tests or
coverage thresholds are currently present. Add tests there for content contracts
and import boundaries as those modules develop. For lifecycle or rendering
changes, verify the page in a browser and run the production build.

## Commit & Pull Request Guidelines

Git history is unavailable in this snapshot, so no commit convention can be
confirmed. Use concise, imperative subjects describing the change. PRs should
explain the behavior, link relevant issues, report validation results and known
blockers, and include screenshots for visible changes.
