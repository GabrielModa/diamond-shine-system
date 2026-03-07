# Feature: User Management

## Description

Administrators can manage users and assign roles.

---

## Actors

Admin

---

## Actions

Create user
Update user role
Deactivate user
View user list

---

## Data

email
role
status
createdAt

---

## Roles

ADMIN
SUPERVISOR
EMPLOYEE
VIEWER

---

## Rules

Each user must have exactly one role.

Only admins can change roles.
