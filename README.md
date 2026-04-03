## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Role Model and Access Control](#role-model-and-access-control)
- [API Reference](#api-reference)

---

## Overview

FinLedger is a full-stack financial dashboard system. The backend manages users, financial records, and analytics. The frontend is a single-page dashboard UI served directly by the same Express server — no separate hosting needed.

Different users interact with the system based on their role. A **viewer** sees the dashboard. An **analyst** can also query and filter raw transaction records. An **admin** has full control over records and user accounts.

---

## Features

**Backend**
- JWT authentication with bcrypt password hashing
- Role-based access control (viewer / analyst / admin) enforced at the middleware layer
- Full financial records CRUD — create, read, update, soft-delete
- Rich filtering — by type, category, date range, and full-text search
- Pagination and sortable results on all list endpoints
- 7 dashboard analytics endpoints — KPI summary, category breakdown, monthly trends (12-month), weekly trends (8-week), recent activity, and top spending
- Both trend endpoints guarantee fixed-length series with zero-filled gaps for empty periods
- Centralized error handling with consistent JSON error shape
- Input validation with per-field error messages
- Security: Helmet headers, CORS, global rate limiting
- Graceful shutdown on `SIGTERM`

**Frontend**
- Single-file dashboard UI served at `/` — no build step
- Dark terminal-finance aesthetic (IBM Plex Mono + Syne)
- Login screen with JWT token persistence across page reloads
- Role-aware rendering — nav items, buttons, and columns appear only for authorized roles
- Live transaction filters: type, category, date range, debounced search
- Create / edit / delete transactions via modal (admin only)
- User management with one-click activate / deactivate (admin only)
- SPA routing — direct browser navigation to `/dashboard`, `/transactions` etc. works correctly

**Testing**
- 41 integration tests across 3 suites
- Isolated in-memory SQLite database per test run
- Covers: auth flows, RBAC enforcement per role, full CRUD lifecycle, validation rejection, soft-delete visibility, pagination, trend gap-filling, and edge cases

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js 22 | Built-in `node:sqlite` — no native compilation |
| Framework | Express 4 | Minimal, composable, widely understood |
| Database | SQLite via `node:sqlite` | Zero setup, full SQL, file-based |
| Auth | JWT + `jsonwebtoken` | Stateless, easy to test |
| Password hashing | `bcryptjs` | Pure JS — no native bindings |
| Validation | `express-validator` | Declarative rules per route |
| Security | `helmet` + `express-rate-limit` | HTTP headers + abuse protection |
| Testing | Jest + Supertest | HTTP-level integration tests |
| Frontend | Vanilla HTML/CSS/JS | No build tooling, single file |

---

## Architecture

```
HTTP Request
     │
     ▼
┌─────────────┐
│   Routes    │  ← Declares RBAC guards, validators, and handler per endpoint
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │  ← authenticate → authorize (RBAC) → validate (input rules)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │  ← Parse request, call service, send response. No DB calls here.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  ← All business rules: role guards, uniqueness, aggregations
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │  ← All SQL in one place. No raw queries outside model files.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SQLite    │  ← node:sqlite built-in (WAL mode, foreign keys enabled)
└─────────────┘
       │
       ▼
  Error Handler  ← Every thrown AppError lands here. One consistent response shape.
```

Each layer has exactly one responsibility. Changing a business rule touches only the service. Changing the schema touches only the model. Changing who can call an endpoint touches only the route.

---

## Project Structure

```
finledger-api/
├── public/
│   └── index.html               # Single-file frontend dashboard
├── src/
│   ├── config/
│   │   └── database.js          # DB connection, WAL/FK pragmas, schema bootstrap
│   ├── middleware/
│   │   ├── auth.js              # JWT verification, re-fetches user on every request
│   │   ├── rbac.js              # Role hierarchy and authorize() middleware factory
│   │   ├── validate.js          # express-validator result → 422 with field errors
│   │   └── errorHandler.js      # Centralized JSON error responses
│   ├── models/
│   │   ├── user.model.js        # All SQL for the users table
│   │   └── transaction.model.js # All SQL for the transactions table (incl. soft delete)
│   ├── services/
│   │   ├── auth.service.js      # Register (viewer-only), login, token signing
│   │   ├── user.service.js      # User management with role-change guards
│   │   ├── transaction.service.js
│   │   └── dashboard.service.js # All aggregation queries with gap-fill logic
│   ├── controllers/             # One file per resource — thin HTTP ↔ service bridge
│   ├── routes/                  # Declarative: middleware chain + handler per endpoint
│   ├── validators/
│   │   ├── auth.validator.js    # Blocks role field on register to prevent escalation
│   │   └── transaction.validator.js
│   ├── utils/
│   │   └── errors.js            # AppError class + asyncHandler wrapper
│   ├── app.js                   # Express app wired up (no listen — testable)
│   └── server.js                # Entry point: listen, startup guard, graceful shutdown
├── scripts/
│   └── seed.js                  # Creates 3 demo users + 60 transactions
├── tests/
│   ├── helpers.js               # In-memory DB + createUserAndLogin() util
│   ├── auth.test.js             # 12 tests
│   ├── transactions.test.js     # 17 tests
│   └── dashboard_users.test.js  # 12 tests
├── .env.example
├── jest.config.js
└── package.json
```

---

## Role Model and Access Control

Three roles in a strict hierarchy:

```
viewer < analyst < admin
```

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Register / Login | ✓ | ✓ | ✓ |
| View own profile | ✓ | ✓ | ✓ |
| View dashboard and analytics | ✓ | ✓ | ✓ |
| List / view transactions | ✗ | ✓ | ✓ |
| Create transaction | ✗ | ✗ | ✓ |
| Update transaction | ✗ | ✗ | ✓ |
| Delete transaction | ✗ | ✗ | ✓ |
| List / view users | ✗ | ✗ | ✓ |
| Change user role or status | ✗ | ✗ | ✓ |

**How it works in code:**

Access control is composable middleware (`requireViewer`, `requireAnalyst`, `requireAdmin`) declared directly on the route. The permission for every endpoint is visible in the route file without digging through controllers or services.

```js
// Any authenticated user can see the dashboard
router.use(authenticate, requireViewer);

// Only admins can create records
router.post('/', authenticate, requireAdmin, createRules, validate, createTransaction);
```

**Service-level guards** cover edge cases that can't be expressed as a role check alone — an admin cannot deactivate their own account or demote their own role, which would cause an irreversible lockout.

**Token re-validation:** The `authenticate` middleware re-fetches the user row from the database on every request. A deactivated account is blocked immediately — not when the JWT expires.

**Registration is always viewer-only:** The validator explicitly rejects any request that includes a `role` field. The service unconditionally hardcodes `'viewer'`. Both layers enforce this independently.

---

## API Reference

All responses use a consistent envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }
```

Protected endpoints require: `Authorization: Bearer <token>`

---

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create account (always viewer) |
| `POST` | `/api/auth/login` | Public | Get JWT token |
| `GET` | `/api/auth/me` | Any auth | Get own profile |

**Register body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "Secure1234" }
```
> Password requires 8+ characters, one uppercase letter, one number.  
> A `role` field returns `422` — privilege escalation at registration is blocked.

