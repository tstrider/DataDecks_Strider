# Data visualization

This is where a finance or marketing deck is won or lost. The goal is not "add a chart", it is to make one number or one shape do the arguing, cleanly, on brand. Read this whenever a slide carries data.

## Contents
- The one rule
- Choosing the right chart
- Month-end / finance layouts
- Marketing-data layouts
- The waterfall (variance bridge) recipe
- Tables that read cleanly
- Number formatting
- Data-ink discipline
- pptxgenjs chart mechanics

## The one rule

**The headline states the takeaway; the chart proves it.** A slide titled "Net revenue by month" wastes the most valuable line on the slide. Title it "Net revenue grew 11% on a key account and two new wins" and let the chart show it. The reader should get the point from the headline and confirm it in the visual, not reverse-engineer the point from the axes.

Corollary: one chart per slide. If two charts fight for attention, the argument splits. Put the second chart on the next slide or in an appendix.

## Choosing the right chart

| The question | Chart | Notes |
|---|---|---|
| Compare discrete categories | Horizontal bar | Sort by value (not alphabetical) unless there's a natural order. Labels read left-to-right. |
| Rank / top-N (clients, channels, LOBs) | Horizontal bar, sorted | The whale-list default. |
| Trend over time | Line | One line is clearest; cap at 3-4 before it turns to spaghetti. |
| Actual vs plan vs prior year | Clustered column, or bullet | 2-3 series max. Direct-label the variance. |
| Part-to-whole, one period | Stacked bar (single) or 100% stacked | Avoid pie beyond 2-3 slices; humans can't compare angles. |
| Mix change over time | 100% stacked column or area | Shows share shifting. |
| Bridge between two totals (variance) | Waterfall | Revenue bridge, cost bridge, budget-to-actual. Recipe below. |
| Two metrics, different scales | Combo (column + line, secondary axis) | Spend vs ROAS, revenue vs margin %. |
| Relationship between two variables | Scatter | Correlation, e.g. spend vs conversions by campaign. |
| A single headline number | No chart, a big stat callout | Don't chart one number; use `g.statCallout`. |

Defaults for finance: bar axes start at zero, always (a truncated axis exaggerates and will be caught). Time on the x-axis runs left to right. Currency series share one unit.

## Month-end / finance layouts

A clean month-end pack has a rhythm. Typical spine:

1. **KPI scorecard (opener).** A row of 3-5 large stat callouts: net revenue, vs plan, vs prior year, EBITDA, run-rate. Each with a small variance line in `positive`/`negative` color. Use `g.kpiRow`. This is the whole month in four seconds.
2. **Revenue bridge (waterfall).** Prior-period total on the left, the drivers as up/down steps (new business, churn, expansion, one client broken out if it moves the number), current total on the right.
3. **Actual vs forecast vs prior year.** Clustered columns by month or by LOB, with the variance called out.
4. **Cost / headcount bridge.** A waterfall decomposing a variance into its causes (merit increases, new hires, departures, open-role expansion), the same bridge structure as revenue, in cost direction.
5. **Contribution / mix.** Which LOB or client drove the change; sorted bar or 100% stacked.
6. **Trend + annotation.** A run-rate or rolling trend line with a callout on the inflection point.

Every data slide: takeaway headline, one visual, a one-line "so what" if the chart needs interpretation, and the source in the caption. Validate every total against a known figure before the deck ships, a bridge whose steps don't sum to the endpoints is worse than no bridge.

## Marketing-data layouts

- **Funnel:** stage-to-stage volume with conversion % between stages (built as a sorted horizontal bar or a stacked shape). Annotate the biggest drop-off.
- **Channel performance:** sorted bar of the primary metric (revenue, conversions), with a combo overlay for efficiency (ROAS, CPA) on a secondary axis.
- **Spend vs return:** combo column (spend) + line (ROAS/ROI), secondary axis.
- **Campaign comparison:** small-multiple bars or a sorted bar; keep one metric per view.
- **Cohort / pacing:** line or heat-table; annotate whether pacing is ahead or behind plan.

## The waterfall (variance bridge) recipe

pptxgenjs has no native waterfall. Build it as a **stacked bar chart with an invisible spacer series**:

