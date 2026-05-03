# AI-Powered Learning Planner (Production-style Full Stack)

This is a Next.js 16 (App Router) full-stack application designed to showcase production-ready engineering:

- Auth (Auth.js credentials)
- Secure, validated APIs (Route Handlers + Zod)
- Prisma data layer (PostgreSQL)
- Meaningful domain model (plans, plan items, study sessions, AI recommendations)
- Rate limiting on AI endpoint
- CI pipeline (lint + tests + build)

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Auth.js (NextAuth) + Credentials provider
- Zod validation
- Vitest for unit tests

## Local setup

1) Install deps

`npm install`

2) Create env file

Copy `.env.example` to `.env` and adjust:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY` (optional)

3) Run DB migrations (requires a running Postgres)

`npm run db:migrate`

4) Start dev server

`npm run dev`

## App routes

- `GET /signin`, `GET /signup`
- `GET /dashboard`
- `GET /plans/new`
- `GET /plans/[planId]`

## API routes (examples)

- Plans CRUD: `GET/POST /api/plans`, `GET/PATCH/DELETE /api/plans/[planId]`
- Items CRUD: `POST /api/plans/[planId]/items`, `PATCH/DELETE /api/items/[itemId]`
- Study sessions CRUD: `GET/POST /api/sessions`, `PATCH/DELETE /api/sessions/[sessionId]`
- AI: `POST /api/ai/recommendations` (rate-limited)

## Notes

- If `OPENAI_API_KEY` is not set, AI recommendations fall back to a safe deterministic default response.
- This repo uses server components where appropriate (dashboard/plan pages) and client components for interactive forms.

