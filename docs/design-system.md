# Be — Design System Specification

A wellness/mood-tracking app that helps users name feelings, talk them through, and see patterns over time.

## Architecture

- Mobile-first (390px viewport)
- 4-tab navigation: Today (check-in), Talk (AI conversation), Patterns, Journal
- Warm, editorial aesthetic — cream backgrounds, rounded shapes, generous whitespace

---

## Color System

### Palette Philosophy

The palette is built on a plum-and-cream foundation with 4 mood quadrant color families. Every emotion in the app maps to one of 4 quadrants on a 2×2 grid:

| | Unpleasant | Pleasant |
|---|---|---|
| **High energy** | Coral/warm red | Amber/warm orange |
| **Low energy** | Blue/lavender | Green/mint |

### Quadrant Color Mapping

Each quadrant has a full color ramp — use the semantic token, not the raw hex:

| Quadrant | Text color | Ink (on-gradient) | Background | Light | Card tint |
|---|---|---|---|---|---|
| `high-unpleasant` | `#8D3823` | `#5C1A0E` | `#F47C7C` | `#FFF0ED` | `#FAD6CC` |
| `high-pleasant` | `#84540F` | `#84540F` | `#FFB07C` | `#FFE7D1` | `#FFE8C2` |
| `low-pleasant` | `#1C5C4A` | `#1C5C4A` | `#C7DFCF` | `#B9DCCB` | `#D1EDE0` |
| `low-unpleasant` | `#3B3E80` | `#3B3E80` | `#AFCFE8` | `#CCCFE3` | `rgba(224,219,245,0.75)` |

> **"Ink" vs "Text" explained:**
> - **Text** is the standard quadrant color for use on light backgrounds (cream, white, card tints).
> - **Ink** is the WCAG AA–safe color for text placed on the quadrant's gradient background (emotion cards). For three quadrants ink = text. For `high-unpleasant` the standard text color fails AA on the coral→amber gradient, so ink is darkened to `#5C1A0E`.
> - **Rule:** use `ink` for any text sitting directly on a gradient; use `text` everywhere else.

### How to Map New Emotions to Colors

Every emotion gets classified into one quadrant. The app should NEVER assign colors per-emotion — always per-quadrant. When adding new emotions:

1. Determine the emotion's energy level (high or low)
2. Determine valence (pleasant or unpleasant)
3. Use the corresponding quadrant's color tokens

Examples:
- "Anxious", "Angry", "Frustrated", "Stressed" → `high-unpleasant`
- "Excited", "Joyful", "Proud", "Enthusiastic" → `high-pleasant`
- "Peaceful", "Content", "Relieved", "Grateful" → `low-pleasant`
- "Sad", "Lonely", "Melancholy", "Bored" → `low-unpleasant`

### How to Map Patterns to Colors

Cognitive patterns (e.g. "Labeling yourself", "Jumping to the worst case") are not inherently tied to a quadrant. Use one of these strategies:

- **Frequency-based (recommended):** Query which quadrant has the most check-in entries tagged with that pattern, then use that quadrant's card tint color.
- **Fixed mapping:** Assign each pattern a default quadrant in the data model.

### Core Palette

- **Primary background:** `#FFF7EF` (cream)
- **Surface/cards:** `#FFFFFF` or `rgba(255,255,255,0.5–0.65)`
- **Primary text:** `#352840` (plum 900) — used for all headings and body text
- **Secondary text:** `#725F75` (plum 700)
- **Muted text:** `#8E9194` (plum 500)
- **Primary CTA:** `#FF5B44` (coral) — used for Continue, Save, Send buttons and user chat bubbles
- **Accent:** `#A898F2` (lavender)
- **Dividers/borders:** `#F0EDE8` (sand)

---

## Typography

Three typeface families serve distinct roles:

