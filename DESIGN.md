---
name: NH Local Toolbox
description: A useful Hebrew tool directory as a carefully made retro desktop.
colors:
  paper: "#f5f5ef"
  surface: "#fffef9"
  ink: "#253b32"
  muted: "#536358"
  line: "#b8c2b5"
  accent: "#def59a"
  accent-ink: "#253b32"
  hero: "#e7ecdf"
  screen: "#263e33"
  screen-ink: "#e7f0d7"
  skill: "#ddecba"
  web: "#d6e9e7"
  script: "#f1e4c9"
  extension: "#e8ddee"
  paper-dark: "#19271f"
  surface-dark: "#213328"
  ink-dark: "#edf2e5"
  muted-dark: "#b9c6b5"
  line-dark: "#596c59"
  hero-dark: "#25392b"
  screen-dark: "#111e16"
  skill-dark: "#30452a"
  web-dark: "#263e3e"
  script-dark: "#403b29"
  extension-dark: "#3e3343"
typography:
  display:
    fontFamily: 'Assistant, "Segoe UI", sans-serif'
    fontSize: "clamp(44px, 4.9vw, 66px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-.035em"
  headline:
    fontFamily: 'Assistant, "Segoe UI", sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.16
  title:
    fontFamily: 'Assistant, "Segoe UI", sans-serif'
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.16
  body:
    fontFamily: 'Assistant, "Segoe UI", sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  button:
    fontFamily: 'Assistant, "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: '"Cascadia Code", Consolas, monospace'
    fontSize: "11px"
    fontWeight: 400
spacing:
  button-block: "8px"
  button-inline: "15px"
  card-inset: "23px"
  page-inset: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    padding: "8px 15px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    padding: "8px 15px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "0 17px"
  category-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "9px 11px"
  tool-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "{spacing.card-inset}"
  directory-drawer-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    padding: "8px 14px"
---

# Design System: NH Local Toolbox

## Overview

**Creative North Star: "A carefully made retro desktop"**

The user selected polished terminal and pixel references. The implemented world combines paper grey, green ink, phosphor lime, crisp frames, and readable Hebrew. The directory window supplies the retro character; ordinary reading and tool actions stay clear and familiar.

This is a record of the generated catalog shell, extracted from `template.html`, `assets/site.css`, `assets/site.js`, `assets/theme.js`, and `assets/space-grid.js`. Independent browser tools can retain their own interfaces. The existing direction contract and `PRODUCT.md` establish the approved identity; this document records its implementation.

**Key Characteristics:**

- Hebrew RTL with locally served Assistant and restrained monospace metadata.
- Square outlines, connected catalog cells, and hard offset shadows.
- Light and dark palettes with stable lime accents.
- A quiet spacetime grid, brief input feedback, and three Easter eggs explained in the footer: double G, three clicks on the terminal title or help button for a cat, and search 42.

## Colors

The primary accent is pale phosphor lime (`accent`), paired with fixed green `accent-ink` for readable buttons and discoveries. Neutral paper, surface, ink, muted, line, and hero tokens organize the page. Screen tokens keep the directory window dark in both themes.

Category colors distinguish skill green, web teal, script sand, and extension lavender on small icon tiles. They supplement category names and symbols rather than carrying meaning alone.

The frontmatter lists light values and explicit dark overrides. Dark mode replaces the matching neutral, screen, and category tokens; accent, accent ink, and screen ink remain unchanged. Runtime components use the unsuffixed CSS custom properties, which resolve with the active theme. A saved explicit theme wins; otherwise the system preference applies and remains reactive. The sidecar includes derived tonal ramps for design-panel previews.

## Typography

Assistant is a local variable font covering weights 200 through 800 with `font-display: swap`. Hebrew titles use its heavy end; body copy uses its regular weight. Cascadia Code, then Consolas and the system monospace fallback, handles filenames, counts, terminal commands, and short English labels.

The frontmatter records desktop hero, section heading, card title, body, button, and small metadata roles. Page titles separately use `clamp(38px, 5vw, 58px)` at weight 800. Hero descriptions are 20px with 1.6 line height and a 44ch measure. Card descriptions are 16px with 1.65 line height and up to 65ch; prose stays around 72ch to 74ch. Headings balance wrapping.

The document is `lang="he" dir="rtl"`. Layout uses logical inline/block properties. Terminal chrome and URLs explicitly use LTR, and mixed names use directional isolation. Preserve normal Hebrew shaping; pixel character comes from geometry and small Latin metadata.

## Layout

The shell has a centered 1264px maximum width with 40px inline padding. A sticky header leads into the hero, whose text and terminal window use a 1.18:1 grid with a 66px gap. The catalog pairs a 205px sticky sidebar with flexible content and a 46px gap. Tool cells form two adjoining columns, with 23px internal padding. A sole tool or sole search result spans the list width; a structurally single card places actions alongside its content on wider screens.

| Maximum width | Implemented response |
| --- | --- |
| 1050px | Tighter navigation and hero gaps; 175px catalog sidebar, 28px catalog gap, 18px card padding |
| 780px | 22px page gutters; expandable mobile navigation; category navigation wraps above the catalog; hero retains two equal columns |
| 560px | 18px page gutters; stacked hero and about page; single column cards; terminal drawers form two columns; unrotated terminal frame |

