# Diamond Shine System Map

This document describes the functional map of the legacy system.

It is used to reconstruct the system through automated tests.

---

# 1 Authentication Module

Actors

User
Administrator

Features

Login with Google
Local login (future implementation)
User session management

Actions

Login
Logout
Create user on first login

Data

email
provider
session

---

# 2 User Roles Module

Roles

ADMIN
SUPERVISOR
EMPLOYEE
VIEWER

Responsibilities

Determine system permissions.

Permissions

ADMIN
Full system access

SUPERVISOR
Supplies
Feedback

EMPLOYEE
Supplies only

VIEWER
No active modules

---

# 3 Supplies Requests Module

Actors

Employee
Supervisor
Admin

Actions

Create supply request
View request history
Approve request
Reject request

Data

item
quantity
department
requestDate
status

Status

Pending
Approved
Rejected

Permissions

Employee
Create request
View own requests

Supervisor
View team requests
Approve requests

Admin
Full access

---

# 4 Performance Feedback Module

Actors

Supervisor
Admin

Actions

Submit feedback
Evaluate employee performance
View feedback history

Data

employee
reviewer
score
comments
date

Permissions

Supervisor
Create feedback

Admin
View all feedback

---

# 5 Dashboard Module

Actors

Supervisor
Admin

Features

Analytics
Reports
Performance indicators

Metrics

Total requests
Requests by department
Employee performance scores

Permissions

Supervisor
Limited dashboard

Admin
Full dashboard

---

# 6 Permission System

Permission rules determine which modules a user can access.

Access matrix

ADMIN

Supplies
Feedback
Dashboard

SUPERVISOR

Supplies
Feedback

EMPLOYEE

Supplies

VIEWER

None

---

# 7 Notifications Module (Future)

Planned features

Email notifications
Request status updates
Feedback alerts

---

# 8 Data Export Module (Future)

Export system data.

Possible formats

CSV
Excel
Google Sheets

---

# System Goals

The new system must:

Maintain feature parity with the legacy system
Improve maintainability
Improve security
Improve scalability

Every module must be covered by automated tests before implementation.
