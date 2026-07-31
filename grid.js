{
  "brand": "Northlight (example)",
  "tagline": "An example brand shipped with the skill",
  "source": "Fictional placeholder brand. Nothing here is real. Replace this file with your own brand profile in the same shape, or let the skill build one from your brand guidelines. Keeping the same keys means the layout engine works with any brand unchanged.",

  "colors": {
    "lightGrey": "EEF2F8",
    "blue": "2F5BEA",
    "blueDeep": "2440B8",
    "navy": "17233D",
    "amber": "F5A623",
    "coral": "E5533D",
    "slate": "9AA6C2",
    "white": "FFFFFF",
    "black": "111318"
  },

  "roles": {
    "comment": "Semantic roles are what the engine actually reads, so every brand profile must define these keys. One color dominates, one or two support, one sharp accent used sparingly.",
    "darkBackground": "navy",
    "darkBackgroundAlt": "blueDeep",
    "lightBackground": "lightGrey",
    "lightBackgroundAlt": "white",
    "textOnDark": "FFFFFF",
    "textOnLight": "17233D",
    "bodyOnLight": "17233D",
    "accent": "F5A623",
    "accentAlt": "E5533D",
    "dataSeries": ["2F5BEA", "F5A623", "17233D", "9AA6C2", "2440B8", "E5533D"],
    "positive": "2F5BEA",
    "negative": "E5533D",
    "neutral": "9AA6C2",
    "gridline": "D9E0EC",
    "axisLabel": "6B7391"
  },

  "gradients": {
    "warm": { "from": "F5A623", "to": "E5533D", "note": "amber to coral" },
    "cool": { "from": "2F5BEA", "to": "17233D", "note": "blue to navy" }
  },

  "typography": {
    "displayFont": "Arial",
    "bodyFont": "Arial",
    "qaSafeSubstitute": "Arial",
    "qaNote": "Arial is used here because it ships everywhere and renders reliably. To use your own brand font, set displayFont/bodyFont to it and set qaSafeSubstitute to the closest metric-compatible font that is definitely installed (for example Arial for a Helvetica-style face). Trust the render preview for text fit, and leave about 10 percent width slack when the brand font may substitute.",
    "displayWeight": "bold",
    "bodyWeight": "normal",
    "headlineCase": "sentence",
    "headlineCaseNote": "Set headlines in sentence case, not all caps, unless the brand guidelines say otherwise. Small section labels are the only all-caps element."
  },

  "voice": {
    "principles": ["Clear", "Direct", "Confident"],
    "rules": [
      "Plain language, short sentences.",
      "No jargon or posturing.",
      "Lead with the outcome (traffic, revenue, growth, P&L).",
      "Sentence-case headlines, never all caps."
    ],
    "gutCheck": ["Is the point clear on first read?", "Is the outcome obvious?"]
  },

  "motif": {
    "primary": "Pick one repeatable element and use it on every slide. This example uses rounded-corner cards as containers plus a single small accent shape (for instance a circle or a corner tab). Replace with your brand's signature shape if it has one.",
    "containers": "Rounded-corner cards and full-bleed color panels with a large corner radius (about 0.2 inch at deck scale).",
    "pattern": "Optional low-opacity background texture behind title and divider slides only, never behind dense data."
  },

  "logo": {
    "baseColors": ["17233D", "FFFFFF"],
    "rules": [
      "Use the provided logo asset. Do not redraw it.",
      "Never recolor, stretch, squash, rotate, or add effects.",
      "Keep clear space around the logo.",
      "Pick the lockup that reads cleanly on the current background."
    ]
  },

  "layoutTokens": {
    "sectionLabelCase": "upper",
    "wayfindingSidebar": "Optional rotated small-caps side label (for example the brand or deck name) on the right edge of dense content slides. Typographic wayfinding, not a decorative stripe.",
    "pageNumber": "Small page number in a bottom corner, optionally with a tiny brand tick.",
    "twoColorHeadline": "Headlines may split across two colors for emphasis, for example a dark word plus an accent word."
  },

  "assets": {
    "note": "This example ships with no logo or imagery files. Attach your own logo lockups and any brand imagery and reference them here so the engine embeds the real files rather than redrawing them."
  }
}
