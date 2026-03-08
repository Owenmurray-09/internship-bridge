'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import enMessages from './messages/en.json'
import esMessages from './messages/es.json'

export type Locale = 'en' | 'es'
export type TranslationMessages = Record<string, any>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

const getBrowserLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'es' ? 'es' : 'en'
}

const getStoredLocale = (): Locale | null => {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('preferred-locale')
  return stored === 'es' || stored === 'en' ? stored : null
}

const setStoredLocale = (locale: Locale) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('preferred-locale', locale)
    } catch (error) {
      // Ignore localStorage errors (e.g., in private browsing mode)
      console.warn('Failed to store locale preference:', error)
    }
  }
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Initialize with default locale to ensure server/client consistency
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Always start with 'en' for SSR consistency
    return initialLocale || 'en'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setStoredLocale(newLocale)
  }

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true)
    // Only update locale after hydration if no initial locale was provided
    if (!initialLocale) {
      const clientLocale = getStoredLocale() || getBrowserLocale()
      if (clientLocale !== locale) {
        setLocaleState(clientLocale)
      }
    }
  }, [initialLocale, locale])

  // Derive messages from locale (not state, to avoid stale HMR issues)
  const messages: TranslationMessages = useMemo(() => {
    if (locale === 'es') return esMessages
    return enMessages
  }, [locale])

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value !== 'string') {
      console.warn(`Translation missing for key: ${key}`)
      return key // Return the key as fallback
    }

    // Simple interpolation
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) =>
          str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
        value
      )
    }

    return value
  }

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t, isLoading } },
    children
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations(namespace?: string) {
  const { t: baseT, locale } = useI18n()

  const t = (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return baseT(fullKey, params)
  }

  return { t, locale }
}