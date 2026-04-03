# Mathe-Matise — Learning Made Easier

A full-stack Learning Management System (LMS) for a South African tutoring company, targeting **Grades 8–12** in **Mathematics** and **Physical Sciences**, aligned to the **CAPS curriculum**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | Radix UI primitives + custom shadcn-style library |
| Backend | Next.js API Routes (TypeScript) |
| Database | PostgreSQL on **Supabase** via Prisma ORM |
| Auth | NextAuth.js v4 (JWT sessions, role-based) |
| File Uploads | Cloudinary |
| Email | Resend |
| Charts | Recharts |
| Deployment | Vercel (frontend) · Docker (containerised) |

---

## Portals & Roles

| Role | Portal | Access |
|---|---|---|
| `ADMIN` | `/admin` | User management, analytics, content approval, system health, announcements |
| `TUTOR` | `/tutor` | Upload materials, create assessments, grade submissions, calendar, messages |
| `LEARNER` | `/learner` | View materials, attempt tests, track scores, calendar, messages |

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)
- A [Resend](https://resend.com) account (for email — optional for dev)

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Mathe-Matise
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# Supabase — get these from: Project Settings → Database → Connection string
# Use the "Transaction" pooler URL for DATABASE_URL (port 6543)
# Use the "Direct connection" URL for DIRECT_URL (port 5432)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# NextAuth — generate a secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-random-secret"

# Cloudinary — from cloudinary.com dashboard
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"

# Resend — from resend.com dashboard
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
# Push the schema to Supabase
npm run db:push

# Seed with CAPS curriculum, sample users and assessments
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default Seed Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@mathe-matise.co.za` | `Password@123` |
| Tutor (Maths) | `thabo.nkosi@mathe-matise.co.za` | `Password@123` |
| Tutor (Science) | `lerato.dlamini@mathe-matise.co.za` | `Password@123` |
| Learner (Gr 8) | `sipho.mokoena@learner.mathe-matise.co.za` | `Password@123` |
| Learner (Gr 9) | `ayanda.zulu@learner.mathe-matise.co.za` | `Password@123` |
| Learner (Gr 10) | `nomvula.khumalo@learner.mathe-matise.co.za` | `Password@123` |
| Learner (Gr 11) | `bongani.sithole@learner.mathe-matise.co.za` | `Password@123` |
| Learner (Gr 12) | `zanele.mthembu@learner.mathe-matise.co.za` | `Password@123` |

> **Change all passwords before production use.**

---

## npm Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run db:push      # Push Prisma schema to database (no migration files)
npm run db:migrate   # Create and apply a named migration
npm run db:seed      # Seed the database with CAPS curriculum + sample data
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:generate  # Regenerate Prisma client after schema changes
```

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin portal pages
│   ├── tutor/          # Tutor portal pages
│   ├── learner/        # Learner portal pages
│   ├── api/            # API route handlers
│   ├── login/          # Login page
│   └── layout.tsx      # Root layout + providers
├── components/
│   ├── ui/             # Primitive UI components (Button, Card, etc.)
│   ├── shared/         # Shared business components (StatCard, DataTable, CalendarView, Messaging)
│   ├── admin/          # Admin-specific components
│   ├── tutor/          # Tutor-specific components
│   ├── learner/        # Learner-specific components
│   └── layout/         # Sidebar, PageHeader
├── lib/
│   ├── prisma.ts       # Prisma client singleton
│   ├── auth.ts         # NextAuth configuration
│   ├── api-helpers.ts  # Auth guards, error handling, pagination
│   └── utils.ts        # cn(), formatDate(), etc.
├── types/
│   ├── index.ts        # Shared TypeScript types
│   └── next-auth.d.ts  # NextAuth type augmentations
├── middleware.ts        # Role-based route protection
prisma/
├── schema.prisma       # Full database schema
└── seed.ts             # CAPS curriculum + sample data seed
```

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env` in the Vercel dashboard.
4. Deploy — Vercel auto-detects Next.js.

> `NEXTAUTH_URL` must be set to your Vercel production URL (e.g. `https://mathe-matise.vercel.app`).

---

## Deploying with Docker

### Build and run locally

```bash
# Copy and fill in your .env
cp .env.example .env

# Build the image
docker build -t mathe-matise .

# Run with docker-compose (app + local Postgres)
docker-compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production (Supabase DB + Docker app)

If using Supabase as the database, you only need to run the app container:

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  mathe-matise
```

---

## Database Schema Overview

```
User            → roles: ADMIN | TUTOR | LEARNER
Grade           → Grade 8–12
Subject         → Mathematics | Physical Sciences (per grade)
CapsTopic       → CAPS topics per subject per term (seeded)
Enrollment      → links learners to subjects
TutorAssignment → links tutors to grade+subject
LearningMaterial→ PDFs / videos / documents
Assessment      → Quizzes and Tests
Question        → MCQ / SHORT / LONG (with auto-grading for MCQ)
Submission      → learner answers + score + feedback
CalendarEvent   → CLASS | TEST | APPOINTMENT
EventAttendee   → many-to-many for events
Message         → direct messages between users
Notification    → in-app notifications
Announcement    → system-wide messages (role/grade targeted)
SystemLog       → admin audit trail
AcademicYear    → current year configuration
```

---

## CAPS Curriculum

The database is seeded with the full CAPS topic structure for both subjects across all grades (8–12), covering Terms 1–4. Topics are tagged to learning materials and assessments, ensuring learners only see content relevant to their enrolled grade and subject.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooler URL (port 6543) |
| `DIRECT_URL` | ✅ | Supabase direct URL (port 5432, for migrations) |
| `NEXTAUTH_URL` | ✅ | App base URL |
| `NEXTAUTH_SECRET` | ✅ | Random 32-char secret for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | Client-side cloud name |
| `RESEND_API_KEY` | ⚠️ Optional | Email service key (Resend) |
| `EMAIL_FROM` | ⚠️ Optional | Sender email address |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL |

---

## License

Private — Mathe-Matise Tutoring Services. All rights reserved.
