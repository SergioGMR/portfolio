import { useEffect, useMemo, useRef, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

type ThemeOption = 'light' | 'dark' | 'system'

const THEME_OPTIONS: ThemeOption[] = ['light', 'dark', 'system']

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const applyThemeToDocument = (theme: ThemeOption) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    root.classList.toggle('dark', getSystemTheme() === 'dark')
  }
}

const ModeToggle = () => {
  const [theme, setTheme] = useState<ThemeOption>('system')
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'light' : getSystemTheme(),
  )
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored =
      (localStorage.getItem('theme') as ThemeOption | null) || 'system'
    setTheme(stored)
    setSystemTheme(getSystemTheme())
    applyThemeToDocument(stored)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    applyThemeToDocument(theme)

    if (theme === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      const next = mediaQuery.matches ? 'dark' : 'light'
      setSystemTheme(next)
      if (theme === 'system') {
        applyThemeToDocument('system')
      }
    }

    handleSystemChange()
    mediaQuery.addEventListener('change', handleSystemChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
    }
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const effectiveTheme = useMemo(
    () => (theme === 'system' ? systemTheme : theme),
    [theme, systemTheme],
  )

  const onSelectTheme = (value: ThemeOption) => {
    setTheme(value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-opacity ${
            effectiveTheme === 'dark' ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-opacity ${
            effectiveTheme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <span className="sr-only">Toggle theme</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {THEME_OPTIONS.map(option => {
            const isActive = option === theme
            const label = option === 'system' ? 'System' : option === 'dark' ? 'Dark' : 'Light'
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                data-theme-value={option}
                onClick={() => onSelectTheme(option)}
                className={`flex w-full cursor-pointer items-center px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export { ModeToggle }
export default ModeToggle
