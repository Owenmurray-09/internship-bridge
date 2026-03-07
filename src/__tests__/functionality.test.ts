import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  studentProfileSchema,
  companyProfileSchema,
  internshipSchema,
  applicationSchema,
  messageSchema,
  schoolSchema,
  validateInput,
} from '@/lib/validation'

// =============================================================================
// VALIDATION SCHEMA TESTS — studentProfileSchema
// =============================================================================

describe('studentProfileSchema', () => {
  const currentYear = new Date().getFullYear()

  const validProfile = {
    email: 'student@example.com',
    graduationYear: currentYear + 2,
    birthYear: currentYear - 18,
  }

  it('accepts a valid student profile', () => {
    const result = studentProfileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('accepts profile with all optional fields', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      gender: 'non-binary',
      bio: 'I am a CS student passionate about web development.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const { email, ...noEmail } = validProfile
    const result = studentProfileSchema.safeParse(noEmail)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects graduation year in the past', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      graduationYear: currentYear - 1,
    })
    expect(result.success).toBe(false)
  })

  it('accepts current year as graduation year', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      graduationYear: currentYear,
    })
    expect(result.success).toBe(true)
  })

  it('rejects graduation year too far in the future', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      graduationYear: currentYear + 7,
    })
    expect(result.success).toBe(false)
  })

  it('rejects birth year for user under 13', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      birthYear: currentYear - 12,
    })
    expect(result.success).toBe(false)
  })

  it('accepts birth year for user exactly 13', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      birthYear: currentYear - 13,
    })
    expect(result.success).toBe(true)
  })

  it('rejects birth year too far in the past', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      birthYear: currentYear - 21,
    })
    expect(result.success).toBe(false)
  })

  it('rejects bio exceeding 500 characters', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      bio: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts bio at exactly 500 characters', () => {
    const result = studentProfileSchema.safeParse({
      ...validProfile,
      bio: 'a'.repeat(500),
    })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// VALIDATION SCHEMA TESTS — companyProfileSchema
// =============================================================================

describe('companyProfileSchema', () => {
  const validProfile = {
    companyName: 'Acme Corp',
  }

  it('accepts a minimal company profile', () => {
    const result = companyProfileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('accepts a full company profile', () => {
    const result = companyProfileSchema.safeParse({
      ...validProfile,
      industry: 'Technology',
      websiteUrl: 'https://acme.com',
      description: 'We build great things.',
      location: 'San José, Costa Rica',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty company name', () => {
    const result = companyProfileSchema.safeParse({ companyName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects company name exceeding 200 chars', () => {
    const result = companyProfileSchema.safeParse({
      companyName: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from company name', () => {
    const result = companyProfileSchema.safeParse({
      companyName: '  Acme Corp  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.companyName).toBe('Acme Corp')
    }
  })

  it('rejects invalid website URL', () => {
    const result = companyProfileSchema.safeParse({
      ...validProfile,
      websiteUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty website URL', () => {
    const result = companyProfileSchema.safeParse({
      ...validProfile,
      websiteUrl: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects description exceeding 2000 chars', () => {
    const result = companyProfileSchema.safeParse({
      ...validProfile,
      description: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects location exceeding 200 chars', () => {
    const result = companyProfileSchema.safeParse({
      ...validProfile,
      location: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// VALIDATION SCHEMA TESTS — internshipSchema
// =============================================================================

describe('internshipSchema', () => {
  const validInternship = {
    title: 'Software Engineering Intern',
    description: 'Work on real projects with our engineering team.',
    remoteAllowed: false,
  }

  it('accepts a valid minimal internship', () => {
    const result = internshipSchema.safeParse(validInternship)
    expect(result.success).toBe(true)
  })

  it('accepts a fully-populated internship', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      requirements: ['Python proficiency', 'GPA 3.0+'],
      responsibilities: ['Write code', 'Attend meetings'],
      skillsRequired: ['Python', 'React', 'SQL'],
      location: 'New York, NY',
      remoteAllowed: true,
      durationMonths: 3,
      maxApplications: 50,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const { title, ...noTitle } = validInternship
    const result = internshipSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title exceeding 200 chars', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      title: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from title', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      title: '  Software Intern  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Software Intern')
    }
  })

  it('rejects missing description', () => {
    const { description, ...noDesc } = validInternship
    const result = internshipSchema.safeParse(noDesc)
    expect(result.success).toBe(false)
  })

  it('rejects description exceeding 5000 chars', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      description: 'a'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects duration less than 1 month', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      durationMonths: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects duration exceeding 24 months', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      durationMonths: 25,
    })
    expect(result.success).toBe(false)
  })

  it('rejects too many requirements (>20)', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      requirements: Array.from({ length: 21 }, (_, i) => `Requirement ${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('rejects too many skills (>30)', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      skillsRequired: Array.from({ length: 31 }, (_, i) => `Skill${i}`),
    })
    expect(result.success).toBe(false)
  })

  it('rejects maxApplications less than 1', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      maxApplications: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects maxApplications exceeding 1000', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      maxApplications: 1001,
    })
    expect(result.success).toBe(false)
  })

  it('rejects location exceeding 200 chars', () => {
    const result = internshipSchema.safeParse({
      ...validInternship,
      location: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// VALIDATION SCHEMA TESTS — applicationSchema
// =============================================================================

describe('applicationSchema', () => {
  const validApplication = {
    internshipId: '550e8400-e29b-41d4-a716-446655440000',
    coverLetter: 'I am very interested in this internship opportunity because...',
  }

  it('accepts a valid application', () => {
    const result = applicationSchema.safeParse(validApplication)
    expect(result.success).toBe(true)
  })

  it('accepts application with resume URL', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      resumeUrl: 'https://example.com/resume.pdf',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty resume URL', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      resumeUrl: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid internship ID', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      internshipId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty cover letter', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      coverLetter: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects cover letter exceeding 3000 chars', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      coverLetter: 'a'.repeat(3001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid resume URL', () => {
    const result = applicationSchema.safeParse({
      ...validApplication,
      resumeUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// VALIDATION SCHEMA TESTS — messageSchema
// =============================================================================

describe('messageSchema', () => {
  const validMessage = {
    applicationId: '550e8400-e29b-41d4-a716-446655440000',
    recipientId: '660e8400-e29b-41d4-a716-446655440000',
    content: 'Hello, I have a question about the internship.',
  }

  it('accepts a valid message', () => {
    const result = messageSchema.safeParse(validMessage)
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = messageSchema.safeParse({
      ...validMessage,
      content: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects content exceeding 2000 chars', () => {
    const result = messageSchema.safeParse({
      ...validMessage,
      content: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid applicationId', () => {
    const result = messageSchema.safeParse({
      ...validMessage,
      applicationId: 'bad-id',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid recipientId', () => {
    const result = messageSchema.safeParse({
      ...validMessage,
      recipientId: 'bad-id',
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// validateInput HELPER TESTS
// =============================================================================

describe('validateInput helper', () => {
  it('returns success with parsed data for valid input', () => {
    const result = validateInput(loginSchema, {
      email: 'test@test.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@test.com')
    }
  })

  it('returns field-level errors for invalid input', () => {
    const result = validateInput(loginSchema, {
      email: '',
      password: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toHaveProperty('email')
      expect(result.errors).toHaveProperty('password')
    }
  })

  it('returns multiple error messages per field', () => {
    const result = validateInput(signupSchema, {
      email: '',
      password: '',
      fullName: '',
      role: 'student',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors['email'].length).toBeGreaterThanOrEqual(1)
    }
  })
})

// =============================================================================
// CROSS-SCHEMA INTEGRATION TESTS
// =============================================================================

describe('cross-schema validation consistency', () => {
  it('login schema is more permissive on password than signup', () => {
    // Login allows any password (just checks non-empty)
    const loginResult = loginSchema.safeParse({
      email: 'test@test.com',
      password: 'weak',
    })
    expect(loginResult.success).toBe(true)

    // Signup requires strong password
    const signupResult = signupSchema.safeParse({
      email: 'test@test.com',
      password: 'weak',
      fullName: 'Test User',
      role: 'student',
    })
    expect(signupResult.success).toBe(false)
  })

  it('signup only allows student and employer roles', () => {
    const allowedRoles = ['student', 'employer']
    const disallowedRoles = ['school_admin', 'global_admin', 'admin']

    for (const role of allowedRoles) {
      const result = signupSchema.safeParse({
        email: 'test@test.com',
        password: 'Password1!',
        fullName: 'Test User',
        role,
      })
      expect(result.success).toBe(true)
    }

    for (const role of disallowedRoles) {
      const result = signupSchema.safeParse({
        email: 'test@test.com',
        password: 'Password1!',
        fullName: 'Test User',
        role,
      })
      expect(result.success).toBe(false)
    }
  })

  it('password schema requires complexity', () => {
    const weakPasswords = [
      'short1!',         // too short
      'alllowercase1!',  // no uppercase
      'ALLUPPERCASE1!',  // no lowercase
      'NoNumbers!!',     // no digit
      'NoSpecial1a',     // no special char
    ]

    for (const password of weakPasswords) {
      const result = signupSchema.safeParse({
        email: 'test@test.com',
        password,
        fullName: 'Test User',
        role: 'student',
      })
      expect(result.success).toBe(false)
    }
  })

  it('name schema rejects special characters beyond hyphens and apostrophes', () => {
    const invalidNames = ['Test@User', 'Test#User', 'Test123', 'Test_User']

    for (const name of invalidNames) {
      const result = signupSchema.safeParse({
        email: 'test@test.com',
        password: 'Password1!',
        fullName: name,
        role: 'student',
      })
      expect(result.success).toBe(false)
    }
  })

  it('name schema accepts hyphens and apostrophes', () => {
    const validNames = ["O'Brien", 'Mary-Jane', "O'Brien-Smith"]

    for (const name of validNames) {
      const result = signupSchema.safeParse({
        email: 'test@test.com',
        password: 'Password1!',
        fullName: name,
        role: 'student',
      })
      expect(result.success).toBe(true)
    }
  })
})
