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
const userRoleSchema = z.enum(['student', 'employer', 'admin'] as const)

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
  role: userRoleSchema,
})

// Profile schemas
export const studentProfileSchema = z.object({
  university: z
    .string()
    .max(200, 'University name too long')
    .optional(),
  major: z
    .string()
    .max(100, 'Major too long')
    .optional(),
  graduationYear: z
    .number()
    .int()
    .min(new Date().getFullYear(), 'Graduation year must be in the future')
    .max(new Date().getFullYear() + 10, 'Graduation year too far in the future')
    .optional(),
  gpa: z
    .number()
    .min(0, 'GPA cannot be negative')
    .max(4.0, 'GPA cannot exceed 4.0')
    .optional(),
  resumeUrl: z
    .string()
    .url('Invalid resume URL')
    .optional()
    .or(z.literal('')),
  portfolioUrl: z
    .string()
    .url('Invalid portfolio URL')
    .optional()
    .or(z.literal('')),
  githubUrl: z
    .string()
    .url('Invalid GitHub URL')
    .refine((url) => url.includes('github.com'), 'Must be a GitHub URL')
    .optional()
    .or(z.literal('')),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .refine((url) => url.includes('linkedin.com'), 'Must be a LinkedIn URL')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(1000, 'Bio too long')
    .optional(),
  skills: z
    .array(z.string().min(1).max(50))
    .max(20, 'Too many skills')
    .optional(),
  location: z
    .string()
    .max(200, 'Location too long')
    .optional(),
})

export const companyProfileSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name too long')
    .transform((val) => val.trim()),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .optional(),
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
  stipendAmount: z
    .number()
    .min(0, 'Stipend cannot be negative')
    .max(50000, 'Stipend amount too high')
    .optional(),
  stipendCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .default('USD'),
  applicationDeadline: z
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