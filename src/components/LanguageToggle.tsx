'use client'

import { useI18n, type Locale } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Languages } from 'lucide-react'

interface LanguageToggleProps {
  variant?: 'compact' | 'full'
  showLabel?: boolean
}

export default function LanguageToggle({ variant = 'full', showLabel = true }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n()

  const languages: { code: Locale; label: string; nativeLabel: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'es', label: 'Español', nativeLabel: 'Español' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale)

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
            <Languages className="h-4 w-4" />
            <span className="uppercase font-semibold">{locale}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          {languages.map(language => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => setLocale(language.code)}
              className={`cursor-pointer ${locale === language.code ? 'bg-accent font-medium' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{language.nativeLabel}</span>
                <span className="text-xs uppercase text-muted-foreground ml-2">
                  {language.code}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {showLabel && currentLanguage?.nativeLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Language
        </div>
        {languages.map(language => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={`cursor-pointer ${locale === language.code ? 'bg-accent font-medium' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>{language.nativeLabel}</span>
              <span className="text-xs uppercase text-muted-foreground ml-2">
                {language.code}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}