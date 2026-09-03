# Mini Kanban Board — Full-Stack Engineering Challenge

A production-grade, collaborative **Mini Kanban Board** full-stack web application featuring user authentication, role-based board sharing and access control, and interactive drag-and-drop task movement with guaranteed transactional order consistency.

Built for the **Webbriks Full-Stack Engineer Technical Assessment**.

---

## Architecture & Tech Stack

```
                              ┌──────────────────────────────────┐
                              │      Next.js 15 (App Router)     │
                              │     React 19 + TypeScript        │
                              │ Tailwind CSS + @hello-pangea/dnd │
                              └────────────────┬─────────────────┘
                                               │ REST API (JWT Bearer)
                                               ▼
                              ┌──────────────────────────────────┐
                              │         NestJS Backend           │
                              │     TypeScript + Validation      │
                              │   JWT Guards & Access Control    │
                              │    Atomic Task Movement Engine   │
                              └────────────────┬─────────────────┘
                                               │ Prisma ORM
                                               ▼
                              ┌──────────────────────────────────┐
                              │      PostgreSQL 16 Database      │
                              │   Users, Boards, Members,        │
                              │       Columns, Tasks             │
                              └──────────────────────────────────┘
```

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, `@hello-pangea/dnd`, Lucide Icons, Axios.
- **Backend**: NestJS, TypeScript, Passport.js, JWT, bcryptjs, Class Validator & Transformer.
- **Database & ORM**: PostgreSQL with Prisma ORM.
- **DevOps**: Docker & Docker Compose orchestration.
- **Testing**: Jest unit & integration test suites.

---

## Core Features & Assessment Highlights

