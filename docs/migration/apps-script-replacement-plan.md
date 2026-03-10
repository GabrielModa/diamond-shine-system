# Legacy Apps Script Replacement Migration Plan

## Phase 1 — Workflow parity

- Model legacy approval chains as workflow definitions and instances.
- Route existing supply lifecycle transitions through `workflow` services.
- Add activity feed writes for all critical transitions.
- Confirm RBAC parity between old script actors and platform roles.

## Phase 2 — Automation

- Introduce `jobs` for scheduled and event-driven automations.
- Wire `notifications` delivery (in-app first, email second).
- Migrate cron-like Apps Script handlers into idempotent job runners.
- Add failure retries and dead-letter handling for long-running jobs.

## Phase 3 — Reporting

- Replace spreadsheet-driven summaries with `reports` requests.
- Generate operational and compliance exports from Prisma data.
- Add search-driven operator workflows with `search` and `activity`.
- Validate report calculations against legacy historical snapshots.

## Phase 4 — Production hardening

- Introduce `settings` toggles for staged rollout and kill-switches.
- Add file lifecycle controls via `files` for upload traceability.
- Expand observability (audit + activity + job execution telemetry).
- Run parallel operations, then deprecate Apps Script endpoints.
