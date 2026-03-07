# Feature: Authentication

## Description

Users must authenticate to access the system.

The system supports two authentication methods:

• Local authentication (email and password)
• Google OAuth login

Google OAuth is used only for identity verification.

The system database controls permissions and roles.

---

## Actors

User
Administrator

---

## Actions

Login with email and password
Login with Google
Logout
Create account on first login

---

## Data

email
password
provider
role
createdAt

---

## Authentication Flow

User attempts login

If user does not exist
→ Create user record

If user exists
→ Load user role

Then create authenticated session.

---

## Security Rules

Passwords must be hashed.

Sessions must expire automatically.

Only authenticated users can access protected routes.
