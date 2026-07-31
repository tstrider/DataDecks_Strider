# DataDecks_Strider

A Claude skill that makes PowerPoint decks look professionally designed: pixel-tight alignment, a clear story, clean finance and marketing charts, and consistent brand styling. Built for finance and FP&A teams who live in slides, and useful for any data-heavy deck.

## What it does

When installed, Claude uses this on any presentation task and applies a design discipline most AI-built decks skip:

- **A real alignment grid.** Every element sits on one 12-column grid, so nothing looks slightly off. Headlines never drop a lone word onto their own line, text blocks flow with guaranteed spacing, and tables fill their space instead of hugging the left edge.
- **Storyboard first.** For anything beyond a quick deck, it drafts a slide-by-slide storyboard you can edit before it builds, so the argument is right before pixels are spent.
- **Honest, clean data visualization.** Chart selection guidance for finance and marketing, a self-scaling waterfall (variance bridge), value axes that start at zero and never show phantom negatives, variance colored by sign, and a headline-states-the-takeaway habit.
- **Brand styling.** It looks for your brand guidelines and assets first and applies your palette, fonts, and logo by role. It ships with a fictional example brand so it works out of the box.
- **A required QA pass.** It renders every slide and inspects it before delivering, which is what catches overflow, overlaps, and misalignment.

## Install

1. Download `DataDecks_Strider.skill` (or clone this repo and package the folder).
2. In Claude, open the skill file and choose Save skill, or add it from your capabilities/skills settings. Availability depends on your plan and, for team or enterprise accounts, on your workspace admin.
3. That is it. It triggers automatically on deck, slides, presentation, PowerPoint, or "turn this into slides" requests. You do not call it by name.

To build actual .pptx files, keep code execution and file creation enabled in the chat.

## Use your own brand

Two ways, either works:

- Attach your brand guidelines (a PDF, images, or a short description) plus any logo and imagery when you ask for a deck. The skill reads them and styles to your brand.
- Or edit `assets/example-brand.json`: replace the colors, roles, fonts, and motif with yours, keeping the same keys. The layout engine reads the semantic roles (`darkBackground`, `accent`, `positive`, `negative`, and so on), so any brand drops in without touching code.

## What is inside

```
SKILL.md                          entry point: workflow, non-negotiables, reference map
assets/grid.js                    the layout engine (pptxgenjs): grid, flow, tables, charts, waterfall
assets/example-brand.json         a fictional example brand profile (replace with yours)
references/design-system.md       grid, type, color, composition, anti-AI-tell rules
references/data-visualization.md  finance and marketing chart selection, month-end layouts, waterfall recipe
references/storyboard-workflow.md topic treatment to storyboard to one-shot build
references/brand-ingestion.md     turning brand guidelines into a brand profile
references/image-backgrounds.md   using photographic or abstract backgrounds without fighting the text
```

## Notes

- The skill is a design and story layer on top of Claude's built-in PowerPoint mechanics; use both together.
- The example brand and all sample figures are fictional.
- License: choose one before publishing (MIT is a common permissive choice).
