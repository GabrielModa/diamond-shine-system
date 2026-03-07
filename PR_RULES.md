# PR Rules

This file defines pull request standards for Diamond Shine System.

## Target Branch Rule

- All pull requests must target the `dev` branch.
- Pull requests targeting `main` are not allowed.
- Direct pushes to `main` are not allowed.

## Branch Naming Rules

Use lowercase names with slash-separated scope:

- `feat/<short-feature-name>`
- `fix/<short-bug-name>`
- `test/<short-test-scope>`
- `refactor/<short-module-name>`
- `docs/<short-doc-topic>`
- `chore/<short-maintenance-topic>`

Rules:

- Keep names descriptive and concise.
- Use hyphens for multi-word segments (example: `feat/supplies-approval-flow`).
- Create one branch per pull request.

## Pull Request Description Format

Use this format in every pull request description:

```md
## Summary
- What was implemented and why.

## Scope
- Files/modules changed.
- Architecture layer affected (`app`, `api`, `modules`, `lib`, `types`, `tests`).

## Feature Spec
- Link to related file in `docs/features/`.

## Testing
- Unit tests added/updated.
- Integration/E2E impact (if any).
- Commands executed and result.

## Checklist
- [ ] Follows AGENTS.md architecture rules.
- [ ] Business logic is in `src/modules/`.
- [ ] API layer only orchestrates services.
- [ ] No duplicated permission logic.
- [ ] Tests added for new behavior.
```

## Review Checklist

Reviewer must verify:

- Branch naming follows the rules in this file.
- PR base branch is `dev`.
- Changes match the documented feature scope.
- TDD workflow was respected: tests first, then implementation.
- Core logic includes unit tests in `tests/unit`.
- API behavior (if changed) includes integration tests in `tests/integration`.
- No architecture violations:
  - UI does not contain domain logic.
  - Domain logic is in `src/modules`.
  - Shared permission rules remain centralized.
- No unauthorized framework or structural rewrite was introduced.
- Code is focused, typed, and maintainable.
