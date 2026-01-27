"use client"

import * as React from "react"
import { Moon, Sun, Laptop, Palette } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "Brand", value: "brand", icon: Palette },
    { name: "System", value: "system", icon: Laptop },
  ]

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  
  const CurrentThemeIcon = React.useMemo(() => {
    // In system mode, theme can be 'light' or 'dark', so we need to check resolvedTheme.
    // However, useTheme doesn't immediately provide resolvedTheme.
    // A simple approach is to show the 'System' icon if the theme is 'system'.
    switch (theme) {
        case 'light': return Sun;
        case 'dark': return Moon;
        case 'brand': return Palette;
        case 'system': return Laptop;
        default: return Laptop;
    }
  }, [theme])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-11 w-11 rounded-full bg-background/70 text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        <CurrentThemeIcon className="h-6 w-6 transition-all" />
        <span className="sr-only">Toggle theme</span>
      </button>

      <div
        ref={dropdownRef}
        className={`absolute end-0 mt-2 w-40 origin-top-right rounded-xl bg-background/80 backdrop-blur-lg border border-border shadow-2xl shadow-primary/10 ring-1 ring-black ring-opacity-5 z-10 transition-all duration-150 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <div className="p-1">
          {themes.map(({ name, value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                theme === value
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
