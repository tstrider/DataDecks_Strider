# Design system

The rules that make a deck look designed rather than assembled: one grid, one type scale, colors with jobs, a small set of named layouts, and a list of habits that give AI-built decks away. `assets/grid.js` encodes most of this, so the fastest way to follow the rules is to place everything through it.

## Contents
- Grid discipline
- Vertical rhythm
- Type scale
- Color logic
- Composition patterns (the named layouts)
- Anti-AI-tell rules
- grid.js quick reference

## Grid discipline

The "everything looks slightly off" feeling almost always comes from elements that are nearly aligned. Nearly aligned reads as a mistake; exactly aligned reads as intent.

- **Canvas:** wide, 13.333 x 7.5 in. `makeGrid` sets it; do it before adding any slide.
- **Margins:** 0.6 in on all four sides. Never below 0.5 in. Nothing touches the edge except full-bleed backgrounds and images.
- **Columns:** 12 columns with 0.25 in gutters inside the margins. Place every element with `g.col(start, span)`. Columns are 1-based: `g.col(1, 12)` is full width, `g.col(1, 6)` and `g.col(7, 6)` are halves, `g.col(1, 8)` plus `g.col(9, 4)` is the classic chart-plus-commentary split.
- **Shared edges:** elements in the same visual column share the same column start. A headline, the chart below it, and the source line under that all start at the same x.
- **Text boxes have padding.** Set `margin: 0` on any text that must line up with a shape, a chart, or other text. Every grid.js text helper already does this.
- **Pick spans that divide cleanly.** 12, 6+6, 4+4+4, 3+3+3+3, 8+4, 7+5. Avoid spans that leave one orphan column.

## Vertical rhythm

- **Never hardcode a y under text that can wrap.** A headline that wraps to two lines will collide with a body placed at a fixed y. Use `g.stack`, which measures each block and returns the next free y.
- **Three gap sizes only** (`g.GAP`): `tight` (0.12 in) for a label to its headline or a number to its caption, `block` (0.3 in) between a headline, its body, and the visual, `section` (0.55 in) between unrelated groups. Uniform gaps are most of what makes a slide feel calm.
- **Rows share a baseline.** Cards in a row share a top and a height (`g.kpiRow` sizes every card to the tallest content).
- **Leave room to breathe.** If content reaches the bottom margin, the slide holds too much. Cut or split it; don't shrink the type.

## Type scale

One display font, one body font (from the brand profile), and a fixed scale. Sizes are in points for the wide canvas (`g.TYPE`):

| Role | Size | Use |
|---|---|---|
| display | 44 | Title, section divider, and closing slides |
| stat | 54 | The big number in a stat callout (40 to 46 in a row of 4 or 5) |
| title | 30 | Slide headline |
| subtitle | 20 | Deck subtitle, lead-in sentence |
| body | 16 | Body copy and bullets. Never below 14 on a content slide |
| small | 12 | Card captions, table text, variance lines |
| label | 11 | Small all-caps section label above a headline |
| caption | 10 | Source lines and footnotes |

Rules:

- **Headlines are sentences in sentence case** that state the point. Never all caps; the small section label is the only all-caps text.
- **Two lines at most** for a headline. If it wraps to three, rewrite it shorter.
- **No lone last word.** `g.title` glues the last two words together so a headline never ends with one word on its own line.
- **Size contrast does the work.** A slide needs one clearly dominant element. If the headline, the chart, and the body all feel the same weight, nothing leads.
- **Left-align** text by default. Center only short display lines on title or divider slides.
- **Bullets:** 3 to 5, each under two lines, parallel in form. More than that belongs on a second slide or in a table.

## Color logic

A palette is a list of hexes until each color has a job. The brand profile's `roles` give them jobs, and build code uses role names, never raw hex (`g.hx("accent")`).

- **Dominance:** one ground color carries most of the deck, one or two colors support it, and one sharp accent appears rarely. A useful ratio is roughly 60 / 30 / 10.
- **The accent is a spotlight.** Use it on the one word, bar, or number the eye should land on. If three things on a slide are in the accent color, none of them stands out.
- **Sandwich the tone.** Dark ground (`darkBackground`) for the opener, section dividers, and closer. Light ground (`lightBackground`) for content. `g.slide("dark")` and `g.slide("light")` set the ground and every helper picks readable text colors for it.
- **Data colors come from roles.** Series use `dataSeries` in order. Variance uses `positive` and `negative`, never the accent. Neutral context series use `neutral`.
- **Contrast:** body text needs strong contrast with its ground. Never put mid-tone text on a mid-tone fill, and never set small text in the accent on a light ground unless the pair is clearly readable.
- **No invented colors.** If the build needs a color the profile lacks, add it to the profile with a role and say so, rather than dropping a stray hex into the code.

## Composition patterns (the named layouts)

These are the layout names the storyboard uses. Vary them; a deck where every slide is title-plus-bullets fails however polished it is.

