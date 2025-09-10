"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Check, AlertCircle } from "lucide-react"

export function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")

    // Simulate API call
    setTimeout(() => {
      if (email.includes("@")) {
        setStatus("success")
        setMessage("Obrigado! Você foi inscrito com sucesso.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage("Por favor, insira um email válido.")
      }

      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 3000)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Newsletter
        </CardTitle>
        <CardDescription>
          Receba análises exclusivas e as últimas notícias de geopolítica diretamente no seu email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="flex-1"
            />
            <Button type="submit" disabled={status === "loading" || !email}>
              {status === "loading" ? "..." : "Inscrever"}
            </Button>
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}
            >
              {status === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message}
            </div>
          )}

          <p className="text-xs text-muted-foreground">Sem spam. Cancele a qualquer momento.</p>
        </form>
      </CardContent>
    </Card>
  )
}
