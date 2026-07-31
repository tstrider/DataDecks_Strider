# Storyboard-first workflow

Great one-shot decks are not written slide by slide in code. They are *designed on paper first*, reviewed, then built in a single pass. Skipping the storyboard is the single biggest cause of decks that have to be redone: layout gets decided implicitly while writing code, so every slide drifts and nothing is coherent.

Follow three stages. Stop and get a human decision between stages 2 and 3 unless the user explicitly said "just build it."

## Stage 1: Topic treatment (the argument)

Before any layout thinking, write a short treatment in prose:

- **The one-sentence takeaway** the audience should leave with.
- **The audience** and what they already know / care about (a CFO reading a month-end pack wants variance and drivers, not methodology).
- **The spine**: the 4-8 beats that carry the argument in order. Each beat becomes one slide, occasionally two. If a beat needs three slides, it is really three beats.
- **The evidence** each beat rests on (a number, a chart, a comparison, a quote).

Keep it tight. This is the thinking, not the deck.

## Stage 2: Textual storyboard (the design, on paper)

Produce a slide-by-slide storyboard as text. This is what the user edits. Use exactly these fields per slide so nothing is left implicit:

```
Slide N: [purpose in 3-5 words]
  Headline:   [the sentence-case line the audience reads first]
  Content:    [the specific words, numbers, or bullets: real content, not "chart goes here"]
  Layout:     [pick a named layout: title / statement / two-column / half-bleed image /
               2x2 grid / KPI scorecard / chart-led / table / section divider / closing]
  Visual:     [the chart type + what it shows, OR the image concept, OR "solid/gradient panel"]
  Aesthetic:  [background role (dark/light), accent usage, motif element, any emphasis word]
  Data note:  [source + exact figures if this slide carries data, so the build can't invent them]
```

Rules that make the storyboard buildable in one shot:

- **Vary the layout.** A deck where every slide is title-plus-bullets is a failure regardless of polish. Alternate: a statement slide, then a two-column, then a chart-led, then a KPI scorecard. The base pptx skill's "avoid repeating the same layout" applies here at design time, not build time.
- **Sandwich the tone.** Dark background for the opener, section dividers, and closer; light backgrounds for content. This gives the deck rhythm and a premium feel.
- **Name real content.** "Q3 net revenue $4.2M, +11% vs plan" not "revenue stat." The build stage must never fabricate a number the storyboard didn't specify. If a figure is unknown, write `[TK: figure]` so it surfaces as a gap instead of an invented value.
- **Decide emphasis words now.** If a headline splits across two colors (a common brand move), mark which word carries the accent.
- **Flag every image.** Any slide needing a generated background gets its image concept named here; the actual prompt is written in Stage 3 per `image-backgrounds.md`.

Present the storyboard and ask for edits before building. Editing text is cheap; editing a rendered deck is not.

## Stage 3: One-shot build

With the approved storyboard, build the whole deck in one `pptxgenjs` pass:

1. Load the brand profile and `assets/grid.js`; set `pres.layout` to WIDE (13.333 x 7.5) *before* adding slides.
2. If any slide needs a generated background, write all image prompts first, generate them, apply transparency masks (see `image-backgrounds.md`), then build slides. Two layers: prompts, then images, never generate blind.
3. Build each slide against the grid using the storyboard's layout name. Place headline, content, and visual with `grid.js` helpers so nothing is positioned by eye.
4. Run the full QA loop (content dump, file validation, visual render-and-inspect) from SKILL.md and fix real defects before delivering.

The storyboard is the contract. If the build wants to deviate (a chart type doesn't fit, a slide is too dense), fix the storyboard and note the change rather than silently improvising in code.
