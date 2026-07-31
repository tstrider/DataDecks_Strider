# Brand ingestion

How to turn a set of brand guidelines (a PDF, a few images, or a description) into a brand profile the build can apply consistently, and what to do when there are none.

## Extract into the profile shape

`assets/example-brand.json` is the reference shape. When given guidelines, produce the same structure for the new brand. Pull these fields, in priority order:

1. **Colors (exact hex).** Read them verbatim; never approximate a brand color by eye. Capture every named swatch. If the guidelines give usage percentages, capture them, but treat the *dominance model* (which color is the ground, which is the accent) as what actually drives the build.
2. **Roles.** Map raw colors to jobs: `darkBackground`, `lightBackground`, `textOnDark`, `textOnLight`, `accent`, `dataSeries`, `positive`/`negative` for variance. This is the step that makes a palette usable, a list of hexes isn't a design system until each color has a job.
3. **Typography.** Display font, body font, weights, and the headline case rule (for example sentence case for a human, approachable voice). Record a QA-safe metric-compatible substitute (for example Arial for a Helvetica-style face; Calibri or Arial as a general fallback) and note the fidelity-vs-QA tradeoff.
4. **Motif and shapes.** The one repeatable element (for example a signature shape such as a semicircle or tab), container style (rounded cards, corner radius), and any background texture with its opacity.
5. **Logo rules.** Approved color forms, what must never happen (recolor, stretch, rotate, effects), and clear-space. The build should place the logo, not redraw it, if a logo asset is provided, use the asset.
6. **Voice.** The tone principles and any copywriting rules, so headlines the build writes sound like the brand (for example: human, straightforward, confident; short sentences; outcome-driven; no jargon).

Save the new profile alongside the deck build so it can be reused. If the user is building this for a Claude Project, the profile belongs in the project's knowledge so every deck inherits it.

## Reading a guidelines PDF

Guidelines decks are image-heavy. Read them as images (they're usually in context already, or rasterize with the pdf-reading skill). Look specifically for: the color page (hex values), the type page (font names + the case rule), the logo do/don't pages, and the photography/imagery pages (they define the image treatment, for example color-grading photography into the palette and masking it into a brand shape).

## Applying the brand

- Load the profile into `grid.js` (`makeGrid(pres, brand)`); color roles and fonts flow from it automatically.
- Use role names, not raw hex, in build code (`g.hx("accent")`, `fill: "darkBackground"`). This keeps the deck re-skinnable and prevents a stray off-brand color.
- Charts pull their series colors from `roles.dataSeries`; variance uses `roles.positive`/`roles.negative`. This is how a financial deck stays on-brand without hand-coloring every element.
- Keep the accent scarce. The fastest way to look off-brand is to over-use the one color the brand reserves for emphasis.

## When there are no guidelines

Don't default to generic blue-on-white. Pick a bold, content-informed palette (the base pptx skill lists starting palettes) with clear dominance and one accent, commit to a motif, and apply it consistently. State that you chose a palette because none was provided, so the user can swap in their brand later, the role-based structure makes that a one-file change.
