# Full App Redesign Plan

## Approach
Build shared design-system components, then apply across all pages in parallel batches.

## Phase 1 — Shared Components (inline)
Create in `src/components/shared/`:
- `PageHeader.tsx` — hero header (gradient bg, decorative orbs, title, subtitle, breadcrumbs, action buttons, optional inline stats)
- `StatCard.tsx` — extracted stat card with accent + sparkline (already in dashboard)
- `StatusBadge.tsx` — LUNAS (green) / PIUTANG (amber) / BONUS (violet) / ACTIVE / INACTIVE badges
- `EmptyState.tsx` — icon + title + description + optional CTA
- `InfoRow.tsx` — label/value row used in detail cards
- `SectionCard.tsx` — generic card with header (icon + title + optional action) and content
- `SearchBar.tsx` — search input with icon + clear button

## Phase 2 — Parallel Agents
- Agent A: list pages — `/pelanggan`, `/produk`, `/bon`
- Agent B: form pages — `/pelanggan/tambah`, `/produk/tambah`, `/bon/tambah`
- Agent C: edit pages — `/pelanggan/[id]/edit`, `/produk/[id]/edit`, `/bon/[id]/edit`
- Agent D: detail pages — `/pelanggan/[id]`, `/bon/[id]` + `/login`

## Phase 3 — Verification
- `tsc --noEmit`
- `next build`
- `next lint`
- Spot-check each page renders

## Constraints
- NO functionality changes
- NO new dependencies
- Reuse existing CSS variables + Tailwind classes
- Keep Bahasa Indonesia
- Preserve existing data fetching and state logic
- Keep forms working (don't break validation/submit)
