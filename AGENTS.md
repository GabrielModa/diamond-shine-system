# AGENTS.md

This document defines how AI agents (Codex or other automated coding agents) should operate within this repository.

Agents must follow these architectural rules when generating or modifying code.

Agents must never push directly to the main branch.

All changes must be proposed through pull requests.

---

# Project Overview

Diamond Shine System is an internal management platform built with modern web technologies.

The system is a full rewrite of a legacy Google Apps Script application.

Development follows:

* Reverse Engineering
* Test Driven Development (TDD)
* Modular architecture

Agents must prioritize maintainability, testability and clarity.

---

# Tech Stack

Frontend

Next.js
React
TypeScript
TailwindCSS

Backend

Next.js API routes
Node.js

Database

PostgreSQL
Prisma ORM

Testing

Vitest → unit tests
Supertest → integration tests
Playwright → end-to-end tests

---

# Architecture Rules

Agents must respect the following project structure.

src/

app/ → Next.js pages and layouts
components/ → reusable UI components
modules/ → business logic (domain services)
api/ → API handlers
lib/ → shared utilities
types/ → TypeScript types

tests/

unit/ → unit tests
integration/ → API tests
e2e/ → end-to-end tests

docs/

system documentation and feature specifications

prisma/

database schema and migrations

---

# Separation of Responsibilities

Business logic must never live inside UI components.

The correct flow is:

UI
→ API
→ Domain modules
→ Database

Agents must implement domain logic inside:

src/modules/

Example:

supplies.service.ts
users.service.ts

API routes should only call services.

---

# Permission System

The system uses Role Based Access Control.

Roles

ADMIN
SUPERVISOR
EMPLOYEE
VIEWER

Permission rules are implemented in:

src/lib/permissions.ts

Agents must not duplicate permission logic in multiple places.

---

# Development Workflow

Agents must follow Test Driven Development.

Steps:

1. Read feature specification from docs/features
2. Write tests first
3. Implement minimal code to pass tests
4. Refactor if necessary

Agents must not implement features without corresponding tests.

---

# Feature Documentation

All system features are defined in:

docs/features/

Agents must read feature specifications before implementing functionality.

Feature files describe:

Actors
Actions
Data models
Permission rules

---

# Database Rules

Database models must be defined using Prisma.

Schema file:

prisma/schema.prisma

Agents must not introduce database logic outside the Prisma client.

---

# Code Quality Rules

Agents must:

Use TypeScript strictly
Avoid duplicated logic
Write small focused functions
Use descriptive naming

Agents must not introduce large monolithic files.

---

# Testing Rules

All core business logic must be covered by unit tests.

Test files must be placed in:

tests/unit

API tests must be placed in:

tests/integration

UI flows must be tested using Playwright.

---

# Commit Rules

Agents should produce small atomic commits.

Commit message format:

feat: new feature
fix: bug fix
test: add tests
refactor: improve structure
docs: documentation update
chore: maintenance tasks

---

# Forbidden Actions

Agents must NOT:

Rewrite the entire project structure without instruction
Introduce new frameworks without approval
Remove tests
Modify documentation arbitrarily

---

# Long Term System Goals

Replace the legacy Google Apps Script system
Maintain optional Google Sheets synchronization
Provide scalable internal management tools

Agents should prioritize maintainability and clarity over quick hacks.
