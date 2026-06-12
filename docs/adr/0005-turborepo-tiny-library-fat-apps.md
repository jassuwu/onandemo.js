# 0005 — A turborepo of one tiny library and fat apps

## Context

"As few lines as possible" is a library constraint, not a repo constraint: the thing
pages load should be featherweight and do only the little things it has to do; the
site, the demo videos, and the browser extensions around it are normal apps with
normal budgets. With site + remotion + extension spokes all depending on one hub
package, the repo is a monorepo whether we name it one or not.

## Considered options

- **Library at repo root + bun workspaces (the liquid-glass-cursor mold):** rejected — works at three packages, but every added spoke crowds the root, and retrofitting the packages/apps split later is churn at the worst time.
- **Turborepo layout, bun as the only runtime (chosen).** turbo is just the task runner — the library still builds with bun build and installs with bun install.

## Decision

Adopt the conventional turborepo layout now: **`packages/onandemo`** is the
deliberately tiny, zero-dependency library; **`apps/*`** (site, remotion, extensions)
are unconstrained consumers. bun stays the package manager and runtime everywhere;
turbo only orders and caches the package.json scripts.

## Consequences

- The size discipline gets a sharp boundary: anything that isn't chase behavior lives in an app, not the library. The playground, the Recipe page, the marketing — all apps.
- npm publishes from `packages/onandemo`; the lgc-style `files` whitelist moves there.
- One more devDep (turbo) and a root turbo.json — accepted ceremony, paid once.
- New distribution targets join as `apps/*` without touching the library or the layout.
