'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import type { School } from '@/types/database'

interface SchoolContextType {
  currentSchool: School | null
  setCurrentSchool: (school: School | null) => void
  schools: School[]
  isLoading: boolean
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined)

interface SchoolProviderProps {
  children: ReactNode
}

const getStoredSchoolId = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('preferred-school-id')
}

const setStoredSchoolId = (schoolId: string | null) => {
  if (typeof window !== 'undefined') {
    try {
      if (schoolId) {
        localStorage.setItem('preferred-school-id', schoolId)
      } else {
        localStorage.removeItem('preferred-school-id')
      }
    } catch (error) {
      console.warn('Failed to store school preference:', error)
    }
  }
}

export function SchoolProvider({ children }: SchoolProviderProps) {
  const [currentSchool, setCurrentSchoolState] = useState<School | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const setCurrentSchool = (school: School | null) => {
    setCurrentSchoolState(school)
    setStoredSchoolId(school?.id ?? null)

    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('users')
          .update({ preferred_school_id: school?.id ?? null })
          .eq('id', user.id)
          .then(() => {})
      }
    })
  }

  useEffect(() => {
    const loadSchools = async () => {
      setIsLoading(true)
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: memberships } = await supabase
        .from('school_memberships')
        .select('*, school:schools(*)')
        .eq('user_id', user.id)

      const userSchools = (memberships
        ?.map((m: Record<string, unknown>) => m.school)
        .filter(Boolean) ?? []) as School[]
      setSchools(userSchools)

      const { data: userData } = await supabase
        .from('users')
        .select('preferred_school_id')
        .eq('id', user.id)
        .single()

      const dbPreferredId = userData?.preferred_school_id
      const storedId = getStoredSchoolId()
      const primaryMembership = memberships?.find((m: Record<string, unknown>) => m.is_primary)

      const targetId = dbPreferredId || storedId || (primaryMembership as Record<string, unknown>)?.school_id
      const targetSchool = userSchools.find(s => s.id === targetId) ?? null

      setCurrentSchoolState(targetSchool)
      setIsLoading(false)
    }

    loadSchools()
  }, [])

  return React.createElement(
    SchoolContext.Provider,
    { value: { currentSchool, setCurrentSchool, schools, isLoading } },
    children
  )
}

export function useSchool() {
  const context = useContext(SchoolContext)
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider')
  }
  return context
}
