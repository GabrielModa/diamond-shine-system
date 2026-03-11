# Diamond Shine System

Internal management system for the Diamond Shine organization.

This project is a modern rewrite of the legacy Google Apps Script system.

The goal is to migrate the platform to a scalable and maintainable architecture using modern web technologies.

---

# Project Philosophy

This system is being rebuilt using:

• Reverse Engineering
• Test Driven Development (TDD)
• Modern Web Architecture

Instead of rewriting features blindly, we first map the entire legacy system behavior and then recreate it with automated tests.

The workflow is:

1. Map existing system behavior
2. Define domain logic
3. Write automated tests
4. Implement features that satisfy the tests

---

# Tech Stack

## Frontend

Next.js
React
TypeScript
TailwindCSS

## Backend

Next.js API Routes
Node.js

## Authentication

Local authentication (email + password)
Google OAuth login

Google login acts only as an identity provider.
Authorization and permissions are fully controlled internally.

## Database

PostgreSQL
Prisma ORM

## Testing

Vitest → Unit tests
Supertest → Integration tests
Playwright → End-to-End tests

---

# Authentication Strategy

The system supports two authentication methods:

1. Local authentication
2. Google OAuth authentication

After login, every user is stored in the system database.

User roles determine what features a user can access.

Available roles:

ADMIN
SUPERVISOR
EMPLOYEE
VIEWER

---

# System Modules

The application is composed of the following modules:

Authentication
User Management
Supplies Requests
Performance Feedback
Dashboard Analytics
Permissions System
Notifications
Data Export

Each module will be implemented through automated tests before the actual implementation.

---

# Project Structure

```id="srfjkw"
src/

app/                → Application routes
components/         → UI components
lib/                → Business logic
api/                → Backend endpoints

prisma/
schema.prisma       → Database schema

tests/
unit/               → Unit tests
integration/        → API tests
e2e/                → End-to-end tests

docs/
system-map.md       → Reverse engineering documentation
```

---

# Getting Started

Install dependencies

```id="m7x8en"
npm install
```

Run development server

```id="u7hxgo"
npm run dev
```

Run unit tests

```id="5pr3oy"
npm run test
```

Run end-to-end tests

```id="v6b9mp"
npm run test:e2e
```

---

# Development Workflow

1. Update system documentation
2. Write tests for new functionality
3. Implement code
4. Ensure all tests pass

This approach guarantees reliability and maintainability.

---

# Long Term Goals

• Replace Google Apps Script completely
• Maintain optional Google Sheets sync
• Improve performance and scalability
• Add analytics and monitoring
• Build a maintainable internal platform

---

## Environment Variables

Required:

- `DATABASE_URL` - Prisma connection string (SQLite for local dev, PostgreSQL in production).
- `NEXTAUTH_SECRET` - NextAuth secret.
- `NEXTAUTH_URL` - Base app URL.

SMTP / email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_FROM`
- `SUPPLY_ADMIN_EMAIL` (optional admin email target for supply notifications)
- `FEEDBACK_REVIEWER_EMAIL` (optional reviewer notification email)

If SMTP env vars are omitted in development, the system defaults to an Ethereal test account.
