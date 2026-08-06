---
name: Sentinela
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb596'
  on-tertiary: '#581e00'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  graphite-deep: '#020617'
  slate-surface: '#1E293B'
  danger-red: '#EF4444'
  warning-amber: '#F59E0B'
  info-cyan: '#06B6D4'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1280px
---

## Brand & Style

The design system is anchored in the principles of **Security-First Minimalism**. It serves a professional audience that requires a high-reliability tool where trust is established through technical precision rather than decorative flair. The aesthetic is **Corporate / Modern**, leaning towards a "utility-grade" interface that minimizes cognitive load and eliminates distractions.

The emotional response should be one of "quiet confidence." The UI does not shout; it provides a stable, structured environment for managing sensitive data. Visual cues are used exclusively to indicate hierarchy, status, and security states, ensuring that the user's focus remains on the task of credential management.

## Colors

The palette is rooted in a professional **Dark Mode** default to reduce eye strain during extended use and provide a sophisticated "secure vault" atmosphere. 

- **Primary**: A focused, high-contrast Blue (`#2563EB`) used for primary actions and brand presence.
- **Secondary**: A calm Green (`#10B981`) representing "Safe" status and successful security validations.
- **Neutral**: A range of slates and deep graphites. The background utilizes `#020617` for maximum depth, while UI surfaces use `#1E293B` to create subtle elevation.
- **Functional**: Red is reserved strictly for destructive actions (Delete, Wipe) and critical errors. Amber is used for security warnings (e.g., "Weak Password").

## Typography

The typography strategy prioritizes legibility and technical clarity. 

- **Manrope** is used for headings to provide a modern, slightly refined geometric feel that remains professional.
- **Inter** handles all body and interface text, chosen for its exceptional readability in small sizes and high-density layouts.
- **JetBrains Mono** is a critical functional choice for sensitive data. All passwords, recovery keys, and MFA codes must be displayed in this monospaced font to ensure users can clearly distinguish between similar characters (e.g., '0' vs 'O', '1' vs 'l').

Headlines use a tight negative letter-spacing for a "sturdy" appearance, while labels use expanded tracking and uppercase for clear sectioning.

## Layout & Spacing

This design system employs a **Fixed Grid** model on desktop to maintain control over information density and scanning patterns. 

- **Desktop (1280px+)**: A 12-column grid with a fixed 280px sidebar for navigation. Content is centered with a max-width to prevent line lengths from becoming unreadable.
- **Tablet (768px - 1024px)**: Sidebar collapses into an icon-only rail or hidden drawer. Margins reduce to 24px.
- **Mobile (< 768px)**: A single-column vertical stack. Touch targets for all interactive elements (buttons, list items) must be at least 48px in height.

Spacing follows a strict 4px / 8px baseline rhythm. "Generous" whitespace is applied between unrelated functional groups to prevent visual clutter, while related data (like a username/password pair) is tightly grouped.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than heavy shadows, reinforcing the minimalist aesthetic.

1.  **Background (Level 0)**: The darkest surface (`#020617`).
2.  **Surface (Level 1)**: Cards, lists, and sidebars use a lighter slate (`#1E293B`).
3.  **Overlays (Level 2)**: Modals and tooltips use a slightly lighter grey with a **very soft ambient shadow** (15% opacity, 8px blur, 0px offset) and a subtle 1px border (`#334155`) to define the edge against the background.

This system avoids "floating" elements. Depth is used to show containment and importance, ensuring the user understands which layer is currently active (especially during complex flows like the CSV import).

## Shapes

The shape language is **Soft** (4px / 0.25rem). This choice balances the "hard" technical nature of a security tool with a touch of modern approachability. 

- **Small elements** (Inputs, Checkboxes, small buttons) use the base 4px radius.
- **Large elements** (Cards, Modals) use an 8px (0.5rem) radius.
- **Status Indicators** (Chips/Pills) may use a fully rounded "pill" shape to distinguish them from interactive buttons.

This subtle rounding prevents the UI from feeling aggressive while maintaining a structured, grid-aligned professional appearance.

## Components

### Buttons
- **Primary**: Solid blue background with white text. High emphasis.
- **Secondary**: Ghost style with a subtle border and blue text.
- **Danger**: Solid red background, used only for terminal actions. Includes a required icon + text label to prevent accidental clicks.

### Inputs & Password Fields
- **Default State**: Dark grey background with a 1px border. Labels are always persistent above the field.
- **Password Component**: Includes an "Eye" icon toggle for masking/unmasking. The unmasked text must use the `mono-data` typography.
- **Focus State**: A 2px blue ring (outline) and a slightly lightened background.

### Cards
- Used for "Vault" items and "Credentials."
- Feature a 1px border and a subtle hover state where the background color lightens by 5%. 
- Sensitive information in cards (like passwords) must be masked by default.

### Lists
- Used for member management and session logs.
- Rows are separated by thin 1px horizontal dividers. 
- Interactive rows should have a clear "Selected" state using the primary blue for the left border.

### Feedback & Toasts
- Toasts appear in the bottom-right (Web) or bottom-center (Mobile).
- They must never contain sensitive data. 
- Success toasts use a green left-accent bar; Error toasts use red.