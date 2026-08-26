export interface SiteNewsArticle {
  id: string
  slug: string
  titulo: string
  descricao: string
  conteudo: string
  conteudoHtml: string
  resumo: boolean
  data: string
  categoria: string
  autor?: string
  fonte: string
  fonteUrl?: string
  linkFonte?: string
  imagem: string
  tags: string[]
  href: string
  externo: boolean
  tipo: "rss" | "local" | "analysis"
  idioma: "pt" | "en"
  noticeHtml: string
  tituloOriginal?: string
  descricaoOriginal?: string
  conteudoOriginal?: string
}

export interface ParsedFeedItem {
  titulo: string
  descricao: string
  conteudoHtml: string
  data: string
  fonte: string
  link: string
  imagem?: string
  truncated: boolean
}

export interface ScoredCandidate {
  item: ParsedFeedItem
  categoria: string
  score: number
  data: string
}
