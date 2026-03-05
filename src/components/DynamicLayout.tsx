'use client'

import { useI18n } from '@/lib/i18n'
import { ReactNode, useEffect } from 'react'

interface DynamicLayoutProps {
  children: ReactNode
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const { locale } = useI18n()

  useEffect(() => {
    // Update the HTML lang attribute when locale changes
    document.documentElement.lang = locale
  }, [locale])

  return <>{children}</>
}