| Layout | Build |
|---|---|
| **title** | Dark ground. Label, display headline, subtitle, stacked in `col(1, 9)` and placed in the lower-middle of the slide. Optional emphasis word in the accent. |
| **statement** | One sentence, display size, lots of empty space. For the single idea the audience must remember. |
| **section divider** | Dark ground. Short display headline, optional label with the section number. |
| **two-column** | Headline across 12 columns, then `col(1, 6)` and `col(7, 6)`, or 7 + 5 when one side is a visual. |
| **chart-led** | Takeaway headline across the top, chart in `col(1, 8)` with two or three commentary bullets in `col(9, 4)`, or the chart at full width with a source line. |
| **KPI scorecard** | Headline, then `g.kpiRow` with 3 to 5 stat callouts, then one line of commentary. |
| **table** | Takeaway headline, then `g.table` at full width. 8 rows by 6 columns at most. |
| **2x2 grid** | Four `g.card`s at `col(1, 6)` and `col(7, 6)` on two rows, each with a short heading and one or two lines. |
| **half-bleed image** | Image fills the left or right half edge to edge; text sits in the other half on the grid. |
| **closing** | Dark ground. The ask or the next step in one line, plus contact or date. |

A few more habits:

- **Every slide earns a visual:** a chart, a table, a stat callout, cards, an image, or a bold color panel. No text-only slides.
- **One idea per slide.** Two charts on one slide split the argument.
- **Repeat the motif.** Use the brand's one repeatable element (rounded cards in the example brand) on every content slide so the deck reads as one system.
- **Source every data slide** with `g.source` at the bottom, in caption size.

## Anti-AI-tell rules

These are the habits that make a deck look machine-made. Never do them:

- **No accent line under the title** and no short colored bar above it.
- **No decorative bars or stripes:** no header or footer bands across the slide, no vertical sidebar stripes, no thin colored strip down one edge of a card. To set a card apart, use a tint, a soft shadow, or an icon. (A thin rule above a total row in a financial table is an accounting convention, not decoration, and is fine.)
- **No cream or beige default grounds.** Use the brand's grounds.
- **No all-caps headlines** unless the brand guidelines require them.
- **No icon in a colored circle beside every bullet.** Icons are fine when they carry meaning, not as filler.
- **No emoji** in titles or bullets.
- **No generic stock phrases** such as "Key takeaways," "Overview," or "Introduction" as headlines. State the point.
- **No identical layouts back to back** for more than two slides.
- **No gradients on bars, 3D charts, or heavy chart shadows.**
- **No invented numbers.** A missing figure is written `[TK]` and raised with the user.
- **Typographic wayfinding** (a small rotated side label, a page number with a brand tick) is fine only when the brand guidelines show it.

## grid.js quick reference

```js
const pptxgen = require("pptxgenjs");
const { makeGrid } = require("./assets/grid.js");
const pres = new pptxgen();
const g = makeGrid(pres, require("./assets/example-brand.json")); // sets LAYOUT_WIDE
```

Every placement helper takes `{ col: [start, span] }` (or `{ x, w }`) and `y` in inches, and returns the next free y below what it drew.

| Helper | What it does |
|---|---|
| `g.slide("light" \| "dark")` | New slide with the brand ground. Helpers read the tone to pick text colors. |
| `g.col(start, span)` | `{ x, w }` for columns 1 to 12. Spread it into any pptxgenjs options. |
| `g.GAP` | `{ tight, block, section }` spacing sizes, in inches. |
| `g.TYPE` | The type scale above, in points. |
| `g.stack(slide, blocks, opts)` | Flows `label`, `title`, `subtitle`, and `body` blocks with measured heights and uniform gaps. Returns the next free y. |
| `g.label(slide, text, opts)` | Small all-caps section label. |
| `g.title(slide, text, opts)` | Headline. Binds the last two words. `emphasis: "phrase"` sets that phrase in the accent. |
| `g.body(slide, textOrArray, opts)` | Body copy. An array becomes bullets (`bullets: false` for plain paragraphs). |
| `g.card(slide, opts)` | Rounded card on the grid with a soft shadow. Returns the padded inner box. |
| `g.statCallout(slide, { value, label, delta, good })` | One big number, its caption, and a signed delta colored by sign. `good: false` flips the color when up is bad. |
| `g.kpiRow(slide, items, opts)` | 3 to 5 stat callouts in equal cards across the content width. |
| `g.table(slide, rows, { total, variance })` | Table that fills its span. Numeric columns right-align on their own. Dark header, zebra rows, bold total with a rule above, variance column colored by sign. |
| `g.chartStyle({ values, colors, legend, shadow, slide })` | Quiet, on-brand chart options. With `values`, applies `g.valAxis`. Merge with the chart's own options. |
| `g.valAxis(values)` | `valAxisMinVal`, `valAxisMaxVal`, `valAxisMajorUnit`. Floors at 0 unless the data has negatives. |
| `g.waterfall(slide, steps, opts)` | Variance bridge. Steps are `{ label, value, total }`. Checks that every total ties out, focuses the axis on the band of change, and labels each bar with its signed value. `goodWhenNegative: true` for cost bridges. |
| `g.source(slide, text)` | Source line pinned above the bottom margin. |
| `g.pageNumber(slide, n)` | Small page number, bottom right. |
| `g.hx(role)` | Hex for a role or brand color name, for example `g.hx("accent")`. |
| `g.series()` | The brand's data series colors, in order. |
| `g.measure(text, size, w)` | Estimated `{ lines, h }` for text in a width. Useful for custom layouts. |
| `g.room(y)` | Inches left between y and the bottom margin. |

Text heights are estimated from Arial letter widths, with extra slack for other fonts. The estimate is close, not exact, so the render-and-inspect QA pass in SKILL.md still decides whether text fits.