### Nunito — Headings (rounded, warm, friendly)
| Style | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| Display | ExtraBold (800) | 32px | 40px | Hero text, large feature titles |
| H1 | Bold (700) | 28px | 36px | Screen titles ("How are you feeling now?") |
| H2 | Bold (700) | 24px | 32px | Section titles ("The shape of the month") |
| H3 | Bold (700) | 20px | 28px | Card titles, subsections |
| H4 | SemiBold (600) | 15px | 22px | Small section headers |
| H5 | SemiBold (600) | 13px | 18px | Category labels |

### Lora — Body & editorial (serif, warmth and trust)
| Style | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| Large | Regular (400) | 18px | 28px | AI conversation text, pull quotes |
| Default | Regular (400) | 15px | 24px | Body copy, descriptions |
| Small | Regular (400) | 13px | 20px | Pattern card descriptions, secondary info |
| Large Bold | Bold (700) | 18px | 28px | Emphasized body text |
| Default Bold | Bold (700) | 15px | 24px | Bold body, inline emphasis |
| Small Bold | Bold (700) | 13px | 20px | Bold small text |
| Italic | Italic (400) | 15px | 24px | Emotional prompts ("It is ok to feel.") |
| Nav Label | Regular (400) | 11px | 14px | Bottom nav tab label (inactive) |
| Nav Label Active | Bold (700) | 11px | 14px | Bottom nav tab label (active) |
| Overline | Bold (700) | 11px | 14px | Section overlines ("PATTERNS"), letter-spacing 1.5px, uppercase |

### Inter — UI (clarity, precision, functional)
| Style | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| Label Large | SemiBold (600) | 15px | 20px | Primary labels |
| Label Default | SemiBold (600) | 13px | 18px | Standard labels, entry counts |
| Label Small | Medium (500) | 12px | 16px | Tab bar labels, small tags |
| Button | SemiBold (600) | 14px | 20px | Generic button text (note: primary buttons use Nunito Bold 15) |
| Caption | Medium (500) | 10.5px | 14px | Timestamps, metadata |
| Overline | SemiBold (600) | 10.5px | 14px | Generic UI overlines, letter-spacing 1px, uppercase (note: Section Header uses Lora Bold 11 instead) |
| Input | Regular (400) | 16px | 22px | Text input fields |

### Geist Mono — Data accent
| Style | Weight | Size | Line height | Usage |
|---|---|---|---|---|
| Default | Regular (400) | 12px | 18px | Data labels, chart annotations |
| Bold | Bold (700) | 12px | 18px | Emphasized data |

### Important typography notes for implementation
- **Primary buttons** (Continue, Save entry) use **Nunito Bold 15px** with dark text (`#352840`), NOT Inter
- **Secondary buttons** (Start, Sign in) use **Lora Bold 16px** with dark text
- **Ghost buttons** (Back) use **Nunito Bold 15px**
- **Bottom nav labels** use **Lora Bold 11px** (active) and **Lora Regular 11px** (inactive) — token: `body.nav-label` / `body.nav-label-active`
- **Section overlines** (e.g. "PATTERNS") use **Lora Bold 11px**, 1.5px letter-spacing, uppercase — token: `body.overline`. This is NOT the same as `ui.overline` (Inter 10.5px / 1px tracking), which is for generic UI labels
- All button text is dark (`#352840`), never white — even on the coral primary button

---

## Spacing

Built on a base-2 scale derived from actual screen measurements:

2px — hairline gaps 
4px — icon internal spacing, tight groups 
6px — compact list item spacing 
8px — small component padding 
10px — medium component padding 
12px — standard element spacing 
16px — section internal spacing, card padding 
20px — card padding, content margins 
24px — section spacing 
28px — generous padding (screen edges) 
32px — large section gaps 
40px — major section breaks 
48px — hero spacing 64px — page-level vertical rhythm


---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Small badges, tags |
| `sm` | 8px | Context tags, small cards |
| `md` | 12px | Medium containers |
| `lg` | 16px | Context tags, list items |
| `xl` | 24px | Cards (pattern cards, emotion cards, journal entries) |
| `2xl` | 32px | Large containers |
| `3xl` | 40px | Mood quadrant circles |
| `pill` | 48px | Buttons, mood bubbles, pill shapes |
| `full` | 999px | Primary/secondary buttons (fully rounded) |

