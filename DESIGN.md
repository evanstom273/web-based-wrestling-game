---
name: Wrestling Creator
description: Dark controls and a live procedural wrestler studio.
colors:
  creator-bg: '#151d1e'
  creator-text: '#f1f4f1'
  creator-muted: '#b1c0ba'
  creator-accent: '#b2d7c5'
  creator-line: '#3c4b47'
  accent-ink: '#182b23'
  field-border: '#53665c'
  field-bg: '#152019'
  select-bg: '#213029'
  save-bg: '#1c2822'
  hover-bg: '#293a32'
  primary-hover: '#ceeadb'
  focus: '#e6ce95'
  error: '#ffc8b5'
  studio-bg: '#b6b9b9'
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  headline:
    fontSize: 'clamp(20px, 2vw, 28px)'
    fontWeight: 700
    letterSpacing: '-0.025em'
  title:
    fontSize: '17px'
    fontWeight: 650
  label:
    fontSize: '13px'
  note:
    fontSize: '12px'
    lineHeight: 1.65
rounded:
  tab: '4px'
  control: '5px'
  swatch: '50%'
spacing:
  compact: '8px'
  control: '12px'
  panel-compact: '18px'
  section: '24px'
components:
  button-primary:
    backgroundColor: '{colors.creator-accent}'
    textColor: '{colors.accent-ink}'
    rounded: '{rounded.control}'
    padding: '8px 14px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    rounded: '{rounded.control}'
    padding: '10px'
  input-name:
    backgroundColor: '{colors.field-bg}'
    textColor: '{colors.creator-text}'
    rounded: '{rounded.control}'
    padding: '8px 10px'
  tab-selected:
    backgroundColor: '{colors.creator-accent}'
    textColor: '{colors.accent-ink}'
    rounded: '{rounded.tab}'
---

# Design System: Wrestling Creator

## Overview

The implemented creator pairs dark green-gray controls with mint selection states and a neutral, lit 3D studio. The wrestler is the visual focus; compact labeled controls support immediate customization. This document records the existing creator surface, not a new brand identity.

## Colors

Mint identifies primary actions, selected categories, and camera choices. Light text and muted green-gray labels sit on the dark control background. Warm focus outlines remain distinct from selection; peach text marks save errors. The neutral studio background keeps character and attire colors readable.

## Typography

The system uses the inherited sans-serif stack throughout. Bold, slightly tightened page headings lead the hierarchy; medium-weight section titles and small labels keep controls compact. Supporting notes use generous line height. Slider values use tabular numerals; muscle percentage receives larger, medium-weight emphasis.

## Layout

The creator uses a full-height two-column grid: flexible studio and a control panel sized with `clamp(320px, 28vw, 390px)`. The header is 72px high. The panel holds fixed category navigation and save controls around independently scrolling content. Sections use 24px vertical padding and thin dividers.

At widths up to 1000px, the panel becomes 300px and content padding narrows to 18px. Landscape screens up to 500px high use a 52px header, denser sections, and compact save controls; the studio hint is hidden. Narrow portrait screens up to 699px show the rotate-device gate. Larger square or unfolded layouts retain the creator. Header, orientation gate, and save footer account for safe-area insets.

## Elevation & Depth

Controls use flat tonal surfaces and thin borders, without UI box shadows. Depth comes from the procedural studio's lighting, ground shadow, and low circular platform. Keep interface depth separate from character rendering.

## Shapes

Controls have subtly rounded corners, with slightly tighter category tabs. Palette swatches are circles. Panel structure uses straight dividers instead of a grid of raised cards.

## Components

- **Primary action:** mint save button with dark text, brighter hover, and reduced opacity when disabled.
- **Secondary actions:** outlined preset/reset controls with dark green hover; preset selection adds a mint border and tinted fill.
- **Fields:** full-width dark text/select fields with visible borders. Range controls use mint accents, adjacent values, and descriptive endpoints for muscle mass.
- **Navigation:** four equal category tabs with a mint selected state; keyboard arrows, Home, and End move between categories. Camera buttons use pressed states and remain beside the studio.
- **Palette:** circular preset colors show a text-colored selection outline, beside a native custom color input.
- **Focus and motion:** interactive elements use a 2px warm outline offset by 3px. Button color transitions take 150ms with ease-out and are disabled under reduced-motion preference.

## Do's and Don'ts

- Do keep the live wrestler visible beside customization controls.
- Do retain explicit labels, visible focus, and practical touch targets; most buttons and fields are at least 44px high.
- Do keep the existing dark and mint visual authority.
- Don't make inspection controls the primary creator experience.
- Don't compress the playable interface into a narrow portrait phone layout.
