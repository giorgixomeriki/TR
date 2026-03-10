# ⚡ TaskFlow

A premium full-stack Task Manager built like a real SaaS product.

**Stack:** React + Vite · Node.js + Express · PostgreSQL · Prisma · JWT Auth

---

## Features

- 🔐 **JWT Authentication** — register, login, protected routes
- ✅ **Full Task CRUD** — create, read, update, toggle, delete
- 🎨 **Premium UI** — dark glassmorphism design with animations
- 🛡️ **Secure** — bcrypt password hashing, per-user data isolation
- 📱 **Responsive** — works on all screen sizes

---

## Project Structure

```
taskflow/
├── client/          # React + Vite frontend
└── server/          # Express + Prisma backend
    └── prisma/      # Database schema & migrations
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted — [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app))
- npm or yarn

---

## Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd taskflow

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

## Step 2 — Configure environment variables

### Server

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskflow?schema=public"
JWT_SECRET="your-super-secret-key-at-least-32-chars"
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

### Client

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
# Leave empty in development (Vite proxies /api/* to localhost:5000)
VITE_API_URL=
```

---

## Step 3 — Set up the database

Make sure PostgreSQL is running, then:

```bash
cd server

# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate
```

To inspect the database visually:
```bash
npm run db:studio
```

---

## Step 4 — Run the backend

```bash
cd server
npm run dev
```

Server starts at: `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## Step 5 — Run the frontend

```bash
cd client
npm run dev
```

Frontend starts at: `http://localhost:5173`

The Vite dev server proxies `/api/*` requests to `http://localhost:5000`, so no CORS issues in development.

---

## API Reference

### Auth

| Method | Endpoint              | Description        | Auth required |
|--------|-----------------------|--------------------|---------------|
| POST   | `/api/auth/register`  | Register new user  | No            |
| POST   | `/api/auth/login`     | Login user         | No            |
| GET    | `/api/auth/me`        | Get current user   | Yes           |

### Tasks

| Method | Endpoint                   | Description       | Auth required |
|--------|----------------------------|-------------------|---------------|
| GET    | `/api/tasks`               | Get all tasks     | Yes           |
| GET    | `/api/tasks/:id`           | Get single task   | Yes           |
| POST   | `/api/tasks`               | Create task       | Yes           |
| PUT    | `/api/tasks/:id`           | Update task       | Yes           |
| PATCH  | `/api/tasks/:id/toggle`    | Toggle completed  | Yes           |
| DELETE | `/api/tasks/:id`           | Delete task       | Yes           |

---

## Deploying to Production

### Backend → [Railway](https://railway.app) or [Render](https://render.com)

1. Push your code to GitHub
2. Create a new project on Railway/Render
3. Add a **PostgreSQL** plugin/addon
4. Set environment variables:
   ```
   DATABASE_URL=<provided by Railway/Render>
   JWT_SECRET=<random 64-char string>
   PORT=5000
   NODE_ENV=production
   CLIENT_URL=https://your-frontend.vercel.app
   ```
5. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy`
6. Set start command: `npm start`

### Frontend → [Vercel](https://vercel.com)

1. Import your GitHub repo on Vercel
2. Set **Root Directory** to `client`
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
4. Deploy — Vercel auto-detects Vite

---

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  tasks     Task[]
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  userId      String
  user        User     @relation(...)
}
```

---

## Environment Variables Reference

### `server/.env`

| Variable      | Description                          | Example                        |
|---------------|--------------------------------------|--------------------------------|
| `DATABASE_URL`| PostgreSQL connection string         | `postgresql://...`             |
| `JWT_SECRET`  | Secret for signing JWT tokens        | `my-super-secret-key`          |
| `PORT`        | Port the server listens on           | `5000`                         |
| `NODE_ENV`    | Environment mode                     | `development` / `production`   |
| `CLIENT_URL`  | Frontend URL for CORS                | `http://localhost:5173`        |

### `client/.env`

| Variable       | Description                          | Example                              |
|----------------|--------------------------------------|--------------------------------------|
| `VITE_API_URL` | Backend URL (empty = use Vite proxy) | `https://api.taskflow.com`           |

---

## Tech Stack Details

| Layer        | Technology              |
|--------------|-------------------------|
| Frontend     | React 18, Vite 5        |
| Routing      | React Router v6         |
| HTTP Client  | Axios                   |
| Backend      | Node.js, Express 4      |
| Database     | PostgreSQL               |
| ORM          | Prisma 5                |
| Auth         | JWT (jsonwebtoken)      |
| Passwords    | bcryptjs                |
| Styling      | Custom CSS + inline     |

---

Built with ❤️ — TaskFlow
