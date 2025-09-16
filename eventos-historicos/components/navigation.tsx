"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Menu,
  Moon,
  Sun,
  Globe,
  Info,
  Mail,
  SearchIcon,
  Newspaper,
  BookOpen,
  Calendar,
  Clock,
  ChevronDown,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"
import { LanguageToggle } from "@/components/language-toggle"

export function Navigation() {
  const [searchTerm, setSearchTerm] = useState("")
  const [maisOpen, setMaisOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { t } = useLanguage()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`)
      setSearchTerm("")
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMaisOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0 min-w-[200px] lg:min-w-[240px]">
            <Globe className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex flex-col justify-center">
              <span className="text-lg lg:text-xl font-bold text-primary leading-tight">Eventos Históricos</span>
              <span className="text-xs text-muted-foreground leading-tight">Geopolítica & História</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/noticias"
              className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {t("menu.geopolitics")}
            </Link>

            <Link
              href="/curiosidades"
              className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {t("menu.curiosities")}
            </Link>

            <Link
              href="/grandes-eventos"
              className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {t("menu.events")}
            </Link>

            <Link
              href="/linha-do-tempo"
              className="inline-flex h-10 items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {t("menu.timeline")}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMaisOpen(!maisOpen)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-yellow-500 hover:bg-yellow-600 px-4 py-2 text-sm font-medium text-black transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                {t("menu.more")}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {maisOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background dark:bg-gray-900 shadow-lg rounded-lg border border-border z-50">
                  <div className="py-2">
                    <Link
                      href="/sobre"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setMaisOpen(false)}
                    >
                      <Info className="mr-3 h-4 w-4" />
                      {t("menu.about")}
                    </Link>
                    <Link
                      href="/contato"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setMaisOpen(false)}
                    >
                      <Mail className="mr-3 h-4 w-4" />
                      {t("menu.contact")}
                    </Link>
                    <Link
                      href="/privacidade"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setMaisOpen(false)}
                    >
                      <Globe className="mr-3 h-4 w-4" />
                      {t("menu.privacy")}
                    </Link>
                    <Separator className="my-1" />
                    <Link
                      href="/busca"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => setMaisOpen(false)}
                    >
                      <SearchIcon className="mr-3 h-4 w-4" />
                      {t("menu.search")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Search, Language Toggle and Theme Toggle */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.searchPlaceholder")}
                className="pl-8 w-[150px] lg:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <LanguageToggle />

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px]">
                <SheetHeader className="text-left pb-4">
                  <SheetTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span>Menu de Navegação</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Idioma / Language</span>
                    <LanguageToggle />
                  </div>

                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <Link
                      href="/noticias"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Newspaper className="h-5 w-5 text-primary" />
                      <span>{t("menu.geopolitics")}</span>
                    </Link>

                    <Link
                      href="/curiosidades"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>{t("menu.curiosities")}</span>
                    </Link>

                    <Link
                      href="/grandes-eventos"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>{t("menu.events")}</span>
                    </Link>

                    <Link
                      href="/linha-do-tempo"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Clock className="h-5 w-5 text-primary" />
                      <span>{t("menu.timeline")}</span>
                    </Link>
                  </div>

                  <Separator className="my-4" />

                  {/* Secondary Navigation */}
                  <div className="space-y-1">
                    <Link
                      href="/sobre"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <span>{t("menu.about")}</span>
                    </Link>

                    <Link
                      href="/contato"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span>{t("menu.contact")}</span>
                    </Link>

                    <Link
                      href="/privacidade"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span>{t("menu.privacy")}</span>
                    </Link>

                    <Link
                      href="/busca"
                      className="flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <SearchIcon className="h-5 w-5 text-muted-foreground" />
                      <span>{t("menu.search")}</span>
                    </Link>
                  </div>

                  <Separator className="my-4" />

                  {/* Mobile Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{t("common.search")}</label>
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("common.searchPlaceholder")}
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </form>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
