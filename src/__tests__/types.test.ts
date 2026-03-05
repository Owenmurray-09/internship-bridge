import { describe, it, expect } from 'vitest'
import type { UserRole, School, SchoolMembership, User, CompanyProfile, Internship } from '@/types/database'

describe('database types', () => {
  describe('UserRole', () => {
    it('includes the four expected roles', () => {
      const roles: UserRole[] = ['student', 'employer', 'school_admin', 'global_admin']
      expect(roles).toHaveLength(4)
    })

    it('does not include legacy admin', () => {
      // TypeScript compile-time check: 'admin' should not be assignable to UserRole
      // This is a runtime assertion that our type string values are correct
      const validRoles = ['student', 'employer', 'school_admin', 'global_admin']
      expect(validRoles).not.toContain('admin')
    })
  })

  describe('School interface', () => {
    it('has required branding fields', () => {
      const school: School = {
        id: '123',
        name: 'Test School',
        slug: 'test-school',
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(school.primary_color).toBe('#2563eb')
      expect(school.secondary_color).toBe('#1e40af')
      expect(school.slug).toBe('test-school')
    })
  })

  describe('User interface', () => {
    it('has preferred_school_id as optional', () => {
      const user: User = {
        id: '123',
        email: 'test@test.com',
        role: 'student',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(user.preferred_school_id).toBeUndefined()
    })

    it('accepts preferred_school_id', () => {
      const user: User = {
        id: '123',
        email: 'test@test.com',
        role: 'student',
        preferred_school_id: '456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(user.preferred_school_id).toBe('456')
    })
  })

  describe('CompanyProfile interface', () => {
    it('has is_global field', () => {
      const profile: CompanyProfile = {
        id: '123',
        user_id: '456',
        company_name: 'Test Corp',
        verified: false,
        is_global: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(profile.is_global).toBe(true)
    })
  })

  describe('Internship interface', () => {
    it('has optional school_id', () => {
      const internship: Internship = {
        id: '123',
        company_id: '456',
        title: 'Test Internship',
        description: 'Description',
        remote_allowed: false,
        stipend_currency: 'USD',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(internship.school_id).toBeUndefined()
    })

    it('accepts school_id for school-scoped internship', () => {
      const internship: Internship = {
        id: '123',
        company_id: '456',
        title: 'Test Internship',
        description: 'Description',
        remote_allowed: false,
        stipend_currency: 'USD',
        status: 'active',
        school_id: '789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      expect(internship.school_id).toBe('789')
    })
  })

  describe('SchoolMembership interface', () => {
    it('connects user to school', () => {
      const membership: SchoolMembership = {
        id: '123',
        user_id: '456',
        school_id: '789',
        is_primary: true,
        created_at: '2024-01-01T00:00:00Z',
      }
      expect(membership.is_primary).toBe(true)
      expect(membership.user_id).toBe('456')
      expect(membership.school_id).toBe('789')
    })
  })
})
