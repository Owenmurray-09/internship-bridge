import { describe, it, expect } from 'vitest'
import { signupSchema, schoolSchema, loginSchema } from '@/lib/validation'

describe('signupSchema', () => {
  const validBase = {
    email: 'test@example.com',
    password: 'Password1!',
    fullName: 'Test User',
    role: 'student' as const,
  }

  it('accepts valid student signup', () => {
    const result = signupSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('accepts valid employer signup', () => {
    const result = signupSchema.safeParse({ ...validBase, role: 'employer' })
    expect(result.success).toBe(true)
  })

  it('rejects school_admin as signup role', () => {
    const result = signupSchema.safeParse({ ...validBase, role: 'school_admin' })
    expect(result.success).toBe(false)
  })

  it('rejects global_admin as signup role', () => {
    const result = signupSchema.safeParse({ ...validBase, role: 'global_admin' })
    expect(result.success).toBe(false)
  })

  it('rejects legacy admin as signup role', () => {
    const result = signupSchema.safeParse({ ...validBase, role: 'admin' })
    expect(result.success).toBe(false)
  })

  it('accepts signup with a valid schoolId', () => {
    const result = signupSchema.safeParse({
      ...validBase,
      schoolId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('accepts signup with empty schoolId (global employer)', () => {
    const result = signupSchema.safeParse({
      ...validBase,
      role: 'employer',
      schoolId: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts signup without schoolId field', () => {
    const result = signupSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('rejects invalid schoolId format', () => {
    const result = signupSchema.safeParse({
      ...validBase,
      schoolId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak password', () => {
    const result = signupSchema.safeParse({ ...validBase, password: 'weak' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = signupSchema.safeParse({ ...validBase, email: 'not-email' })
    expect(result.success).toBe(false)
  })

  it('rejects empty fullName', () => {
    const result = signupSchema.safeParse({ ...validBase, fullName: '' })
    expect(result.success).toBe(false)
  })
})

describe('schoolSchema', () => {
  const validSchool = {
    name: 'Lincoln High School',
    slug: 'lincoln-high',
  }

  it('accepts valid school with defaults', () => {
    const result = schoolSchema.safeParse(validSchool)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.primaryColor).toBe('#2563eb')
      expect(result.data.secondaryColor).toBe('#1e40af')
    }
  })

  it('accepts valid school with custom colors', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
    })
    expect(result.success).toBe(true)
  })

  it('rejects slug with uppercase', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: 'Lincoln-High' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: 'lincoln high' })
    expect(result.success).toBe(false)
  })

  it('rejects slug starting with hyphen', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: '-lincoln' })
    expect(result.success).toBe(false)
  })

  it('rejects slug ending with hyphen', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: 'lincoln-' })
    expect(result.success).toBe(false)
  })

  it('accepts slug with numbers', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: 'school-42' })
    expect(result.success).toBe(true)
  })

  it('rejects too-short slug', () => {
    const result = schoolSchema.safeParse({ ...validSchool, slug: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hex color', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      primaryColor: 'red',
    })
    expect(result.success).toBe(false)
  })

  it('rejects 3-digit hex color', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      primaryColor: '#f00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty school name', () => {
    const result = schoolSchema.safeParse({ ...validSchool, name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts optional logoUrl', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      logoUrl: 'https://example.com/logo.png',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty logoUrl', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      logoUrl: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid logoUrl', () => {
    const result = schoolSchema.safeParse({
      ...validSchool,
      logoUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})