---

### Transactions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | Analyst+ | List with filters and pagination |
| `GET` | `/api/transactions/:id` | Analyst+ | Get single record |
| `POST` | `/api/transactions` | Admin | Create record |
| `PATCH` | `/api/transactions/:id` | Admin | Partial update |
| `DELETE` | `/api/transactions/:id` | Admin | Soft-delete |

**Query parameters for listing:**

| Param | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Per page (default: 20, max: 100) |
| `type` | string | `income` or `expense` |
| `category` | string | Any valid category slug |
| `dateFrom` | date | ISO 8601 lower bound |
| `dateTo` | date | ISO 8601 upper bound |
| `search` | string | Searches category and notes |
| `sortBy` | string | `date`, `amount`, `created_at`, `type`, `category` |
| `sortOrder` | string | `ASC` or `DESC` |

**Valid categories:**

Income: `salary` `freelance` `investment` `rental` `other_income`

Expense: `food` `housing` `transport` `utilities` `healthcare` `entertainment` `education` `shopping` `travel` `other_expense`

---

### Dashboard Analytics

Accessible to **all authenticated users**.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | All sections in one request |
| `GET` | `/api/dashboard/summary` | Total income, expenses, net balance, count |
| `GET` | `/api/dashboard/categories` | Per-category totals |
| `GET` | `/api/dashboard/trends/monthly` | Last 12 months — always 12 entries |
| `GET` | `/api/dashboard/trends/weekly` | Last 8 weeks — always 8 entries |
| `GET` | `/api/dashboard/recent` | Most recent N transactions (max 50) |
| `GET` | `/api/dashboard/top-spending` | Top N expense categories (max 20) |

> Both trend endpoints always return a **complete fixed-length series**. Periods with no transactions are included with zeroed values so charts render correctly.

---

### User Management *(admin only)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Paginated list, filter by `role` or `status` |
| `GET` | `/api/users/:id` | Get single user |
| `PATCH` | `/api/users/:id` | Update name, email, role, or password |
| `PATCH` | `/api/users/:id/status` | `{ "status": "inactive" }` to deactivate |

---

### Utility

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server status and timestamp |
