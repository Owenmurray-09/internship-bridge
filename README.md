# InternshipBridge

A multi-tenant web application connecting high school students with internship opportunities. Each school gets its own branded experience. Built as a responsive PWA for optimal mobile and desktop experience.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **PWA**: Native Next.js PWA implementation (custom service worker)

## Features

### For Students
- Browse internship opportunities within your school
- Create and manage professional profiles
- Apply to internships with cover letters
- Track application status
- Communicate with employers

### For Employers
- Post free, unpaid internship opportunities (school-specific or global)
- Review student applications
- Manage company profiles
- Affiliate with a specific school or operate globally across all schools
- Search and filter student profiles (with school as a filter tag for global employers)
- Communicate with applicants

### For School Admins
- Manage students and employers within their school
- Configure school branding (logo, colors)
- View school-level statistics

### For Global Admins
- Manage all schools in the system
- Full system access across all schools and users
- System-wide statistics and oversight

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- Supabase account and CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd internship-bridge
```

2. Install dependencies:
```bash
npm install
```

3. Install Supabase CLI (if not already installed):
```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -fsSL https://cli.supabase.com/install.sh | bash
```

4. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
DATABASE_PASSWORD=your_database_password
```

5. Set up Supabase project:

**Option A: Use existing project (if you have one)**
- Link to your existing Supabase project:
```bash
supabase link --project-ref your-project-reference-id
```

**Option B: Create a new project via CLI**
```bash
# Login to Supabase
supabase login

# Create new project
supabase projects create your-project-name --org-id your-org-id --plan free --region us-east-1 --db-password "YourSecurePassword123!"

# Link the project
supabase link --project-ref your-new-project-ref
```

6. Apply database schema:
```bash
# Push the migration to your Supabase project
supabase db push
```

7. Get your project credentials:
```bash
# Get API keys
supabase projects api-keys --project-ref your-project-ref

# Update your .env.local file with the actual values
```

8. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Project Configuration

### Current Project Details
- **Project Name**: internship-bridge
- **Project Reference**: guaicbvtfvpduthaqxbf
- **Region**: East US (North Virginia)
- **Dashboard URL**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf

### Database Schema

The application uses the following main tables with Row Level Security (RLS) enabled:

#### Multi-Tenancy Tables
- **`schools`** - School entities for multi-tenant isolation
  - Fields: id (UUID), name, slug (unique), logo_url, primary_color, secondary_color, active, timestamps
  - Supports 10-100 schools

- **`school_memberships`** - Many-to-many relationship between users and schools
  - Fields: id (UUID), user_id, school_id, is_primary, timestamps
  - Unique constraint on (user_id, school_id)
  - Students belong to one or more schools; employers may affiliate with specific schools

#### Core Tables
- **`users`** - Extends Supabase auth.users with role-based access
  - Fields: id (UUID), email, role (enum), full_name, phone, preferred_school_id, timestamps
  - Roles: 'student', 'employer', 'school_admin', 'global_admin'

- **`student_profiles`** - Extended profiles for students
  - Fields: university, major, graduation_year, gpa, resume_url, portfolio_url, github_url, linkedin_url, bio, skills[], location, availability dates
  - Links to: users.id

- **`company_profiles`** - Company information for employers
  - Fields: company_name, company_size, industry, website_url, logo_url, description, location, verified status, is_global
  - Links to: users.id
  - `is_global`: when true, employer sees students across all schools

- **`internships`** - Internship postings (all internships are unpaid/volunteer)
  - Fields: title, description, requirements[], responsibilities[], skills_required[], location, remote_allowed, duration, dates, status (enum), max_applications, school_id
  - Status: 'draft', 'active', 'closed', 'cancelled'
  - Links to: company_profiles.id, schools.id (optional, NULL = visible to all schools)
  - Note: Stipend/compensation fields were intentionally removed — the platform only supports free, unpaid internships

- **`applications`** - Student applications to internships
  - Fields: cover_letter, resume_url, status (enum), applied_at, reviewed_at, notes
  - Status: 'pending', 'reviewed', 'accepted', 'rejected', 'withdrawn'
  - Links to: internships.id, student_profiles.id
  - Unique constraint on (internship_id, student_id)

- **`messages`** - Communication between students and employers
  - Fields: content, read_at, timestamps
  - Links to: applications.id, users.id (sender), users.id (recipient)

#### Database Features
- **Enums**: Custom types for user roles, application status, internship status
- **Triggers**: Automatic timestamp updates on row modifications
- **Indexes**: Optimized for common query patterns
- **Row Level Security**: Comprehensive policies ensuring data access control
- **Multi-tenancy**: School-based data isolation via RLS and application-layer filtering

