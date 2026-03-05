# InternshipBridge

A modern web application connecting talented students with amazing internship opportunities. Built as a responsive PWA for optimal mobile and desktop experience.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **PWA**: Native Next.js PWA implementation (custom service worker)

## Features

### For Students
- Browse internship opportunities
- Create and manage professional profiles
- Apply to internships with cover letters
- Track application status
- Communicate with employers

### For Employers
- Post internship opportunities
- Review student applications
- Manage company profiles
- Search and filter student profiles
- Communicate with applicants

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

#### Core Tables
- **`users`** - Extends Supabase auth.users with role-based access
  - Fields: id (UUID), email, role (enum), full_name, phone, timestamps
  - Roles: 'student', 'employer', 'admin'

- **`student_profiles`** - Extended profiles for students
  - Fields: university, major, graduation_year, gpa, resume_url, portfolio_url, github_url, linkedin_url, bio, skills[], location, availability dates
  - Links to: users.id

- **`company_profiles`** - Company information for employers
  - Fields: company_name, company_size, industry, website_url, logo_url, description, location, verified status
  - Links to: users.id

- **`internships`** - Internship postings
  - Fields: title, description, requirements[], responsibilities[], skills_required[], location, remote_allowed, duration, dates, stipend details, status (enum), max_applications
  - Status: 'draft', 'active', 'closed', 'cancelled'
  - Links to: company_profiles.id

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

#### RLS Policies Summary
- Users can only view/edit their own data
- Students can view active internships and create applications
- Employers can manage their internships and view applications
- Verified company profiles are publicly viewable
- Messages are restricted to application participants

### Schema Management

The database schema is managed through Supabase migrations located in:
- `supabase/migrations/20241201000000_initial_schema.sql`

To apply schema changes:
```bash
# Make changes to migration files
supabase db push
```

To view current schema:
```bash
# Generate types based on database
supabase gen types typescript --local > src/types/supabase.ts
```

## Authentication & Authorization

### Supabase Auth Integration
The app uses Supabase Auth with custom role-based access control:

#### User Roles
- **Students**: Can browse internships, create profiles, and apply
- **Employers**: Can post internships, review applications, and manage company profiles
- **Admin**: Full system access (for future features)

#### Authentication Flow
1. **Sign Up**: Users choose their role during registration
2. **Email Confirmation**: Supabase handles email verification
3. **Profile Creation**: Extended profile based on user role
4. **Role-based Access**: Middleware enforces route protection

#### Implementation Details
- **Middleware**: `src/middleware.ts` - Route protection and session management
- **Auth Pages**: `src/app/auth/` - Login, signup, and callback handlers
- **Client Setup**: `src/lib/supabase.ts` - Client-side Supabase configuration
- **Server Setup**: `src/lib/supabase-server.ts` - Server-side operations

#### Protected Routes
- `/dashboard` - Main user dashboard (role-specific)
- `/profile` - User profile management
- `/applications` - Application management
- `/internships/create` - Internship creation (employers only)

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

## Development

### Project Structure
```
src/
├── app/                 # Next.js 14 app directory
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # shadcn/ui components
│   └── LanguageToggle.tsx # Language switcher component
├── lib/                # Utilities and configurations
│   ├── i18n/           # Internationalization
│   │   ├── index.ts    # i18n context and hooks
│   │   └── messages/   # Translation files
│   │       ├── en.json # English translations
│   │       └── es.json # Spanish translations
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
```bash
# Project management
supabase projects list                    # List all projects
supabase projects create <name>           # Create new project
supabase link --project-ref <ref>         # Link to existing project

# Database operations
supabase db push                          # Apply migrations to remote
supabase db pull                          # Pull schema changes
supabase db reset                         # Reset database
supabase db diff                          # Show pending changes

# Authentication & API
supabase projects api-keys                # Get project API keys
supabase gen types typescript --local     # Generate TypeScript types

# Local development (requires Docker)
supabase start                           # Start local Supabase stack
supabase stop                            # Stop local Supabase stack
supabase status                          # Check local stack status
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
