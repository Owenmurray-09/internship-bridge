import { z } from 'zod'
import type { UserRole } from '@/types/database'

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email too long')

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
  )

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform((val) => val.trim())

// User role validation
const userRoleSchema = z.enum(['student', 'employer', 'school_admin', 'global_admin'] as const)

// Signup-specific role (only student and employer can self-register)
const signupRoleSchema = z.enum(['student', 'employer'] as const)

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: signupRoleSchema,
  schoolId: z.string().uuid('Invalid school').optional().or(z.literal('')),
})

// School validation schema
export const schoolSchema = z.object({
  name: z.string().min(1, 'School name is required').max(200, 'School name too long'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must be lowercase alphanumeric with hyphens'),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').default('#2563eb'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').default('#1e40af'),
})

// Profile schemas
export const studentProfileSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(254, 'Email too long'),
  graduationYear: z
    .number()
    .int()
    .min(new Date().getFullYear(), 'Graduation year must be current or future')
    .max(new Date().getFullYear() + 6, 'Graduation year too far in the future'),
  gender: z
    .string()
    .max(50, 'Gender too long')
    .optional(),
  birthYear: z
    .number()
    .int()
    .min(new Date().getFullYear() - 20, 'Birth year too far in the past')
    .max(new Date().getFullYear() - 13, 'Must be at least 13 years old'),
  bio: z
    .string()
    .max(500, 'Bio too long')
    .optional(),
})

export const companyProfileSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name too long')
    .transform((val) => val.trim()),
  industry: z
    .string()
    .max(100, 'Industry too long')
    .optional(),
  websiteUrl: z
    .string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  logoUrl: z
    .string()
    .url('Invalid logo URL')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(2000, 'Description too long')
    .optional(),
  location: z
    .string()
    .max(200, 'Location too long')
    .optional(),
})

// Internship schemas
export const internshipSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform((val) => val.trim()),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long'),
  requirements: z
    .array(z.string().min(1).max(500))
    .max(20, 'Too many requirements')
    .optional(),
  responsibilities: z
    .array(z.string().min(1).max(500))
    .max(20, 'Too many responsibilities')
    .optional(),
  skillsRequired: z
    .array(z.string().min(1).max(50))
    .max(30, 'Too many required skills')
    .optional(),
  location: z
    .string()
    .max(200, 'Location too long')
    .optional(),
  remoteAllowed: z.boolean(),
  durationMonths: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 month')
    .max(24, 'Duration cannot exceed 24 months')
    .optional(),
  startDate: z
    .string()
    .datetime()
    .optional(),
  endDate: z
    .string()
    .datetime()
    .optional(),
  maxApplications: z
    .number()
    .int()
    .min(1, 'Must allow at least 1 application')
    .max(1000, 'Too many applications allowed')
    .optional(),
})

// Application schema
export const applicationSchema = z.object({
  internshipId: z
    .string()
    .uuid('Invalid internship ID'),
  coverLetter: z
    .string()
    .min(1, 'Cover letter is required')
    .max(3000, 'Cover letter too long'),
  resumeUrl: z
    .string()
    .url('Invalid resume URL')
    .optional()
    .or(z.literal('')),
})

// Message schema
export const messageSchema = z.object({
  applicationId: z
    .string()
    .uuid('Invalid application ID'),
  recipientId: z
    .string()
    .uuid('Invalid recipient ID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long'),
})

// Type exports for components
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type SchoolInput = z.infer<typeof schoolSchema>
export type StudentProfileInput = z.infer<typeof studentProfileSchema>
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>
export type InternshipInput = z.infer<typeof internshipSchema>
export type ApplicationInput = z.infer<typeof applicationSchema>
export type MessageInput = z.infer<typeof messageSchema>

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    throw error
  }
}