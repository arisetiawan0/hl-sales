# Chart Redesign Plan

## Problem
Current bar chart looks washed-out when data is sparse — thin slivers of bars dominate, lots of empty space, no visual flow.

## Goal
Make the chart feel like a real analytics chart — rich even with low data.

## Approach: Combo chart (bars + area + line + reference)

### Layer 1 (background, behind bars)
- **Area fill gradient** under omzet line (blue, fades to transparent)
- **Area fill gradient** under profit line (green, fades to transparent, lighter)
- **Horizontal average reference line** with "Avg" label

### Layer 2 (bars — keep existing, enhance)
- Bigger visual presence (slightly wider, more vivid gradient)
- **Zero-value placeholder**: dashed outline bar instead of sliver
- Animated entrance (already done)

### Layer 3 (foreground SVG, over bars)
- **Smooth cubic-bezier trend line** connecting omzet bar tops
- **Dashed trend line** for profit (subtle)
- **Data point dots** at each peak — bigger + colored when active, hollow ring when inactive
- Trend line draws in with `stroke-dasharray` animation after bars finish

### Improvements
- Chart height: `h-48` → `h-56` (more vertical space)
- Always-visible mini labels under month names (e.g., "Rp 0", "Rp 1.2jt")
- Bigger active bar glow when locked

## Files
- `src/app/page.tsx` — replace OmzetChart
- `src/app/globals.css` — add `@keyframes line-draw`

## Verification
- tsc clean
- build clean
- lint clean