---

## Components

### Button/Primary
- **Background:** `#FF5B44` (coral)
- **Text:** Nunito Bold 15px, color `#352840` (dark, not white)
- **Radius:** 999px (full pill)
- **Padding:** 14px vertical, 24px horizontal
- **Width:** flexible or fixed depending on context

### Button/Secondary
- **Background:** none (transparent)
- **Border:** 1.5px solid `rgba(53, 40, 64, 0.2)`
- **Text:** Lora Bold 16px, color `#352840`
- **Radius:** 999px

### Button/Ghost
- **Background:** none
- **Text:** Nunito Bold 15px, color `#352840`
- **No border**

### Input/Default
- **Label:** Lora Regular 13px, color `#725F75`
- **Value:** Lora Regular 15px, color `#352840`
- **Divider:** 1px line, `rgba(53, 40, 64, 0.15)`
- **No border or background on the field itself** (underline style)

### Chat Bubble/User
- **Background:** `#FF5B44` (coral)
- **Text:** Lora Regular 15px / 22px line height, color `#352840` (dark text on coral — NOT white)
- **Radius:** 16px
- **Padding:** 12px vertical, 16px horizontal

### Chat Bubble/AI
- **Background:** `rgba(255, 255, 255, 0.7)`
- **Text:** Lora Regular 15px / 22px line height, color `#352840`
- **Radius:** 16px
- **Padding:** 12px vertical, 16px horizontal

### Context Tag
- **Default state:** `rgba(255, 255, 255, 0.44)` bg, 1px stroke, Nunito Bold 15px dark text, radius 16px
- **Selected state:** `#C9C2F3` (lavender) bg, Nunito Bold 15px dark text, radius 16px

### Emotion Card
Two states: Collapsed and Expanded. 4 tone variants each (HighUn, HighPl, LowPl, LowUn).

> **Accessibility note — text color on gradients:**
> The original Figma design uses white text on all emotion card gradients. This fails WCAG AA contrast on every quadrant (ratios range from 1.39:1 to 2.62:1; AA requires 4.5:1). For production, use the quadrant's **ink** token instead of white — this yields ≥4.5:1 contrast on all quadrants. See `mood.[quadrant].ink` in tokens.json.

**Collapsed (journal list view):**
- **Size:** 342 × 134px
- **Radius:** 24px
- **Background:** linear gradient based on mood quadrant
- **Mood label:** Lora Bold 20px, use quadrant `ink` color
- **Context tag:** Nunito Bold 11px, use quadrant `ink` color, on `rgba(255,255,255,0.3)` chip
- **Time:** Nunito SemiBold 12px, use quadrant `ink` color

**Expanded (detail view):**
- **Width:** 342px, height auto
- **Radius:** 24px
- **Background:** same gradient as collapsed
- **All text uses quadrant `ink` color**
- **Sections (top to bottom):**
  - Header: Mood label (Lora Bold 28px) + context tag + time
  - "HOW YOU FELT": Nunito Bold 12px label, Lora Regular 16px body
  - "WHAT HAPPENED": Nunito Bold 12px label, Lora Regular 16px body
  - "THE THOUGHT": Nunito Bold 12px label, Lora Italic 15px body (quoted)
  - Pattern chips: pill-shaped tags (Lora SemiBold 10px, ink color on `rgba(255,255,255,0.25)`, radius 999)
  - "THE NEW BELIEF" card: frosted card (`rgba(255,255,255,0.2)`, radius 16px) with Lora Regular 15px body
  - "Talk it through" link: Nunito Bold 13px

**Tone gradients:**
- HighUn: `linear-gradient(90deg, #F47C7C, #FFB07C)` — coral to amber
- HighPl: `linear-gradient(90deg, #FFB07C, #F6D79F)` — amber to soft gold
- LowPl: `linear-gradient(90deg, #B9DCCB, #C7DFCF)` — sage to mint
- LowUn: `linear-gradient(90deg, #AFCFE8, #C9C2F3)` — sky to lavender

