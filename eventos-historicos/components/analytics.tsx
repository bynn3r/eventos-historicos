"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import Link from "next/link"
import { usePathname } from "next/navigation"

// ID do Google Analytics 4 (ex.: G-XXXXXXXXXX), definido na variável de ambiente do Amplify.
// Sem o ID, nada é carregado e o banner não aparece.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const STORAGE_KEY = "eh-cookie-consent"

type Consent = "granted" | "denied" | null

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    return null
  }
}

function saveConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Navegação privada / armazenamento bloqueado: vale só para esta visita.
  }
}

/**
 * Google Analytics 4 com consentimento (LGPD): o script do Google só é carregado
 * depois que o visitante clica em "Aceitar". Recusar não carrega nada.
 */
export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null)
  const [ready, setReady] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setConsent(readConsent())
    setReady(true)
  }, [])

  // Navegação client-side do Next não recarrega a página: registra cada troca de rota.
  useEffect(() => {
    if (consent === "granted" && GA_ID && window.gtag) {
      window.gtag("event", "page_view", { page_path: pathname, page_location: window.location.href })
    }
  }, [pathname, consent])

  if (!GA_ID || !ready) return null

  const decide = (value: "granted" | "denied") => {
    saveConsent(value)
    setConsent(value)
  }

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: false });
gtag('event', 'page_view', { page_path: window.location.pathname, page_location: window.location.href });`}
          </Script>
        </>
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border bg-background/95 p-4 text-sm shadow-lg backdrop-blur sm:inset-x-auto sm:right-4 sm:bottom-4"
        >
          <p className="text-muted-foreground">
            Usamos cookies analíticos para entender quais conteúdos são mais lidos. Você pode aceitar ou recusar.{" "}
            <Link href="/privacidade" className="underline underline-offset-2 hover:text-foreground">
              Saiba mais
            </Link>
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => decide("denied")}
              className="rounded-md border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => decide("granted")}
              className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
