# DeadlineFocus

A collaborative task management application for students built with Next.js, Supabase, and TypeScript.

## Features

- **Authentication**: Sign in with Google or Email/Password using Supabase Auth
- **Classroom Management**: Create classrooms with unique join codes
- **Collaborative Tasks**: Create and manage tasks that sync across all classroom members
- **Real-time Updates**: See task completions and progress in real-time
- **Deadline Enforcement**: 24-hour deletion restriction for tasks near deadlines
- **Social Proof**: Track which classmates have completed tasks
- **Push Notifications**: Get notified about approaching deadlines
- **Responsive Design**: Works on desktop and mobile with dark mode support

## Tech Stack

- **Frontend**: Next.js 16.2.1, React 19, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Language**: TypeScript
- **Notifications**: Web Push API

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase project:
   - Go to Authentication → Providers → Enable Google OAuth (optional)
   - Copy your Project URL and Anon Key

### 4. Set Up Database

1. In Supabase, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste and execute the SQL script
4. This will create all tables, RLS policies, functions, and triggers

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# VAPID Keys for Web Push
# Generate these with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your-email@example.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Generate VAPID Keys (for Push Notifications)

```bash
npm install -g web-push
npx web-push generate-vapid-keys
```

Copy the generated public and private keys to your `.env.local` file.

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── auth/              # Authentication pages and actions
│   ├── api/               # API routes
│   │   ├── classrooms/    # Classroom management
│   │   ├── tasks/         # Task management
│   │   ├── push/          # Push notifications
│   │   └── cron/          # Scheduled tasks
│   ├── classroom/[id]/    # Classroom detail page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/Dashboard
├── components/
│   ├── auth/              # Authentication components
│   ├── classroom/         # Classroom components
│   ├── dashboard/         # Dashboard components
│   ├── notification/      # Push notification components
│   └── task/              # Task components
├── hooks/
│   ├── useRealtimeTasks.ts
│   └── useRealtimeClassroom.ts
├── lib/
│   ├── supabase/          # Supabase client utilities
│   ├── utils/
│   │   └── deadline.ts    # Deadline utilities
│   └── notifications/
│       └── trigger.ts     # Notification triggers
├── public/
│   └── sw.js              # Service worker for push notifications
├── middleware.ts          # Next.js middleware
├── supabase-schema.sql   # Database schema
└── package.json
```

## Key Features Implementation

### 24-Hour Deadline Enforcement

The deadline restriction is enforced at three levels:

1. **Database Level**: RLS policy prevents deletion within 24 hours
2. **API Level**: DELETE endpoint validates before attempting deletion
3. **Client Level**: Delete button is disabled when deadline < 24 hours

### Real-time Synchronization

Using Supabase Realtime, tasks and completions sync instantly across all connected clients:

- `useRealtimeTasks` hook for task updates
- `useRealtimeClassroom` hook for member changes
- Automatic re-rendering on data changes

### Push Notifications

- Service worker handles incoming notifications
- Users can subscribe/unsubscribe to push notifications
- Scheduled cron jobs send deadline warnings

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

MIT
