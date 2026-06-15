# Dashboard UI Improvement Plan

## Goal
Make HL Sales dashboard visually more attractive and modern while keeping existing functionality intact.

## Target file
- `src/app/page.tsx` (Dashboard page) — main work
- `src/app/globals.css` — add subtle background pattern + small utility

## Improvements

### 1. Hero greeting card (NEW, top of dashboard)
- Large gradient card (blue → violet)
- Decorative blurred orbs (background effect)
- Greeting based on time of day
- Inline mini stats (Pelanggan / Transaksi / Omzet / Bonus)
- Replaces the plain "Dashboard" header text

### 2. Stat cards redesign
- White card with colored top accent line (gradient)
- Larger icon with gradient icon-bg + ring
- Sparkline mini-bars in the bottom-right corner showing 6-month trend
- Hover: lift + colored shadow

### 3. Chart improvements
- Y-axis labels with currency format
- Subtle horizontal grid lines
- Bars with gradient fill (top→bottom)
- Peak month gets a subtle glow
- Animated entrance (CSS transition)
- Cleaner legend

### 4. Activity timeline redesign
- Date pill on the left (day + month stacked)
- Color-coded circle icons per status
- Better spacing, hover highlight
- "Lihat semua" CTA footer

### 5. Quick actions redesign
- Each action: gradient background, large icon circle, arrow always visible (not hidden)
- Hover: lift + stronger shadow
- More vertical breathing room

### 6. Bonus card enhancement
- Add decorative pattern overlay
- Stack counter more prominent
- Add "Lihat semua" footer link

### 7. Background polish (globals.css)
- Subtle radial gradient background on main content
- Soft grid pattern overlay (very low opacity)

## Constraints
- No new dependencies (no recharts, no framer-motion)
- Use existing CSS variables + Tailwind classes
- Keep existing color tokens (oklch blues / violet / success / warning)
- Don't break responsiveness (still mobile-friendly grid)
- Bahasa Indonesia text preserved
- Functionality (load data, calculations) unchanged

## Verification
- `npx tsc --noEmit` clean (no type errors)
- Visual smoke: dev server still starts and renders the dashboard route
