"use client"

import Link from "next/link"
import { Globe, Youtube, Instagram, Twitter, Facebook, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  const socialLinks = [
    { icon: Youtube, href: "https://youtube.com/@eventoshistoricos", label: "YouTube" },
    { icon: Instagram, href: "https://instagram.com/eventoshistoricos", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/eventoshistoricos", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com/eventoshistoricos", label: "Facebook" },
    { icon: Linkedin, href: "https://linkedin.com/company/eventoshistoricos", label: "LinkedIn" },
  ]

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-primary">Eventos Históricos</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t("footer.description")}</p>
            <div className="flex space-x-2">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <Button
                    key={social.label}
                    variant="ghost"
                    size="icon"
                    asChild
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Siga-nos no ${social.label}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </a>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/noticias" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("menu.geopolitics")}
                </Link>
              </li>
              <li>
                <Link href="/curiosidades" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("menu.curiosities")}
                </Link>
              </li>
              <li>
                <Link href="/grandes-eventos" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("menu.events")}
                </Link>
              </li>
              <li>
                <Link href="/linha-do-tempo" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("menu.timeline")}
                </Link>
              </li>
              <li>
                <Link href="/busca" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("menu.search")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.categories")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/categoria/guerra-fria"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Guerra Fria
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/segunda-guerra"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Segunda Guerra
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/oriente-medio"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Oriente Médio
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/america-latina"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  América Latina
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/imperio-romano"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Império Romano
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter - Enhanced with new component */}
          <div>
            <NewsletterSignup />
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">{t("footer.rights")}</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("menu.privacy")}
              </Link>
              <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link href="/contato" className="text-muted-foreground hover:text-foreground transition-colors">
                {t("footer.contact")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
