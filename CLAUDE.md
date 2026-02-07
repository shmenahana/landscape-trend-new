# CLAUDE.md

## Project Overview

**landscape-ai-prod** is a Next.js 13 starter project for a landscape trend analysis application. It is currently a skeleton/template with configuration in place but no application code yet.

## Tech Stack

- **Framework:** Next.js 13.4.12 (Pages Router)
- **UI:** React 18.2.0
- **Styling:** TailwindCSS 3.2.4 + PostCSS + Autoprefixer
- **Language:** JavaScript (no TypeScript configured)
- **Runtime:** Node.js v22

## Project Structure

```
/
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS plugins (tailwindcss, autoprefixer)
├── tailwind.config.js     # TailwindCSS config (scans pages/ and components/)
├── styles.css             # Global styles with Tailwind directives
├── pages/                 # Next.js pages (to be created)
└── components/            # Reusable React components (to be created)
```

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
```

## Development Notes

- No testing framework is configured. Tests should be added before writing application logic.
- No linter or formatter is configured (no ESLint, Prettier).
- No TypeScript — all files use plain JavaScript (.js/.jsx).
- TailwindCSS is the styling approach. Use utility classes; avoid custom CSS where possible.
- The `tailwind.config.js` scans `./pages/**` and `./components/**` for class usage.

## Conventions

- Use the Next.js Pages Router pattern (`pages/` directory for routes).
- Place reusable UI in `components/`.
- Import global styles from `styles.css`.
- No CI/CD pipeline exists yet.
