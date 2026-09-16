---
name: Hebrew Enneagram Self-Reflection
description: A quiet purple and lime personal map for a private 75-item Hebrew questionnaire
colors:
  paper: "#f5f5fa"
  surface: "#ffffff"
  ink: "#29263d"
  muted: "#625e75"
  line: "#d4d1df"
  accent: "#5443a8"
  on-accent: "#ffffff"
  soft-purple: "#ebe7fa"
  map-lime: "#e5eecb"
  map-ink: "#35462c"
  instinct-mint: "#e5f0ed"
  danger: "#ab3042"
typography:
  display:
    fontFamily: "Assistant, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(38px, 4.5vw, 62px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  question:
    fontFamily: "Assistant, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(27px, 2.9vw, 37px)"
    fontWeight: 700
    lineHeight: 1.42
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Assistant, Segoe UI, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  control: "9px"
  option: "12px"
  panel: "16px"
  feature: "20px"
  map: "26px"
  round: "50%"
spacing:
  xs: "9px"
  sm: "15px"
  md: "23px"
  lg: "34px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    padding: "11px 23px"
    height: "50px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 23px"
    height: "50px"
  answer-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.option}"
    padding: "15px 8px"
    height: "121px"
---

# Design System: Hebrew Enneagram Self-Reflection

## Overview

**Creative North Star: "The Personal Map"**

The interface is an independent, portable Hebrew RTL questionnaire that frames self-reflection as exploring a map. Purple provides direction and selection; pale lime gives the nine-point map its own recognizable field. The opening stays intentionally lean: title, short lead, three facts, one action, one save choice, and the interactive map.

The five-chapter questionnaire favors native accessible forms and a quiet task surface. The results become denser because they must remain readable, useful, and candid about uncertainty. Scores are presented as fit, not diagnosis or statistical confidence. Progress and results stay local to the browser, and the downloaded report remains readable on its own.

**Key Characteristics:**

- Hebrew-first RTL composition with embedded Assistant typography
- Purple action language paired with a pale lime personal-map field
- Sparse opening and questionnaire screens, followed by a structured long-form report
- Native controls, visible focus, error feedback, dark mode, reduced motion, and print support
- Flat tonal hierarchy with borders and color fields instead of shadows

## Colors

The palette pairs a restrained violet interface with plant-like lime and mint fields, supported by cool near-white and ink neutrals. Dark mode replaces every semantic token rather than filtering the light palette.

### Primary

- **Reflective Violet:** Leads actions, links, selected states, progress, scores, and the emphasized words in the opening title.

### Secondary

- **Personal Map Lime:** Gives the interactive nine-point map a separate, exploratory surface.
- **Instinct Mint:** Separates the instinct section within the results report.

### Neutral

- **Cool Paper:** The page background.
- **White Surface:** Controls, export panels, and interactive nodes.
- **Deep Ink:** Primary reading color.
- **Quiet Plum:** Secondary copy and metadata.
- **Cool Divider:** Borders, tracks, and structural separators.
- **Soft Purple:** Selected answers, notices, saved-state boxes, and reflective practice panels.
- **Measured Red:** Validation errors only.

**The Semantic Pair Rule.** Purple means action, progress, or selection; lime and mint identify reflective content regions.

**The Theme Token Rule.** Use the existing semantic variables for dark mode. Do not hard-code light values into interactive components.

## Typography

**Display Font:** Assistant (with Segoe UI, Arial, sans-serif fallbacks)
**Body Font:** Assistant (with Segoe UI, Arial, sans-serif fallbacks)

**Character:** The embedded variable Assistant family keeps Hebrew text warm, direct, and consistent offline. Weight and scale create hierarchy without adding a second typeface.

### Hierarchy

- **Display** (800, `clamp(38px, 4.5vw, 62px)`, 1.2): Opening statement and major identity moments.
- **Question** (700, `clamp(27px, 2.9vw, 37px)`, 1.42): One reflective prompt at a time, limited to 29 characters on wider screens.
- **Headline** (750, 28px, 1.2): Report and section headings.
- **Title** (700, 23px, 1.2): Component and detail headings.
- **Body** (400, 18px, 1.65): Reading copy; long result explanations are constrained to 66 to 75 characters.
- **Label** (600 to 750, 14px to 17px): Answers, facts, progress, controls, and score labels.

