<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Analytics must match the product

PostHog tracks every step of the funnel. **Whenever you change a flow, page, step, button or payment path, update the
analytics in the same change** — add, rename or remove events in `lib/analytics/events.ts`, their call sites, and the
catalog in `docs/analytics.md`. Read the rules at the end of `docs/analytics.md` before touching any UI or flow, and
mention in your summary which events you added, changed or removed (or that none were needed).
