'use client'

import { useSchool } from '@/lib/school'
import { useTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2 } from 'lucide-react'

interface SchoolPickerProps {
  variant?: 'compact' | 'full'
  showAllSchoolsOption?: boolean
}

export default function SchoolPicker({ variant = 'full', showAllSchoolsOption = false }: SchoolPickerProps) {
  const { currentSchool, setCurrentSchool, schools, isLoading } = useSchool()
  const { t } = useTranslations('school')

  if (isLoading || schools.length === 0) return null
  if (schools.length === 1 && !showAllSchoolsOption) return null

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            <span className="truncate max-w-[120px]">
              {currentSchool?.name ?? t('allSchools')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {showAllSchoolsOption && (
            <DropdownMenuItem
              onClick={() => setCurrentSchool(null)}
              className={`cursor-pointer ${!currentSchool ? 'bg-accent font-medium' : ''}`}
            >
              {t('allSchools')}
            </DropdownMenuItem>
          )}
          {schools.map(school => (
            <DropdownMenuItem
              key={school.id}
              onClick={() => setCurrentSchool(school)}
              className={`cursor-pointer ${currentSchool?.id === school.id ? 'bg-accent font-medium' : ''}`}
            >
              <span>{school.name}</span>
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
          <Building2 className="h-4 w-4" />
          {currentSchool?.name ?? t('allSchools')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {t('picker')}
        </div>
        {showAllSchoolsOption && (
          <DropdownMenuItem
            onClick={() => setCurrentSchool(null)}
            className={`cursor-pointer ${!currentSchool ? 'bg-accent font-medium' : ''}`}
          >
            {t('allSchools')}
          </DropdownMenuItem>
        )}
        {schools.map(school => (
          <DropdownMenuItem
            key={school.id}
            onClick={() => setCurrentSchool(school)}
            className={`cursor-pointer ${currentSchool?.id === school.id ? 'bg-accent font-medium' : ''}`}
          >
            <span>{school.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
