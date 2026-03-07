'use client'

import { useI18n } from '@/lib/i18n'
import { useSchool } from '@/lib/school'
import { ReactNode, useEffect } from 'react'

interface DynamicLayoutProps {
  children: ReactNode
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const { locale } = useI18n()
  const { currentSchool } = useSchool()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const root = document.documentElement
    if (currentSchool) {
      root.style.setProperty('--school-primary', currentSchool.primary_color)
      root.style.setProperty('--school-secondary', currentSchool.secondary_color)
      root.dataset.schoolBranded = 'true'
    } else {
      root.style.removeProperty('--school-primary')
      root.style.removeProperty('--school-secondary')
      delete root.dataset.schoolBranded
    }
  }, [currentSchool])

  return <>{children}</>
}
