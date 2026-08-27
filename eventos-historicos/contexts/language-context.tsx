"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import ptTranslations from "@/lib/i18n/pt.json"
import enTranslations from "@/lib/i18n/en.json"

type Language = "pt" | "en"

const DICTIONARIES: Record<Language, any> = {
  pt: ptTranslations,
  en: enTranslations,
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: any
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Dictionaries are bundled at build time (not fetched), so the correct
  // translations are available on the very first render — server-side and
  // client-side alike. This avoids both an SSR HTML full of raw i18n keys
  // and a flash of untranslated text before a network fetch resolved.
  const [language, setLanguageState] = useState<Language>("pt")
  const translations = DICTIONARIES[language]

  // Load saved language preference from localStorage after mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "pt" || savedLanguage === "en")) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split(".")
    let value = translations

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
