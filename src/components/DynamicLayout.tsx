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
      const p = currentSchool.primary_color
      const s = currentSchool.secondary_color
      root.style.setProperty('--school-primary', p)
      root.style.setProperty('--school-secondary', s)
      // Override shadcn theme tokens so buttons, focus rings, etc. use school colors
      root.style.setProperty('--primary', p)
      root.style.setProperty('--primary-foreground', '#ffffff')
      root.style.setProperty('--ring', p)
      root.dataset.schoolBranded = 'true'

      // Inject dynamic stylesheet for branding overrides (Tailwind v4 strips static CSS rules)
      let styleEl = document.getElementById('school-branding-styles') as HTMLStyleElement | null
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'school-branding-styles'
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = `
        /* Primary buttons hover with secondary school color */
        html[data-school-branded="true"] [data-slot="button"][data-variant="default"]:hover {
          background-color: ${s} !important;
        }
        /* Thicker nav bottom border using secondary color */
        html[data-school-branded="true"] nav {
          border-bottom-width: 3px !important;
        }
        /* Red accent line under page headings */
        html[data-school-branded="true"] main > :first-child h1::after,
        html[data-school-branded="true"] main > :first-child h2::after {
          content: '';
          display: block;
          width: 3rem;
          height: 2px;
          background-color: ${s};
          margin-top: 0.5rem;
        }
        /* Override blue accent utilities with school primary */
        html[data-school-branded="true"] .bg-blue-600 {
          background-color: ${p} !important;
        }
        html[data-school-branded="true"] .text-blue-600 {
          color: ${p} !important;
        }
        html[data-school-branded="true"] .hover\\:text-blue-600:hover {
          color: ${p} !important;
        }
        html[data-school-branded="true"] .hover\\:text-blue-800:hover {
          color: ${p} !important;
        }
        html[data-school-branded="true"] .bg-blue-100 {
          background-color: color-mix(in srgb, ${p} 12%, white) !important;
        }
        html[data-school-branded="true"] .text-blue-800 {
          color: ${p} !important;
        }
      `
    } else {
      root.style.removeProperty('--school-primary')
      root.style.removeProperty('--school-secondary')
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--ring')
      delete root.dataset.schoolBranded
      const styleEl = document.getElementById('school-branding-styles')
      if (styleEl) styleEl.textContent = ''
    }
  }, [currentSchool])

  return <>{children}</>
}
