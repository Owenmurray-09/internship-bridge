Run a full regression test of InternshipBridge using Chrome DevTools MCP. This is more exhaustive than a smoke test — it exercises form submissions, validation, state changes, and error handling.

## Setup

1. Check if the dev server is running on port 3000. If not, run `npm run dev` in the background.
2. Wait for the server to be ready.
3. Open Chrome via `mcp__chrome-devtools__new_page` to `http://localhost:3000`.

## Pre-Test

Read the README.md "Features" section for the current feature set. Read `src/lib/validation.ts` for current validation rules. The tests below should cover all features documented in the README.

## Test Procedure

### Phase 1: Unauthenticated Experience

**Landing Page**
- Navigate to `/`, verify all sections render
- Test language toggle: switch to ES, verify text changes, switch back to EN
- Click "Sign In" — verify navigation to `/auth/login`
- Go back, click "Get Started" — verify navigation to `/auth/signup`

**Auth Guards**
- Navigate to each protected route while logged out and verify redirect to `/auth/login`:
  - `/dashboard`, `/profile`, `/applications`, `/internships/create`, `/internships/manage`
- Navigate to `/admin/students` — verify redirect
- Navigate to `/global-admin/schools` — verify redirect

**Login Validation**
- Navigate to `/auth/login`
- Submit with empty fields — verify validation errors appear
- Submit with invalid email format — verify error
- Submit with wrong credentials — verify error message from Supabase

**Signup Validation**
- Navigate to `/auth/signup`
- Submit with empty fields — verify validation errors
- Submit with weak password (e.g., "weak") — verify password strength error
- Submit with invalid email — verify error
- Verify role dropdown has Student and Employer options (no admin roles)
- Verify school dropdown loads schools from database

### Phase 2: Employer Flow

**Login**
- Sign in as `employer@mail.com` / `1234Test!`
- Verify redirect to `/dashboard`
- Verify welcome message and employer-specific dashboard cards

**Company Profile**
- Navigate to `/profile/company`
- Clear company name and submit — verify required field error
- Enter invalid website URL and submit — verify URL validation error
- Restore valid data, submit — verify success (redirects to dashboard)

**Create Internship**
- Navigate to `/internships/create`
- Submit with empty fields — verify title and description required errors
- Fill in valid data (title, description, location)
- Click "Save Draft" — verify redirect to `/internships/manage`
- Verify the new draft appears in the list with "Draft" badge

**Manage Internships**
- Navigate to `/internships/manage`
- Test filter tabs: click each (All, Draft, Active, Closed, Cancelled) and verify list filters
- For a draft internship: click "Publish" — verify status changes to Active
- For an active internship: click "Close" — verify status changes to Closed
- For a closed internship: click "Move to Draft" — verify status changes to Draft
- Test delete flow on a draft: click Delete, verify confirmation appears, click Cancel, verify no deletion

**Review Applications**
- Navigate to `/applications/review`
- Test filter tabs work
- If applications exist: expand cover letter, test accept/reject/review status changes
- If no applications: verify empty state message

**Browse Internships**
- Navigate to `/internships`
- Verify active internships appear with company info
- Test search: type a search term, verify filtering works
- Clear search, verify all results return
- Click an internship card — verify detail page loads

**Internship Detail**
- Verify all sections: title, company, description, requirements (if any), company info
- Verify "Back to internships" link works
- As employer, verify no "Apply" button shown

### Phase 3: Student Flow

**Switch User**
- Sign out
- Sign in as `student@mail.com` / `1234Test!`

**Student Dashboard**
- Verify student-specific cards: Browse Internships, My Applications, My Profile
- Open hamburger menu — verify student nav links

**Student Profile**
- Navigate to `/profile`
- If creating: submit with missing required fields, verify errors
- Fill in valid data (email, graduation year, birth year)
- Submit and verify redirect to dashboard

**Browse & Apply**
- Navigate to `/internships` — verify internship cards
- Click an internship — verify detail page with "Apply Now" button (if student profile exists)
- Click "Apply Now" — verify application form with cover letter field
- Submit with empty cover letter — verify required error
- Submit with valid cover letter — verify success message

**Track Applications**
- Navigate to `/applications`
- Verify application list shows submitted application
- Test filter tabs
- Test withdraw flow: click Withdraw, verify confirmation, cancel

### Phase 4: Cross-Cutting Concerns

**Language Toggle**
- On any authenticated page, switch language to ES
- Verify page text changes to Spanish
- Switch back to EN, verify English restored

**Navigation**
- Test hamburger menu opens/closes
- Test all nav links navigate to correct pages
- Test "InternshipBridge" logo link returns to dashboard

**Responsive Behavior** (if possible)
- Resize page to mobile width (375px)
- Verify nav collapses, content stacks vertically

## Reporting

Provide a detailed report:

### Summary Table
| Area | Status | Notes |
|------|--------|-------|
| Landing Page | PASS/FAIL | |
| Auth Guards | PASS/FAIL | |
| Login | PASS/FAIL | |
| Signup | PASS/FAIL | |
| Employer Dashboard | PASS/FAIL | |
| Company Profile | PASS/FAIL | |
| Create Internship | PASS/FAIL | |
| Manage Internships | PASS/FAIL | |
| Review Applications | PASS/FAIL | |
| Browse Internships | PASS/FAIL | |
| Internship Detail | PASS/FAIL | |
| Student Dashboard | PASS/FAIL | |
| Student Profile | PASS/FAIL | |
| Apply to Internship | PASS/FAIL | |
| Student Applications | PASS/FAIL | |
| Language Toggle | PASS/FAIL | |
| Navigation | PASS/FAIL | |

### Issues Found
List any bugs, UI problems, or unexpected behavior with:
- Page/route where it occurred
- Steps to reproduce
- Expected vs actual behavior

### Data Created
List any test data created during the regression test (draft internships, applications, etc.) so the user can clean up if desired.

**IMPORTANT**: The regression test DOES create test data (draft internships, applications). Warn the user about this before starting. Avoid deleting existing real data.
