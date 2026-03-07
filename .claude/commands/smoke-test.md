Run a smoke test of the InternshipBridge application using Chrome DevTools MCP.

## Setup

1. Check if the dev server is running on port 3000. If not, run `npm run dev` in the background.
2. Wait for the server to be ready.
3. Open Chrome via `mcp__chrome-devtools__new_page` to `http://localhost:3000`.

## Test Procedure

Read the README.md "Features" section to understand the current feature set. Then test each area below. For each page: navigate to it, take a snapshot, verify key elements are present, and report any issues.

### 1. Landing Page (unauthenticated)
- Navigate to `/`
- Verify: hero section, Sign In/Get Started buttons, feature cards, footer
- Verify: language toggle present and functional (switch EN/ES, check text changes)

### 2. Auth Flow
- Navigate to `/auth/login`
- Verify: email and password fields, sign in button, sign up link
- Sign in with test employer account: `employer@mail.com` / `1234Test!`
- Verify: redirects to `/dashboard`

### 3. Employer Dashboard
- Verify: welcome message shows user name, role-specific cards (Post Internship, My Internships, Review Applications, Company Profile), Quick Stats section
- Open hamburger menu, verify all employer nav links present

### 4. Employer Pages (navigate to each, verify loads correctly)
- `/internships/create` — form fields: title, description, location, remote checkbox, deadline, Save Draft/Publish buttons
- `/internships/manage` — filter tabs (All/Draft/Active/Closed/Cancelled), internship list with status badges and action buttons
- `/applications/review` — filter tabs, application cards with student info, status actions (accept/reject/review)
- `/profile/company` — form with company name, industry, location, website, size, description

### 5. Browse & Detail
- `/internships` — search bar, internship cards with company info
- Click an internship to view detail page — verify title, description, company info, back link

### 6. Sign Out & Student Flow
- Sign out via nav button
- Verify redirect to landing page
- Sign in as student: `student@mail.com` / `1234Test!`
- Verify student dashboard shows student-specific cards (Browse Internships, My Applications, My Profile)
- Check hamburger menu has student nav links
- Visit `/profile` — verify student profile form
- Visit `/internships` — verify browse page loads
- Visit `/applications` — verify applications page (may redirect to profile if no student_profile exists)

### 7. Auth Guards
- Sign out
- Try navigating to `/dashboard` — verify redirect to `/auth/login`
- Try navigating to `/admin/students` — verify redirect to `/auth/login`

## Reporting

After testing, provide a summary:
- **PASS**: Pages that loaded and functioned correctly
- **FAIL**: Pages with errors, missing elements, or broken interactions
- **NOTES**: Any unexpected behavior or UI issues observed

Do NOT modify any code or data during smoke testing. This is observation-only.
