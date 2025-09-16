"use client"

import { useLanguage } from "@/contexts/language-context"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-1 text-sm">
      <button
        onClick={() => setLanguage("pt")}
        className={`px-2 py-1 rounded transition-colors ${
          language === "pt"
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        PT
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded transition-colors ${
          language === "en"
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  )
}
