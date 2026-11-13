# Industrial Contractor Website — Wireframe

A grayscale, low-fidelity wireframe built with **HTML, CSS and TypeScript**. Its structure is based on the
sections common to the four industrial-contractor sites we compared. All copy is Lorem Ipsum placeholder text.

## Run it
```bash
npm install      # installs TypeScript
npm run build    # compiles src/main.ts -> dist/main.js
```
Then run `npm run serve` and visit http://localhost:8080 (recommended — gives clean `/about/` style URLs), or open
`index.html` straight from disk; a small script rewrites folder links to `…/index.html` so navigation still works.

## Files
| Path | Purpose |
|---|---|
| `index.html` | Home page (overview of every section) |
| `about/`, `services/`, `industries/`, `safety/`, `projects/`, `news/`, `careers/`, `contact/` | One folder per page, each with its own `index.html` (served at `/about/`, etc.) |
| `css/styles.css` | Mobile-first styles and breakpoints |
| `src/main.ts` | TypeScript behaviour (source) |
| `dist/main.js` | Compiled JavaScript loaded by the page |
| `screenshots/` | Desktop, tablet and mobile previews |

All pages share one stylesheet and one script. Nearly every style and behaviour (header, nav, footer, cards, form) is
shared, and each script feature no-ops when its elements aren't on the page, so per-page CSS/TS files would be
near-empty and add extra requests. If a page grows substantial unique styles, add e.g. `about/about.css` beside it.

The header and footer are duplicated in each HTML file — update menu changes in all nine.

## Submenu anchors
- **About** (`about/`): `#history`, `#leadership`, `#locations`, `#affiliations`
- **Services** (`services/`): `#pipe-fabrication`, `#industrial-construction`, `#maintenance`, `#engineering`,
  `#electrical`, `#technical-solutions`

## Home page sections (top to bottom)
Utility bar (phone/email/social) · Sticky header with dropdown navigation + "Get a Quote" · Hero · Stats strip ·
Services grid · Why us / About · Industries served · Safety · Projects (filterable) · Certifications / affiliations ·
News · Careers call-to-action · Contact form + locations/map · Footer (links, social, legal).

## Breakpoints (mobile-first)
| Width | Layout changes |
|---|---|
| < 480px | Single column, stacked full-width buttons, hamburger menu (slide-in drawer), footer accordions |
| ≥ 480px | Buttons side-by-side, 2-column form rows, 3-up tiles and logos |
| ≥ 768px | Full utility bar, 4-up stats, 2-column cards, side-by-side careers banner, footer columns open |
| ≥ 1024px | Desktop navigation with dropdowns, 3-column cards, 2-column split sections, 6-up tiles/logos |
| ≥ 1280px | Extra section spacing for wide screens |

## Interactive features (`src/main.ts`)
- Mobile menu: open/close, accordion submenus, closes on link tap, **Esc**, or resizing to desktop
- Desktop dropdowns: hover, click or keyboard; Esc / outside click to close
- Sticky header gains a shadow on scroll
- Footer link groups collapse into accordions on phones
- Project filter chips
- Animated stat counters (skipped when the user prefers reduced motion)
- Contact form validation with inline, screen-reader-announced errors (no data is sent)
- Back-to-top button and a **Labels** toggle that outlines and names each wireframe section

## Accessibility
Skip link, semantic landmarks, `aria-expanded`/`aria-pressed` states, 44px minimum touch targets, visible focus
outlines, 16px form inputs (prevents iOS zoom), `prefers-reduced-motion` support and print styles.
