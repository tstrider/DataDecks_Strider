# Image backgrounds

Generated imagery is the weakest link in an AI-built deck: generate blind and you get literal, busy, on-the-nose pictures that fight the text. The fix is two layers, write the prompt as a deliberate step, review it, *then* generate, and to treat backgrounds as texture, not illustration.

Use this only when a slide genuinely benefits from a photographic or abstract background (hero, section divider, mood-setting). Data slides and dense content slides should sit on a solid or gradient ground, never a busy image.

## Two-layer method

**Layer 1, write the prompts first, all of them, before generating anything.** For each slide that needs a background, write a detailed image prompt as text and keep it with the storyboard. A good background prompt is:

- **Abstract or heavily out-of-focus**, so it can't compete with the content. Motion blur, bokeh, gradient light, soft geometric forms, not a sharp literal scene with a subject the eye locks onto.
- **On-palette.** Name the brand colors explicitly in the prompt so the image is born in-brand rather than color-corrected after. For example: "deep navy to blue gradient with warm amber motion-blur streaks, soft bokeh, dark, energetic, no text, no logos."
- **Compositionally intentional.** Say where the quiet negative space should sit (the side the text will occupy). "Dark, uncluttered left third for text; energy concentrated on the right."
- **Complementary across the deck.** Prompts should share palette, treatment, and mood so the backgrounds read as one family. Note the shared treatment once and vary only the subject.
- **Clean of artifacts.** Add "no text, no watermark, no logo, no readable signage."

Review the prompts (or let the user review them) before spending generation on them. This is the layer people skip, and it's the layer that determines quality.

**Layer 2, generate, then mask to background weight.** Generate from the approved prompts using whatever image-generation capability is available in the environment (e.g. an imagegen skill). Then make each image recede so text stays legible:

- **Darken/lighten toward the ground.** Composite a semi-transparent brand-color panel over the image (a deep-purple panel at 40-60% opacity for a dark deck, a white/light panel for a light deck), or reduce the image's own opacity over a solid brand fill. In pptxgenjs, place the image full-bleed, then a full-slide brand-color rectangle with `transparency: 45-60` on top; text goes above that. This is the "transparency mask" step, it's what turns a picture into a background.
- **Push contrast where the text sits.** If text is on the left, keep the mask heaviest on the left so type has a clean field. A per-slide gradient overlay (a gradient image, since pptxgenjs gradient fills aren't supported) does this well.
- **Mask into the brand shape when appropriate.** If the brand has a signature shape (for example a semicircle, arch, or tab), crop or mask the image into that shape for hero and section slides so the imagery is unmistakably on brand.

Order in the build: generate all images -> apply masks -> then lay slides on top. Never interleave generation with slide-building.

## Graceful fallback (often the better choice)

Image generation may be unavailable, or the brand may simply not need photography. Many strong brand systems lean heavily on **solid color panels and two-color gradients**, with imagery reserved for specific hero moments, so the color *is* the design. Prefer these when in doubt:

- **Solid brand panel** (deep purple, royal blue, light blue-grey), the cleanest, most reliable ground. Most content slides want this.
- **Two-color gradient**, applied as a gradient *image* set as the slide background (pptxgenjs doesn't support gradient fills). Generate a simple gradient PNG with any available image tool: warm (orange -> orange-red) or cool (royal blue -> deep purple).
- **Low-opacity brand pattern** (for example soft rings or shapes at ~15-25% opacity) behind title and divider slides only.

A deck built entirely on solid and gradient grounds with strong typography and clean charts will out-perform one padded with mediocre generated images. Reach for photography when it adds meaning, not to fill space.