At 780px and below, the hero heading is 43px; at 560px and below it uses `clamp(42px, 10.8vw, 60px)`. Small-screen body text is 17px. Guides keep a compact icon column. Footer links wrap without relying on horizontal scrolling. Print uses a white, single-column reading layout and hides the interactive shell and grid.

## Elevation & Depth

Depth is structural and crisp. Terminal windows, the about note, and the sharing dialog use the hard frame shadow (7px 7px, no blur), green in light mode and near-black in dark mode. Buttons gain a smaller 3px hard shadow with a slight upper-left shift on hover, then depress on activation. Easter egg notices use a 4px offset shadow. Catalog cells remain flat and change surface tone on hover.

The terminal frame rests at a small negative rotation (2 degrees). On fine hover-capable pointers, hover or keyboard focus inside straightens it over 450ms. The background canvas sits behind the content with no pointer interception. Its faint ink lines use 0.7px strokes, 36px spacing, and light/dark opacity of .15/.13; spacing becomes 28px below 560px.

## Shapes

Use square desktop framing, thin borders, square status marks, and small pixel-like details. Most frames and controls have 1px outlines; focus uses a clear 3px outline with a 5px offset. Search focus instead outlines its complete field with 2px at a 3px offset. The catalog's shared borders make tools read as a connected directory.

## Components

**Actions and navigation.** Buttons have a 43px minimum height; the hero action grows to 48px. Primary actions use lime, secondary actions use the surface, and text actions underline on hover. Icon buttons are 42px squares. Main navigation marks the current page with an underline; category navigation inverts to ink and paper. The mobile menu exposes its expanded state, closes on navigation, outside click, or Escape, and returns focus to its trigger on Escape. Navigation remains visible when JavaScript is unavailable.

**Search and tool cells.** The outlined search field is at least 54px high, with a visible focus boundary and a clear action. Slash focuses search outside editable controls and open dialogs; Escape in the search resets it. Search updates result counts, hides empty groups, supports a URL query, and supplies a dashed empty state with reset. Hebrew marks are normalized for matching. Linked targets get an inner outline and tinted surface; copied share actions turn lime briefly. Download actions dim with a wait cursor while busy. Live status messages report success or failure. Clipboard failure opens a native sharing dialog with an LTR, selectable URL field.

**Directory window.** Category drawers are real links. Hover and keyboard focus show their destination command, turn them lime, and move them slightly; leaving restores the default command. Startup is finite: a 650ms stepped screen scan, 460ms staggered drawer entrance, and four 500ms cursor cycles. Standard interaction easing is `cubic-bezier(.16, 1, .3, 1)` with mostly 160ms to 250ms transitions.

**Spacetime grid.** The user-approved grid rests without a continuous animation loop. A primary mouse or pen press on unoccupied background creates a draggable gravity well; release lets it settle. Up to three wells bend nearby lines. A short touch tap creates a well, while touch movement remains available for scrolling. Animation frames run only while input-created wells or particles remain; resize and theme changes redraw the resting grid.

Selection inhibition is scoped to an active background drag. The `grid-dragging` class is added only after a valid background press creates a well, then removed on release, cancellation, blur, reduced-motion activation, or page hiding. Paragraphs, headings, links, controls, tool cells, the directory window, header, and footer are excluded as drag origins. Ordinary text selection is preserved outside this temporary drag state.

**Three Easter eggs.** Pressing the physical G key twice within 1200ms, outside editable fields, shows a Hebrew 30-lives message and a short pixel burst. The shortcut works across keyboard layouts and ignores held-key repeats and modifier shortcuts. Three clicks on the terminal title reveal an SVG pixel cat; the explicit `חתול בקוד` button in the footer help also requires three clicks. Each trigger counts independently without a timing limit and displays progress after the first two clicks. Entering exactly `42` in search shows a reference to the answer to everything. Each notice lasts five seconds. A native footer disclosure labeled `ביצי פסחא` explains all three triggers and Escape dismissal. Escape clears the grid effect and notice, including while an editable control has focus.

**Reduced motion and feedback.** Reduced motion disables CSS animations/transitions and animated scrolling. The grid stays static and creates no wells or particles, while all three Easter eggs still provide their text feedback. The boot sequence is skipped, and active effects are cleared when reduced motion is enabled or the page becomes hidden. Status and Easter egg messages use polite live regions; the canvas is decorative and hidden from assistive technology.

## Do's and Don'ts

- **Do** preserve the approved Hebrew retro desktop identity and both themes.
- **Do** keep labels readable, focus visible, and ordinary content selectable.
- **Do** use square framing and restrained hard shadows for the established depth hierarchy.
- **Do** keep grid motion input-driven and honor reduced motion.
- **Don't** replace Hebrew body text with decorative pixel or monospace typography.
- **Don't** let background interaction start on reading content or actionable controls.
- **Don't** use animation or color as the only explanation of a state.
- **Don't** assume this catalog shell replaces each independent tool's own interface.