**The Hebrew Rhythm Rule.** Preserve the generous body line height and balanced headings; compact metadata before compacting explanatory prose.

## Layout

The primary content container is 1160px wide with 34px side padding. The opening is a near-even two-column grid with a 64px gap. The questionnaire uses a 230px journey rail and a flexible question area separated by 75px. Results alternate between two-column summaries and full-width tonal sections.

At 900px, gaps tighten, the journey rail becomes 175px, and large score compositions contract. At 650px, the interface becomes a single column with 22px page padding. The journey rail reduces to save and status controls, answer choices change from five columns to stacked 55px rows, result grids stack, and export actions become full width. Print mode uses a 16mm A4 margin and removes navigation and actions.

## Elevation & Depth

The system uses no box shadows. Depth comes from tonal fields, one-pixel borders, dividers, scale changes, and a slight two-pixel button lift on hover. The map enters with a 700ms clipped reveal using the shared `cubic-bezier(.16, 1, .3, 1)` easing. Reduced-motion preference removes animation and transitions.

**The Flat Surface Rule.** Keep surfaces flat at rest. Use color, border, and spacing to express hierarchy.

## Shapes

Controls use gently rounded 8px to 12px corners, standard panels use 16px, result feature panels use 20px, and the map uses a broad 26px radius. Progress tracks use 3px to 4px radii. Circular geometry is reserved for the Enneagram nodes, chapter steps, radio dots, and theme control.

## Components

### Buttons

- **Shape:** Compact rounded rectangle (9px) with a 50px minimum height and 11px by 23px padding.
- **Primary:** Violet field with white text; the opening variant is 58px high and 21px.
- **Hover / Focus:** Two-pixel upward motion on hover and a 3px violet focus outline offset by 5px.
- **Secondary / Text:** Secondary buttons use a white semantic surface with a one-pixel divider border. Text actions use violet text and reveal an underline on hover.

### Cards / Containers

- **Map panel:** Lime field, broad 26px corners, and 23px to 26px internal padding.
- **Result summary:** Soft purple field, 20px corners, and a large score separated from explanatory text by a divider.
- **Instinct section:** Mint field with 20px corners.
- **Export panel:** Semantic surface with a one-pixel border and 16px corners.
- **Shadow Strategy:** None; use the tonal hierarchy from Elevation & Depth.

### Inputs / Fields

The five answer choices are native radio inputs wrapped by full-card labels. Each card uses a semantic surface, a divider border, 12px corners, and a 121px minimum height on wide screens. Hover adds soft purple; selection uses a 2px violet border, violet copy, and a filled radio dot. At 650px the cards become horizontal 55px rows. Missing input produces measured red text with `role="alert"`.

### Navigation

The header contains the geometric Enneagram mark, a compact text brand, About, and a circular theme control. During the questionnaire, five named chapters appear in a side rail with circular step markers; mobile keeps only save and status controls. Previous and next actions remain at opposite edges in RTL order.

### Interactive Map

Nine circular 45px nodes sit on the Enneagram geometry inside the lime panel. Hover and pressed states invert to violet and grow to 1.1 scale. Selecting a node updates the short title and theme beneath the map.

### Result Scores

Scores use labeled rows with an 8px divider-colored track and violet fill. Numeric values use tabular figures. The results preserve uncertainty through explanatory copy and avoid presenting scores as probabilities.

## Do's and Don'ts

### Do:

- **Do** keep the opening limited to its title, lead, facts, primary action, save choice, and map.
- **Do** keep explanatory privacy, keyboard, method, and research material in About while retaining material uncertainty in results.
- **Do** use native form semantics, visible focus, status roles, and RTL-aware logical properties.
- **Do** preserve local-only progress and result language and the readable standalone report.

### Don't:

- **Don't** add helper paragraphs or persistent success messages to the main task flow.
- **Don't** use shadows or decorative gradients where the established tonal fields and borders provide hierarchy.
- **Don't** force a definitive type, wing, or instinct interpretation when the result is close or weak.
- **Don't** reduce answer targets below their implemented 55px mobile minimum.
