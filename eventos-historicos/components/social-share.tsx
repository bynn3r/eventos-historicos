"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Twitter, Linkedin, Link2, MessageCircle } from "lucide-react"
import { useState } from "react"

interface SocialShareProps {
  title: string
  url: string
  description?: string
}

export function SocialShare({ title, url, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" ? window.location.origin + url : url
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || "")
  const encodedUrl = encodeURIComponent(shareUrl)

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Falha ao copiar:", err)
    }
  }

  const openShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Compartilhar Artigo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openShare("facebook")}
            className="flex items-center gap-2 bg-transparent"
          >
            <Facebook className="h-4 w-4" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openShare("twitter")}
            className="flex items-center gap-2 bg-transparent"
          >
            <Twitter className="h-4 w-4" />
            Twitter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openShare("linkedin")}
            className="flex items-center gap-2 bg-transparent"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openShare("whatsapp")}
            className="flex items-center gap-2 bg-transparent"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-transparent"
          >
            <Link2 className="h-4 w-4" />
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