### Pattern Card
- **Width:** 342–350px, height auto
- **Radius:** 24px
- **Background:** solid tint based on mood quadrant
- **Title:** Nunito ExtraBold 18px, dark text
- **Entry count:** Nunito SemiBold 13px, secondary text
- **Description:** Lora Regular 13px / 20px, secondary text
- **Footer:** Nunito SemiBold 13px, muted text ("Last session" / "Today")
- **Padding:** 16px vertical, 20px horizontal
- **Item spacing:** 8px
- **Tone variants:** HighUn (`#FAD6CC`), HighPl (`#FFE8C2`), LowPl (`#D1EDE0`), LowUn (`rgba(224,219,245,0.75)`)

### Mood Bubble
- **Size:** 96 × 96px circle (radius 48px)
- **Text:** Inter Medium 12px (default), Inter Bold 12px (selected)
- **Default state:** subtle tinted fill, text in quadrant color, no stroke
- **Selected state:** tinted fill, text in quadrant color, stroke in quadrant color
- **Tone variants:** HighUn, HighPl, LowPl, LowUn (each with Default + Selected)

### Section Header
- **Overline:** Lora Bold 11px, uppercase, letter-spacing 1.5px, secondary text color — token: `body.overline`
- **Title:** Nunito Bold 24px, primary text color

### Bottom Nav Bar
- **Width:** 390px (full screen width)
- **Height:** 72px
- **Background:** white
- **Padding:** 12px top, 22px bottom (safe area), 40px horizontal
- **Layout:** horizontal, space-between
- **Tabs:** 4 items (Today, Talk, Patterns, Journal)
- **Active tab:** Lora Bold 11px + filled icon — token: `body.nav-label-active`
- **Inactive tab:** Lora Regular 11px, 50% opacity + outlined icon — token: `body.nav-label`
- **Icon size:** 22 × 22px (vector icons, not filled circles)
- **Icons:** circle (Today), message-circle (Talk), waves (Patterns), book-open (Journal)

---

## Screen Background

Most screens use a warm gradient background:
- Base: `#FFF7EF` (cream)
- Subtle warm gradient overlays with peach/apricot tones at top-left and bottom-right
- Cards float on `rgba(255, 255, 255, 0.5–0.65)` surfaces

---

## Mood Quadrant Model

The core data model for the emotion system:

```typescript
type MoodQuadrant = 'high-unpleasant' | 'high-pleasant' | 'low-pleasant' | 'low-unpleasant';

// Every emotion maps to exactly one quadrant
interface Emotion {
  name: string;
  quadrant: MoodQuadrant;
}

// Get the color tokens for any quadrant
function getQuadrantColors(quadrant: MoodQuadrant) {
  return {
    text: tokens.color.primitives.mood[quadrant].text,       // for light backgrounds
    ink: tokens.color.primitives.mood[quadrant].ink,          // for on-gradient text (WCAG AA safe)
    bg: tokens.color.primitives.mood[quadrant].bg,
    light: tokens.color.primitives.mood[quadrant].light,
    cardTint: tokens.gradients['pattern-card'][quadrant],
    gradient: tokens.gradients['emotion-card'][quadrant],
  };
}

#### Current emotion inventory (60 emotions across 4 quadrants)

**High Energy Unpleasant:** Angry, Scared, Overwhelmed, Stressed, Anxious, Restless, Jealous, Frustrated, Nervous, Embarrassed, Irritated, Impatient, Resentful, Ashamed, Hurt, Insecure

**High Energy Pleasant:** Determined, Energised, Excited, Enthusiastic, Playful, Joyful, Confident, Inspired, Proud, Hopeful, Amused, Awed

**Low Energy Pleasant:** Peaceful, Content, Relieved, Grateful, Relaxed, Calm, Comfortable, Satisfied, Secure, Tender, Loved, Serene, Accepting

**Low Energy Unpleasant:** Grieving, Guilty, Disappointed, Lonely, Sad, Discouraged, Hopeless, Withdrawn, Bored

New emotions are added by classifying them into a quadrant — no new colors needed.
