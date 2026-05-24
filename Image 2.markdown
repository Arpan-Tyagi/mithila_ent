---
name: Living Fabric
colors:
  surface: '#fff8f6'
  surface-dim: '#fbd1c4'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#ffdbd0'
  on-surface: '#2c160e'
  on-surface-variant: '#5b403d'
  inverse-surface: '#442a22'
  inverse-on-surface: '#ffede8'
  outline: '#8f706c'
  outline-variant: '#e4beb9'
  surface-tint: '#b91d1d'
  primary: '#91000a'
  on-primary: '#ffffff'
  primary-container: '#b71c1c'
  on-primary-container: '#ffcac4'
  inverse-primary: '#ffb4ab'
  secondary: '#4c56af'
  on-secondary: '#ffffff'
  secondary-container: '#959efd'
  on-secondary-container: '#27308a'
  tertiary: '#5a4200'
  on-tertiary: '#ffffff'
  tertiary-container: '#785800'
  on-tertiary-container: '#ffd06d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#343d96'
  tertiary-fixed: '#ffdfa0'
  tertiary-fixed-dim: '#f8bd2a'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#fff8f6'
  on-background: '#2c160e'
  surface-variant: '#ffdbd0'
typography:
  headline-xl:
    fontFamily: Potta One
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Potta One
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Potta One
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Crimson Pro
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Crimson Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Crimson Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  margin-page: 32px
  gutter-patch: 24px
  padding-appliqué: 16px
---

## Brand & Style
The design system is an ode to the Mithila heritage, reimagining digital interfaces as "Living Fabric." It targets a culturally conscious audience that values artisanal craftsmanship over industrial perfection. The UI should evoke a sense of tactile warmth, as if the user is interacting with a physical piece of hand-loomed khadi.

The visual style is **Tactile / Folk-Brutalist**. It rejects the sterile smoothness of modern SaaS in favor of "Appliqué & Patches"—a system where elements feel hand-cut, stitched together, and layered. The interface is characterized by intentional organic imperfections: irregular edges, visible "running-stitch" borders, and high-frequency micro-textures that simulate the weave of unbleached linen.

## Colors
The palette is rooted in natural pigments. The base is **Khadi (#F5EEDA)**, a warm, off-white unbleached linen tone. 

- **Kajal Black (#1C1C1C):** Used for primary text and high-contrast outlines.
- **Sindoor Red (#B71C1C):** The primary action color, used for high-importance buttons and critical indicators.
- **Indigo Blue (#1A237E):** Secondary color for link states and navigation accents.
- **Haldi Yellow (#FBC02D):** Tertiary color used for highlighting and decorative fills.
- **Gobar Brown (#5D4037):** Used for structural borders, secondary labels, and "stitched" divider lines.
- **Palaash Green (#2E7D32):** Success states and organic motifs.

Colors should not be applied as flat fills; they should utilize fractal noise masks to simulate "ink-bleed" into the fabric texture.

## Typography
Typography is treated as embroidery. 

**Headings (Potta One):** These should be rendered with a "satin-stitch" SVG texture overlay. Every heading should have a subtle, hard-edged shadow in a darker shade of the font color to simulate raised thread.
**Body & Labels (Crimson Pro):** Utilizes a variable font weight to create a "running-stitch" variance, simulating the slight inconsistencies of hand-inked or hand-sewn letters. 

The vertical rhythm is loose and airy, mirroring the relaxed nature of textile compositions.

## Layout & Spacing
The layout follows a **Fluid "Patchwork" Grid**. Rather than rigid columns, components are treated as "appliqués" that are stitched onto the khadi base.

- **Breakpoints:** Mobile (under 600px), Tablet (600px-1024px), Desktop (1025px+).
- **Margins:** Page margins are wide (32px+) to allow room for decorative "lotus vine" embroidery in the corners.
- **Rhythm:** Elements should have slightly irregular margins (±4px) to avoid a machine-perfect look. Negative space should be occupied by tone-on-tone (Khadi on Khadi) SVG watermarks of sun, fish, and turtles.

## Elevation & Depth
Depth is not achieved through blur, but through **Thread Shadows**. 

- **Shadow Style:** Use hard-edged, 100% opacity shadows shifted 2px to the top-left. This simulates the height of layered fabric patches.
- **Layering:** Elements "stacked" on top of each other should have a "running stitch" divider (dashed line) at the seam.
- **Micro-noise:** Every surface must contain a micro-noise filter to maintain the illusion of raw linen.

## Shapes
Shapes are defined by "Hand-Cut" geometry. Avoid perfect circles or rectangles. 

- **Irregularity:** Use CSS `clip-path` or SVG masks to add 2-4% variance to the edges of all cards and buttons.
- **Stitching:** All containers must have a "Gobar Brown" dashed border (the running stitch) positioned 2px inside the actual element edge.

## Components
- **Buttons:** Styled as hand-cut fabric patches. Primary buttons are Sindoor Red with white running-stitch borders. On hover, the "needle-track" border should animate, appearing to be sewn in real-time.
- **Product Cards:** Featuring double Gobar Brown outlines. The four corners must feature "embroidered" lotus vine SVG motifs.
- **Inputs:** Simple Kajal Black bottom-borders with an ink-bleed effect on focus. The cursor should be styled as a needle head.
- **Chips:** Small, irregular circular patches with a single Indigo Blue stitch across the center.
- **Transitions:** Page changes must use a "textile scroll" effect, where content appears to unroll vertically with a slight cloth-physics bounce.
- **Motion:** Use fractal noise masks for any color transitions, making it look as though dye is spreading through the fibers.