### 1. Authentication & Collaboration
- **Token-Based Authentication**: Secure JWT generation and verification with bcrypt salted password hashing (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
- **Board Sharing**: Owners can invite registered users to their boards by email with granular roles:
  - **`OWNER`**: Full control (edit settings, delete board, invite/remove members, manage columns & tasks).
  - **`EDITOR`**: Can add, update, reorder, move, and delete columns and tasks.
  - **`VIEWER`**: Read-only access to view boards, columns, and tasks; mutations and drag-and-drop are restricted.
- **Strict Access Control**: Enforces authorization guards to prevent unauthorized cross-board access. Non-collaborators receive `403 Forbidden` / `404 Not Found`.

### 2. Workflow Management & Task Movement API
- **Full CRUD Management**: Comprehensive endpoints for Boards, Columns, and Tasks. Creating a board automatically provisions default workflow columns (`To Do`, `In Progress`, `Done`).
- **Task Movement API (`PATCH /api/tasks/:id/move`)**:
  - Supports **reordering within the same column** and **moving across different columns** to an explicit position index.
  - **Conflict-Free Order Consistency**: Uses an atomic PostgreSQL transaction (`prisma.$transaction`) to re-index positions deterministically (`order: 0, 1, 2, ...`), preventing gaps, floating point precision loss, or race condition conflicts.
  - **Cross-Board Isolation**: Prevents tasks from ever being moved to columns of a different board.

### 3. Interactive Frontend
- **Drag-and-Drop Task Cards**: Fluid drag-and-drop powered by `@hello-pangea/dnd` with optimistic UI updates and instant feedback.
- **One-Click Demo Accounts**: Pre-configured login shortcuts for Alice (Owner), Bob (Editor), and Charlie (Viewer) for immediate evaluation.
- **Responsive & Modern Design**: Polished SaaS aesthetics with clean badges, modals, and indicators.

---

## Pre-Seeded Demo Accounts

The database comes pre-seeded with sample users and collaborative boards:

| Name | Email | Password | Role / Access Details |
| :--- | :--- | :--- | :--- |
| **Alice Johnson** | `alice@example.com` | `password123` | **Owner** of *Sprint 24 - Product Engineering* and *Q4 Strategic Roadmap* |
| **Bob Smith** | `bob@example.com` | `password123` | **Editor** on Alice's *Sprint 24*, and Owner of *Bob's Personal Tasks* |
| **Charlie Davis** | `charlie@example.com` | `password123` | **Viewer** on Alice's *Q4 Strategic Roadmap* (Read-Only) |

---

## Quick Start with Docker (Recommended)

To spin up the PostgreSQL database, NestJS Backend, and Next.js Frontend with a single command:

```bash
docker compose up --build
```

- **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000)
- **Backend API**: Accessible at [http://localhost:4000](http://localhost:4000)
- **PostgreSQL**: Running on port `5432`

---

## Manual Local Setup

### Prerequisites
- Node.js >= 18 (Node 20 or 22 recommended)
- PostgreSQL running locally (port 5432)

### 1. Database Setup
Create a PostgreSQL database named `kanban_db`:
```bash
createdb kanban_db
# or via psql:
# CREATE DATABASE kanban_db;
```

### 2. Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment variables (.env)
cp .env.example .env
# Verify your DATABASE_URL in .env:
# DATABASE_URL="postgresql://<user>:<password>@localhost:5432/kanban_db?schema=public"

# 3. Synchronize database schema and run seed script
npx prisma db push
npx ts-node prisma/seed.ts

# 4. Start backend development server
npm run start:dev
```
Backend will be live at `http://localhost:4000`.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables (.env.local)
cp .env.example .env.local

# 3. Start frontend development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Running Automated Tests

Run backend unit and integration test suites:
```bash
cd backend
npm test
```
All 15 automated test suites verify:
- User registration, duplicate validation, and bcrypt password verification.
- Task Movement API: intra-column reordering, cross-column moves, order indexing.
- Cross-board move prevention (`BadRequestException`).
- Access control validation (Owner, Editor, Viewer, Intruder rejection).

---

## API Reference Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user `{ name, email, password }`
- `POST /api/auth/login` — Sign in `{ email, password }` -> returns `{ accessToken, user }`
- `GET /api/auth/me` — Get authenticated user details

### Boards (`/api/boards`)
- `POST /api/boards` — Create board `{ title, description? }` (auto-creates default columns)
- `GET /api/boards` — List boards owned by or shared with current user
- `GET /api/boards/:id` — Get board details with columns, tasks, and member roles
- `PATCH /api/boards/:id` — Update board title/description
- `DELETE /api/boards/:id` — Delete board (Owner only)

### Board Collaboration (`/api/boards/:id/members`)
- `GET /api/boards/:id/members` — List collaborators and owner
- `POST /api/boards/:id/members` — Invite user by email `{ email, role: 'EDITOR' | 'VIEWER' }`
- `PATCH /api/boards/:id/members/:memberId` — Update collaborator role
- `DELETE /api/boards/:id/members/:memberId` — Remove collaborator

### Columns (`/api/columns`)
- `POST /api/columns` — Create column `{ boardId, title }`
- `PATCH /api/columns/:id` — Rename column `{ title }`
- `PATCH /api/columns/:id/reorder` — Change column order `{ order }`
- `DELETE /api/columns/:id` — Delete column and its tasks

### Tasks & Movement (`/api/tasks`)
- `POST /api/tasks` — Create task `{ columnId, title, description?, priority?, dueDate? }`
- `GET /api/tasks/:id` — Get task details
- `PATCH /api/tasks/:id` — Update task details
- `DELETE /api/tasks/:id` — Delete task
- `PATCH /api/tasks/:id/move` — **Task Movement API**
  - **Payload**: `{ targetColumnId: string, targetOrder: number }`
  - Reorders within current column or moves to target column at given index with transactional sequence compaction.

---

## Repository Structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database models (User, Board, BoardMember, Column, Task)
│   │   └── seed.ts             # Demo data seed script
│   ├── src/
│   │   ├── auth/               # JWT strategy, guards, DTOs, service, controller
│   │   ├── boards/             # Board management, access validation, sharing
│   │   ├── columns/            # Column CRUD and reordering
│   │   ├── tasks/              # Task CRUD and Task Movement API
│   │   ├── prisma/             # Global Prisma service
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/   # Login page with demo fast-fill
│   │   │   ├── (auth)/register/# User registration page
│   │   │   ├── boards/         # Boards workspace dashboard
│   │   │   ├── boards/[id]/    # Interactive drag-and-drop Kanban view
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx        # Landing page
│   │   ├── components/
│   │   │   ├── kanban/         # TaskCard, ColumnContainer, TaskModal, ShareModal
│   │   │   └── navbar.tsx      # Navigation header & profile
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios client with JWT interceptor
│   │   │   └── auth-context.tsx# Auth state provider
│   │   └── types/index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml          # Local container orchestration
└── README.md                   # Setup documentation
```
