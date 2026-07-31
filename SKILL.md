---
name: datadecks-strider
description: "Use this for ANY PowerPoint, slide deck, or presentation task: creating, designing, editing, restyling, or improving a .pptx, and turning financial or marketing data into slides. It makes decks look professionally designed through a hard alignment grid, a storyboard-first workflow, clean finance and marketing charts, and brand-guideline styling, on top of raw pptx mechanics. Trigger on any mention of deck, slides, slide deck, presentation, PowerPoint, pptx, pitch deck, board deck, report deck, month-end reporting, financial reporting slides, marketing readout, 'make this deck look good', 'fix the alignment', 'follow our brand', or a request to turn data or a document into slides, or to fix misaligned text boxes, tables, and images or tidy up a messy existing deck. Use it even for simple or quick decks, and even when the user never says the word 'design', because it improves the look, alignment, and story of every deck. Whenever the deliverable is a presentation, prefer this skill."
---

# Presentation design

Build decks a top studio would be proud of: a clear story, a consistent brand system, clean data visualization, and pixel-tight alignment. This skill is the *design and storytelling layer*. The base `pptx` skill supplies the build mechanics and gotchas (pptxgenjs API, chart footguns, the render/validate tooling), use both together. When they overlap, this skill's design guidance wins on look, the `pptx` skill wins on mechanics.

## Why decks come out badly (and how this skill prevents it)

Three failure modes, three fixes, applied every time:

- **Sloppy alignment** ("everything looks slightly off"). Fixed by building every element on one 12-column grid (`assets/grid.js`) instead of eyeballing coordinates, and by forcing `margin:0` on text that must line up. See `references/design-system.md`.
- **No story / same layout every slide.** Fixed by designing a textual storyboard *before* touching code, then one-shotting the build. See `references/storyboard-workflow.md`.
- **Weak or off-brand visuals.** Fixed by ingesting the brand into a profile and applying it by role, and by treating images as texture via a two-layer prompt-then-generate method. See `references/brand-ingestion.md` and `references/image-backgrounds.md`.

## Workflow

Follow these stages in order. Don't jump straight to writing pptxgenjs.

### 1. Get the brand first (always, before building)

Establish the brand before you build any deck, every time, even a quick one. A deck that matches the user's brand is what reads as finished rather than generic.

- **Look for brand material the user already provided:** brand guidelines (a PDF, images, or a written description), a logo file, brand colors, brand fonts, or a brand profile already in the conversation or project knowledge. If present, extract it into a brand profile matching `assets/example-brand.json` (read `references/brand-ingestion.md`), and use the real logo and imagery assets rather than redrawing them.
- **If none is provided, ask for it before building.** In one short message, request their brand guidelines and any logo or imagery files, and say that matching their brand is what makes the deck look designed. Do not start building a branded-looking deck on assumptions.
- **If the user has no brand, or declines to share one,** proceed with a clearly stated neutral default: the shipped `assets/example-brand.json`, or a bold, content-informed palette with clear dominance and one accent. Tell them it is a placeholder they can reskin later by editing one file.

Never invent brand colors, fonts, or a logo silently. If a brand detail is missing, flag it. The skill ships with a fictional example brand (`example-brand.json`) purely as a working template; replace it with the user's brand.

### 2. Storyboard first (get sign-off)

Write the topic treatment, then a slide-by-slide **textual** storyboard with headline, real content, named layout, visual, and aesthetic per slide. Vary the layouts; sandwich dark/light. Name every real number and flag every image. Present it and ask for edits before building, editing text is cheap, editing a rendered deck is not. Full field template and rules in `references/storyboard-workflow.md`. (If the user explicitly says "just build it," compress this to a brief internal outline and proceed.)

### 3. Build in one pass, on the grid

- Read the base `pptx` skill's "Creating with pptxgenjs" gotchas first, they prevent file-corrupting mistakes (hex without `#`, `pres.layout` before slides, chart label rules).
- Set the wide layout (13.333 x 7.5) before adding slides. Load `grid.js`: `const g = makeGrid(pres, brand)`.
- Place every element with grid helpers (`g.col`, `g.title`, `g.body`, `g.card`, `g.kpiRow`, `g.table`, `g.statCallout`, `g.chartStyle`). Elements in the same visual column share the same `col` start; rows share a baseline. This is what kills the "off" look.
- **Flow stacked text with `g.stack`, never hardcode a y beneath wrappable text.** A headline that wraps to two lines will collide with a body placed at a fixed y. `g.stack` measures each block and guarantees the gap, returning the next free y for the table/chart/image below. Use `g.GAP` (tight/block/section) so gaps are uniform.
- For any data slide, read `references/data-visualization.md` and let the headline carry the takeaway while the chart proves it. Colors come from the brand profile's roles, so charts stay on brand automatically.
- For any slide needing a generated background, write all image prompts first, generate, then transparency-mask so imagery recedes behind text (`references/image-backgrounds.md`). Prefer solid/gradient/pattern grounds when in doubt.

### 4. QA loop (required: this is the second half of the alignment fix)

A first render almost always has a real defect. Do not deliver before running the full loop from the base `pptx` skill:

- **Content:** `markitdown deck.pptx`, check for missing content, typos, order, and leftover placeholder text.
- **File:** `python scripts/office/validate.py deck.pptx`, catches the chart and XML faults PowerPoint refuses; fix them in the generator, not by hand.
- **Visual:** convert to images (`soffice --convert-to pdf` -> `pdftoppm`) and **look at every slide with fresh eyes.** Hunt specifically for: text overflow or cutoff, overlaps, uneven gaps, columns not aligned, insufficient margins (<0.5"), low-contrast text, and any decorative stripe/accent-line that crept in. Fix real defects, re-render only changed slides, stop.

Validate every financial total against a known figure before shipping. A deck that looks perfect but whose bridge doesn't sum is a failure.

## Reference map

Read the reference that matches the stage you're in; don't load them all upfront.

| File | Read when |
|---|---|
| `references/storyboard-workflow.md` | Before writing any deck, the topic-treatment -> storyboard -> one-shot process and the per-slide field template. |
| `references/design-system.md` | Setting up layout: grid discipline, type scale, color logic, composition patterns, and the anti-AI-tell rules. |
| `references/brand-ingestion.md` | Given brand guidelines, or extracting a new brand profile. |
| `references/data-visualization.md` | Any slide with numbers, finance and marketing chart selection, month-end layouts, the waterfall recipe, tables, number formatting. |
| `references/image-backgrounds.md` | A slide needs a photographic/abstract background. |
| `assets/grid.js` | Always, at build time, the layout engine. `require` it; don't reimplement its math. |
| `assets/example-brand.json` | The fictional example brand and the shape every real brand profile should copy. |

## Non-negotiables

- Never fabricate a number. If a figure isn't given, mark it `[TK]` and surface it, don't invent it.
- Sentence-case headlines unless the brand guidelines say otherwise. Never all caps.
- Every slide earns a visual; no text-only slides.
- No accent lines under titles, no decorative color bars or edge stripes, no cream defaults, honor brand typographic wayfinding only when the guidelines explicitly show it.
- No phantom negative axes: floor the value axis at 0 unless the data actually has negatives (`g.valAxis`). No headline orphans (`g.title` binds the last two words). Label each series once, by legend or direct label, never both. Tables fill their span (`g.table`).
- One accent color, used scarcely, as a spotlight.
- Always run the QA loop before delivering.