- Series 1 (`base`): the running cumulative floor each step sits on. Fill = transparent (`chartColors` entry made invisible via a transparent series, or set that series' fill to the background and drop its data label). This lifts each delta to the right height.
- Series 2 (`increase`): positive deltas, brand `positive` color, data labels on.
- Series 3 (`decrease`): negative deltas, brand `negative` color.
- First and last categories (the opening and closing totals) sit on a zero base with the full value shown as a "total" color.

Compute the `base` values yourself: for each step, `base[i] = running total before this step's delta` (0 for totals and for the first increase from zero). Label each visible segment with its signed value. Because it's a stacked bar, **data label position must be `ctr`, `inEnd`, or `inBase`, `outEnd` corrupts the file.** Order categories left to right in bridge order. Add thin connector logic only if needed; often the stacked steps read fine without connectors.

## Tables that read cleanly

Use `g.table`. Rules:

- **Right-align every numeric column; left-align text columns.** Misaligned decimals are the fastest way to look unprofessional.
- **Consistent decimals within a column.** All to 0, or all to 1, never mixed.
- **Header row filled** in a dark brand color with reversed text; **zebra** the body rows in a very light tint for readability.
- **Total row bold**, with a thin rule *above* it. A rule under a subtotal is a legitimate accounting convention and is not the decorative "stripe" the anti-AI-tell rule forbids, that rule targets ornamental edge stripes on cards and slides, not a total underline in a financial table.
- **Highlight the variance column** (color the numbers `positive`/`negative`, or tint the cell). That's the column the reader came for.
- **Keep tables small.** A table over ~8 rows x 6 columns belongs in an appendix; on the main slide, show the rows that carry the point and reference the full detail.

## Number formatting

- **Pick one unit and hold it.** $M or $K across the deck, not both on the same page. State the unit once (axis title or a "$ in thousands" note).
- **Signed variances.** Show `+` on favorable and `-` on unfavorable, colored by `positive`/`negative`. A variance without a sign makes the reader do the direction work.
- **Percent vs points.** "margin rose to 42%" is a level; "margin rose 3 pts" is a change; "up 30 bps" for basis points. Don't blur them.
- **Thousands separators**, and don't over-precision: `$4.2M`, not `$4,214,880.34`, on a summary slide.

## Data-ink discipline

Strip everything that isn't the data:

- No 3D, no bar gradients, no drop shadows on chart elements, no heavy gridlines. `g.chartStyle` already quiets the frame: one faint horizontal gridline color, no category gridlines, muted axis labels.
- **Direct-label over legend** where you can (put the series name at the end of its line/bar). Reserve the legend for 3+ series that can't be direct-labeled; `chartStyle` keeps it off by default.
- **Sort bars by value.** An unsorted bar chart makes the reader hunt for the biggest.
- Use the accent color to draw the eye to the one bar/point that matters; leave the rest in a neutral series color. Color is a spotlight, not decoration.

## Axes, labels, and depth

- **Never show a phantom negative axis, and start bar/column axes at 0.** On length-encoded charts (bars, columns) the axis must floor at 0: a truncated column axis exaggerates small differences, and an axis running to -80 under positive-only data is a defect. `g.valAxis(values)` returns the correct `valAxisMinVal`/`valAxisMaxVal` (0 when non-negative, a nice negative range only when the data has negatives). Pass `chartStyle({ values })` to apply it. Line charts are the exception: a line encodes position and slope, not length, so a focused non-zero floor is honest and often clearer for a trend, set those bounds explicitly.
- **Label each series once.** A legend and a direct end-of-line label for the same series is redundant clutter (the classic "Forecast" text floating next to a dashed line the legend already names). Pick one: a legend, or direct labels at the ends of the lines/bars, never both.
- **Waterfalls focus the axis on the region of change.** When the opening balance dwarfs the step deltas, an axis anchored at 0 crushes the deltas to slivers. Set the floor just below the lowest level the bridge reaches so the deltas are legible, and keep the total bars anchored to that floor with their true values labelled (standard bridge convention, and honest because the labels carry the real magnitude). `g.waterfall` computes this focus band automatically.
- **Subtle depth is optional and must stay subtle.** A whisper of shadow on bars/columns can add polish; heavy chart shadows read as dated. `chartStyle({ shadow: { opacity: 0.2, blur: 4, offset: 3 } })` adds a restrained one. Rendering varies by engine, so confirm it in PowerPoint and drop it if it looks heavy.

## pptxgenjs chart mechanics

Keep charts native (`addChart`) so they stay editable in PowerPoint; only truly unsupported types (Sankey, chord) go in as images. Merge `g.chartStyle()` with the type-specific options. Watch the footguns the base pptx skill documents: stacked-bar label position (`ctr`/`inEnd`/`inBase` only), and any secondary-axis combo needs **both** `valAxes` and `catAxes` declared with two entries each or PowerPoint discards the chart. After building, run the file validation from SKILL.md, it catches exactly these two chart faults and names the fix.
