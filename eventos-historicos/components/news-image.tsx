"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"

interface NewsImageProps extends Omit<ImageProps, "src"> {
  src?: string
  fallbackSrc?: string
}

export function NewsImage({ src, fallbackSrc = "/geopolitics-world-map-with-news-overlay.jpg", alt, ...props }: NewsImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)

  return <Image {...props} src={currentSrc || fallbackSrc} alt={alt} onError={() => setCurrentSrc(fallbackSrc)} />
}
