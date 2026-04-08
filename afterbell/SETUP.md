# AfterBell — Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted, e.g. Supabase, Neon, Railway)

## 1. Install dependencies

```bash
cd afterbell
npm install
```

## 2. Configure environment

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/afterbell"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Set up the database

```bash
npm run db:push       # push schema to DB (no migration history)
# OR
npm run db:migrate    # create a named migration
```

## 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.
Register a new account, set your starting balance in Settings, and start logging trades.

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` — your hosted Postgres connection string
   - `NEXTAUTH_SECRET` — random 32-byte secret
   - `NEXTAUTH_URL` — your Vercel deployment URL
4. Deploy

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema changes to DB |
| `npm run db:migrate` | Create migration |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