#### RLS Policies Summary
- Users can only view/edit their own data
- Students can view active internships (global + their school's)
- Employers can manage their internships and view applications
- Global employers can view all student profiles; school-affiliated employers see their school's students
- School admins can manage users and data within their school
- Global admins have full access to all tables
- Verified company profiles are publicly viewable
- Messages are restricted to application participants

### Schema Management

The database schema is managed through **Supabase migrations** located in `supabase/migrations/`. This ensures database changes are version-controlled, reproducible, and safely deployable.

#### Current Migration Files
- `20241201000000_initial_schema.sql` - Complete initial database setup with tables, RLS policies, and triggers
- `20260305004345_add_preferred_locale_to_users.sql` - Adds `preferred_locale` field for i18n support
- `TIMESTAMP_add_multi_tenant_schools.sql` - Adds schools, school_memberships tables; expands user_role enum; adds school_id to internships; adds is_global to company_profiles; school-aware RLS policies

#### Migration Workflow

**1. Creating New Migrations**
```bash
# Create a new migration file with descriptive name
supabase migration new add_feature_name

# Edit the generated SQL file in supabase/migrations/
# Example: supabase/migrations/TIMESTAMP_add_feature_name.sql
```

**2. Testing Migrations (Recommended)**
```bash
# Test migration without applying (dry-run)
supabase db push --dry-run

# Review what would be changed before applying
```

**3. Applying Migrations**
```bash
# Apply migrations to remote database
supabase db push

# Confirm when prompted (or use -y to auto-accept)
```

**4. Update TypeScript Types**
```bash
# Generate updated types after successful migration
supabase gen types typescript --project-id guaicbvtfvpduthaqxbf > src/types/supabase.ts

# Or use the linked project (when properly configured)
supabase gen types typescript > src/types/supabase.ts
```

#### Migration Best Practices

**✅ DO:**
- Always test with `--dry-run` first
- Use descriptive migration names: `add_user_preferences`, `create_analytics_table`
- Include comments explaining complex changes
- Add CHECK constraints for data validation (like the locale field)
- Use reversible migrations when possible
- Update TypeScript types after each migration

**❌ DON'T:**
- Edit existing migration files after they've been applied
- Skip the dry-run step for production databases
- Use generic names like `update_schema` or `fix_database`
- Apply migrations without reviewing the changes first

#### Migration Examples

**Adding a new column:**
```sql
-- Migration: add_user_timezone.sql
ALTER TABLE public.users
ADD COLUMN timezone TEXT DEFAULT 'UTC';

COMMENT ON COLUMN public.users.timezone IS 'User timezone for displaying dates (IANA timezone identifier)';
```

**Creating a new table with RLS:**
```sql
-- Migration: create_notifications_table.sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
```

#### Local Development (Requires Docker)

For local development with full migration testing:

```bash
# Start local Supabase stack (requires Docker Desktop)
supabase start

# Apply migrations locally
supabase db reset  # Fresh start with all migrations

# Test migration changes locally first
supabase db push --local

# Stop local stack when done
supabase stop
```

#### Troubleshooting Migrations

**Common Issues:**

1. **Migration fails due to existing data**
   - Solution: Add data migration steps or use ALTER TABLE with default values

2. **RLS policy prevents access**
   - Solution: Review and update RLS policies to match new schema

3. **Type generation fails**
   - Solution: Ensure migrations are fully applied and database is accessible

4. **Docker not running (local development)**
   - Solution: Install Docker Desktop and start it before using `supabase start`

**Useful Commands:**
```bash
# Check migration status
supabase db diff --schema public

# View migration history
supabase migration list

# Reset to specific migration (LOCAL ONLY - DESTRUCTIVE)
supabase db reset --local

# Get database URL for manual inspection
supabase status --local  # Shows local URLs
supabase projects list   # Shows remote project info
```

## Authentication & Authorization

### Supabase Auth Integration
The app uses Supabase Auth with custom role-based access control:

#### User Roles
- **Students**: Belong to a school. Can browse internships, create profiles, and apply
- **Employers**: Can affiliate with a school or operate globally. Post internships, review applications, manage company profiles
- **School Admins**: Administer a specific school's users, settings, and branding
- **Global Admins**: Full system access across all schools

#### Authentication Flow
1. **Sign Up**: Users choose their role and school during registration
2. **Email Confirmation**: Supabase handles email verification
3. **School Context**: User's school is loaded into React context (like i18n locale)
4. **Profile Creation**: Extended profile based on user role
5. **Role-based Access**: Middleware enforces route protection

#### Multi-Tenancy Architecture
School context follows the same pattern as i18n -- **no dynamic URL routes** (no `/[school]/dashboard`):
- **React Context**: `SchoolProvider` + `useSchool()` hook, mirroring `I18nProvider` + `useI18n()`
- **Persistence**: `localStorage` + `preferred_school_id` in users table
- **Branding**: School logo and colors applied via CSS custom properties (`--school-primary`, `--school-secondary`)
- **School Picker**: Dropdown component (like `LanguageToggle`) for users with multiple schools
- **Data Filtering**: RLS policies + application-layer queries filter by current school context

#### Implementation Details
- **School Context**: `src/lib/school/index.tsx` - School context provider and hooks
- **School Picker**: `src/components/SchoolPicker.tsx` - School switcher component
- **Middleware**: `src/middleware.ts` - Route protection and session management
- **Auth Pages**: `src/app/auth/` - Login, signup, and callback handlers
- **Client Setup**: `src/lib/supabase.ts` - Client-side Supabase configuration
- **Server Setup**: `src/lib/supabase-server.ts` - Server-side operations

#### Protected Routes
- `/dashboard` - Main user dashboard (role-specific)
- `/profile` - User profile management
- `/applications` - Application management
- `/internships/create` - Internship creation (employers only)
- `/admin` - School admin pages (school_admin and global_admin only)
- `/global-admin` - Global admin pages (global_admin only)

#### Session Management
- Sessions persist across browser sessions
- Automatic token refresh
- Secure cookie-based storage
- Server-side session validation

## PWA Implementation

### Architecture Decision

**We intentionally chose NOT to use `next-pwa` package** and instead implemented a **custom, secure PWA solution** for the following reasons:

#### Why We Avoided next-pwa
- **Security vulnerabilities**: The `next-pwa` package had multiple high-severity vulnerabilities (serialize-javascript RCE)
- **Maintenance issues**: The package was not actively maintained and had dependency conflicts
- **Bloated dependencies**: Brought in unnecessary webpack plugins and outdated libraries

#### Our Custom Implementation
Instead, we use **native Next.js capabilities** with a custom service worker approach:

**Files:**
- `public/sw.js` - Custom service worker for caching and offline functionality
- `public/manifest.json` - PWA manifest for installation prompts
- `src/components/PWAInstaller.tsx` - Service worker registration component
- `next.config.ts` - Security headers and PWA configuration

**Features:**
- ✅ **Offline functionality** - Smart caching with fallback strategies
- ✅ **Install prompts** - Native browser install prompts on mobile/desktop
- ✅ **App-like experience** - Fullscreen mode, splash screen, app icons
- ✅ **Security-first** - No vulnerable dependencies, strict CSP headers
- ✅ **Responsive design** - Optimized for all device sizes
- 🔄 **Push notifications** - Ready for implementation when needed

### For Future PWA Enhancements

When adding new PWA features, refer to the **official Next.js PWA documentation**:
https://nextjs.org/docs/app/guides/progressive-web-apps

This ensures we stay aligned with Next.js best practices and avoid introducing security vulnerabilities through third-party packages.

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_ACCESS_TOKEN` | Personal access token for Supabase CLI |

## Internationalization (i18n)

### Language Support
This application supports both **English** and **Spanish** languages with easy switching.

### Implementation Details
- **Architecture**: Simple static JSON translations with React Context
- **No URL routing**: Language preference stored in localStorage + database
- **Libraries**: Custom lightweight hooks (no external i18n libraries)
- **Translation files**: `src/lib/i18n/messages/en.json` and `es.json`

### Developer Guidelines

**IMPORTANT**: When adding new features, you MUST create translations for both languages:

#### ✅ Correct Approach
```tsx
// 1. Add to both translation files
// en.json
{
  "dashboard": {
    "welcome": "Welcome back",
    "newFeature": "My new feature"
  }
}

// es.json
{
  "dashboard": {
    "welcome": "Bienvenido de nuevo",
    "newFeature": "Mi nueva característica"
  }
}

// 2. Use in components
const { t } = useTranslations('dashboard')
return <h1>{t('welcome')}</h1>
```

#### ❌ Wrong Approach
```tsx
// DON'T hardcode strings
return <h1>Welcome back</h1>

// DON'T add only English
return <h1>{t('welcome')}</h1> // without Spanish translation
```

#### Translation Key Conventions
- Use **nested keys**: `auth.login.title` not `authLoginTitle`
- Use **descriptive names**: `passwordHint` not `hint1`
- **Organize by feature**: `dashboard.*`, `auth.*`, `validation.*`
- **Common words**: Use `common.*` for reused terms like "Save", "Cancel"

#### Using Translations
```tsx
// Basic usage
const { t } = useTranslations('auth.login')
return <button>{t('submit')}</button>

// With parameters
const { t } = useTranslations('dashboard')
return <p>{t('welcome', { name: user.name })}</p> // "Welcome back, {{name}}"

// Multiple namespaces
const { t } = useTranslations('auth.login')
const { t: tCommon } = useTranslations('common')
const { t: tErrors } = useTranslations('errors')
```

#### Adding New Translation Keys
1. Add key to **both** `en.json` and `es.json`
2. Use **human-friendly** Spanish (get help if needed)
3. Test language switching works
4. Include translations in same PR as feature

### Language Toggle
The language toggle follows standard web design patterns and is placed in intuitive locations:

**Locations & Variants:**
- **Landing page**: Compact toggle in header navigation (top-right)
- **Auth pages**: Compact toggle in header navigation
- **Dashboard**: Full toggle in user menu/settings area
- **Mobile**: Responsive design adapts to smaller screens

**Design Patterns:**
- **Compact variant**: `EN/ES` with language icon for headers
- **Full variant**: `English/Español` with globe icon for prominent areas
- **Dropdown style**: Shows both languages with current selection highlighted

**Implementation:**
```tsx
// Compact for headers
<LanguageToggle variant="compact" />

// Full for prominence
<LanguageToggle variant="full" showLabel={true} />
```

Language preference is automatically saved to localStorage and will persist to user database profile when implemented.

## Test Accounts

For development and testing:

| Role | Email | Password |
|------|-------|----------|
| Employer | `employer@mail.com` | `1234Test!` |
| Student | `student@mail.com` | `1234Test!` |

## Development

### Project Structure
```
src/
├── app/                 # Next.js 14 app directory
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard (role-specific)
│   ├── admin/          # School admin pages
│   ├── global-admin/   # Global admin pages
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── LanguageToggle.tsx # Language switcher component
│   └── SchoolPicker.tsx   # School context switcher
├── lib/                # Utilities and configurations
│   ├── i18n/           # Internationalization
│   │   ├── index.ts    # i18n context and hooks
│   │   └── messages/   # Translation files
│   │       ├── en.json # English translations
│   │       └── es.json # Spanish translations
│   ├── school/         # Multi-tenancy
│   │   └── index.tsx   # School context provider and hooks
│   ├── supabase.ts     # Supabase client setup
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Supabase CLI Commands

**Project Management:**
```bash
supabase projects list                              # List all projects
supabase projects create <name>                     # Create new project
supabase link --project-ref guaicbvtfvpduthaqxbf    # Link to internship-bridge project
```

**Migration & Schema Operations:**
```bash
# Migration workflow (RECOMMENDED ORDER)
supabase migration new <descriptive_name>          # Create new migration
supabase db push --dry-run                         # Test migration (no changes)
supabase db push                                   # Apply migration to remote
supabase gen types typescript --project-id guaicbvtfvpduthaqxbf > src/types/supabase.ts  # Update types

# Alternative type generation (when linked properly)
supabase gen types typescript > src/types/supabase.ts

# Schema inspection
supabase db diff --schema public                   # Show pending schema changes
supabase migration list                            # View migration history
```

**Local Development (Docker Required):**
```bash
supabase start                            # Start local Supabase stack
supabase db reset --local                 # Fresh start with all migrations
supabase db push --local                  # Apply migrations locally only
supabase status --local                   # Check local stack status
supabase stop                            # Stop local stack
```

**API & Authentication:**
```bash
supabase projects api-keys --project-ref guaicbvtfvpduthaqxbf  # Get project API keys
```

**CLI Maintenance:**
```bash
# Recommended: Update CLI regularly for latest features
brew upgrade supabase                     # macOS
scoop update supabase                     # Windows
# Or follow instructions in CLI output
```

### Useful Supabase Dashboard Links
- **Tables**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf/editor
- **Authentication**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf/auth/users
- **Storage**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf/storage/buckets
- **API Docs**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf/api/docs
- **Logs**: https://supabase.com/dashboard/project/guaicbvtfvpduthaqxbf/logs/explorer

### Troubleshooting

#### Common Issues
1. **Environment Variables**: Ensure all required variables are set in `.env.local`
2. **Database Connection**: Verify project reference and API keys
3. **RLS Policies**: Check that Row Level Security policies allow your operations
4. **Migration Errors**: Use `supabase db reset` to start fresh if needed

#### Debug Commands
```bash
# Check Supabase connection
supabase projects list

# Verify environment
cat .env.local

# Check database schema
supabase db diff

# View RLS policies
# Visit Supabase dashboard > Authentication > Policies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
