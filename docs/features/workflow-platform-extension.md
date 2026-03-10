# Workflow Platform Extension

## Existing module capability analysis

Current domain modules already cover the foundation:

- **auth**: local registration and password reset lifecycle.
- **users**: user provisioning, role changes, activation lifecycle.
- **supplies**: request submission + approval/rejection/completion flow.
- **feedback**: employee performance scoring and reviewer comments.
- **audit**: immutable action log creation and admin-only listing.
- **dashboard**: aggregate operational metrics for ADMIN/SUPERVISOR.

## Missing business logic from legacy workflow systems

To reach Google Apps Script workflow parity, the platform still needs:

- Workflow orchestration engine (state transitions and versioned definitions)
- Notifications (in-app + email channel abstraction)
- Background jobs (scheduled processing for automation)
- Reporting pipeline (async report requests)
- File management (uploaded artifact metadata)
- Runtime system settings (admin-managed configuration)
- Activity feeds (user timeline and global admin feed)
- Cross-module search (users + supplies + feedback)

## Module design contracts

Every new module follows the same contract:

- `*.service.ts`: domain operations only (no HTTP objects)
- `*.types.ts`: input/output contracts
- `tests/unit/*.service.test.ts`: unit coverage for role and behavior rules
- Services use dependency injection to accept Prisma delegates

## New modules added

- `workflow`
- `notifications`
- `jobs`
- `reports`
- `settings`
- `files`
- `activity`
- `search`
