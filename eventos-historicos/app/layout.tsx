import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Eventos Históricos - Geopolítica e História Mundial",
  description:
    "Portal brasileiro de notícias de geopolítica, curiosidades históricas e análises dos grandes eventos que moldaram a humanidade.",
  generator: "v0.app",
  keywords: "geopolítica, história, eventos históricos, notícias mundiais, curiosidades históricas, análise política",
  authors: [{ name: "Eventos Históricos" }],
  openGraph: {
    title: "Eventos Históricos - Geopolítica e História Mundial",
    description: "Portal brasileiro de notícias de geopolítica e história mundial",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </Suspense>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
