# Architecture

Diamond Shine System follows a modular layered architecture designed for maintainability, testability, and gradual feature reconstruction from the legacy system.

## Layered System Architecture

Application flow:

`UI (src/app, src/components) -> API (src/api) -> Domain Modules (src/modules) -> Database (Prisma/PostgreSQL)`

Core rules:

- Business rules must live in domain modules, not in UI components.
- API handlers orchestrate requests and call services from `src/modules`.
- Database access must happen through Prisma models and client calls.
- Permission logic remains centralized (for example, `src/lib/permissions.ts`).

## Project Folder Structure

Source code:

- `src/app/`: Next.js pages, layouts, and route-level UI.
- `src/components/`: reusable UI components.
- `src/api/`: API handlers and transport mapping.
- `src/modules/`: domain/business services (core logic).
- `src/lib/`: shared utilities and cross-cutting helpers.
- `src/types/`: shared TypeScript contracts.

Tests:

- `tests/unit/`: unit tests for domain and utility behavior.
- `tests/integration/`: API and transport integration tests.
- `tests/e2e/`: end-to-end user workflow coverage.

Supporting:

- `docs/features/`: feature specifications used before implementation.
- `prisma/`: schema and migrations.

## Domain Module Pattern

Each domain module should be small and focused, typically split as:

- `*.service.ts`: use-case methods and business rules.
- `*.types.ts`: input/output contracts for service operations.
- shared domain types in `src/types/` where cross-module reuse is needed.

Expected service style:

- Dependency injection for data access (test-friendly).
- Pure mapping/helpers for record-to-domain conversion.
- Explicit authorization/validation guards.
- Minimal, composable methods per use case.

Example responsibilities:

- `create*`: validate actor + normalize defaults + persist.
- `list*`: apply role-based filters + return mapped models.
- `approve/reject/update*`: enforce permission + persist state transition.

## API Layer Responsibilities

API routes are responsible for transport concerns only:

- Parse request payload and params.
- Resolve authenticated actor context.
- Call domain services in `src/modules`.
- Map service responses to HTTP responses.
- Map domain errors to HTTP status codes.

API routes must not:

- embed business rules,
- duplicate permission policies,
- access database models directly when a domain service exists.

## Database Layer

Database standards:

- PostgreSQL is the system database.
- Prisma is the only ORM/data-access layer.
- Models and enums are defined in `prisma/schema.prisma`.
- Migrations are managed under `prisma/`.

Usage rules:

- No raw database logic scattered across UI/API.
- Domain services receive Prisma delegates/client through dependencies.
- Data contracts in `src/types/` should reflect persisted model semantics where appropriate.

## Testing Strategy

Development follows TDD:

1. Read feature specification from `docs/features/`.
2. Write tests first.
3. Implement minimal code to pass.
4. Refactor while keeping tests green.

Test coverage expectations:

- Core business logic: unit tests in `tests/unit`.
- API behavior and contracts: integration tests in `tests/integration`.
- Critical user flows: E2E tests in `tests/e2e`.

When adding new behavior:

- Include or update tests in the relevant layer.
- Keep tests focused on observable behavior.
- Validate permission-sensitive scenarios explicitly.

## Pull Request and Branching Alignment

This document follows the repository rules in `AGENTS.md` and `PR_RULES.md`:

- Use branch naming patterns such as `docs/<topic>`, `feat/<topic>`, `fix/<topic>`.
- All pull requests must target `dev`.
- Never push directly to `main`.
