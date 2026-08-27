# Arquitetura do Sistema de Notícias

**Projeto:** Eventos Históricos  
**Domínio:** eventoshistoricos.com.br  
**Última atualização:** Agosto 2026

---

## Visão Geral

```
EventBridge Scheduler (4×/dia)
        ↓
  Lambda Function
  ├── Busca RSS feeds (BBC, Guardian, G1, Al Jazeera...)
  ├── Filtra e pontua candidatos
  ├── Traduz (DeepL / MyMemory / Google)
  ├── Enriquece: scraping da fonte + OpenAI expansion
  ├── Extrai og:image (em paralelo com o scraping)
  └── Salva no DynamoDB (resumo: false = artigo completo)

DynamoDB (eventos-historicos-noticias)
        ↓
  Next.js (Amplify WEB_COMPUTE)
  ├── /api/rss → getRssNews() → listNoticiasDb()
  ├── /api/noticias → getCuratedNews()
  └── /noticias/[slug] → getNewsArticleBySlug() → getNoticiaDb()
```

O Lambda é o **único writer**. O Next.js é o **único reader** (via DynamoDB direto).

---

## Infraestrutura AWS

| Recurso | Identificador |
|---|---|
| Lambda function | `eventos-historicos-noticias` |
| DynamoDB table | `eventos-historicos-noticias` |
| GSI para listagem | `tipo-data-index` (PK: `tipo`, SK: `data`) |
| IAM role Lambda | `eventos-historicos-lambda-role` |
| IAM user deploy | `eventos-historicos-deploy` |
| Lambda Function URL | auth: `AWS_IAM` (SigV4) |
| EventBridge Schedule | `cron(0 6,12,18,0 * * ? *)` — 06h, 12h, 18h, 00h UTC |
| TTL DynamoDB | 30 dias (`expiresAt` em Unix timestamp) |
| Região | `us-east-1` |

### Por que AWS_IAM na Function URL

AWS bloqueou Lambda Function URLs com `NONE` (auth pública) em contas criadas após outubro/2024 via "Block Public Access". Migrado para `AWS_IAM` com SigV4 signing — o Next.js usava a URL para leitura, mas foi substituído por leitura direta do DynamoDB (mais rápido). A Function URL ainda existe para o endpoint `POST /refresh` (trigger manual) e `GET /noticias` (consulta direta se necessário).

---

## Variáveis de Ambiente

### Next.js (Amplify env vars)

```
DYNAMODB_NOTICIAS_TABLE=eventos-historicos-noticias
AWS_ACCESS_KEY_ID=          # ou Access_key (legado)
AWS_SECRET_ACCESS_KEY=      # ou Secret_access_key (legado)
AWS_REGION=us-east-1
OPENAI_API_KEY=sk-...
OPENAI_EDITORIAL_MODEL=gpt-4o-mini
DEEPL_API_KEY=              # opcional — fallback para MyMemory/Google
LAMBDA_API_URL=             # URL da Function URL (não usada no read path)
CRON_SECRET=                # protege POST /api/noticias/refresh
```

### Lambda (env vars no console AWS)

```
DYNAMODB_NOTICIAS_TABLE=eventos-historicos-noticias
OPENAI_API_KEY=sk-...
OPENAI_EDITORIAL_MODEL=gpt-4o-mini
DEEPL_API_KEY=              # opcional
ALLOWED_ORIGIN=*
```

---

## Fluxo de Leitura (Next.js)

### getRssNews (lista de artigos)

```
1. Cache em memória (90s TTL)           ~0ms
2. DynamoDB listNoticiasDb()            ~10-20ms  ← caminho normal
3. RSS fetch completo (fallback)        ~5-15s    ← só se DynamoDB vazio
```

### getNewsArticleBySlug (página de artigo)

```
1. Local articles (JSON estático)       ~0ms
2. DynamoDB getNoticiaDb(slug)
   └── resumo: false → retorna         ~10ms  ← caminho normal
   └── resumo: true  → enrichAndCache()
       ├── scraping da fonte            ~1-3s
       ├── fetchSourcePageImage()       ~1-3s  (reutiliza HTML cacheado)
       ├── tradução (DeepL/Google)      ~1-2s
       └── OpenAI expansion (fallback)  ~3-8s
3. findScoredCandidateBySlug()         ~5-15s  ← artigo não indexado ainda
```

### Cache HTTP (páginas de artigo)

`revalidate = 300` em `/noticias/[slug]/page.tsx` — Next.js renderiza uma vez e serve HTML cacheado por 5 minutos. Primeiro visitante paga o custo de renderização; os seguintes recebem resposta instantânea.

---

## Fluxo de Escrita (Lambda)

### refreshArticles()

```
1. Busca todos os RSS feeds em paralelo
2. Filtra artigos relevantes (keywords geopolítica/história)
3. Pontua e ordena (score = source weight + recência + relevância)
4. Top 20 candidatos
5. Para cada candidato:
   a. articleExistsFull(slug)?
      - resumo: false + imagem real → SKIP
      - resumo: true OU imagem genérica → PROCESSAR
   b. hydrateScoredCandidate()
      ├── Traduz título, descrição, corpo
      └── resolveArticleImage() (timeout 8s)
          ├── Imagem do feed (media:content, enclosure)
          ├── og:image da página fonte
          ├── Wikimedia (busca por entidades)
          └── OpenAI image hints → Wikimedia
   c. enrichArticle()
      ├── fetchSourceArticleText() + fetchSourcePageImage() em paralelo
      ├── Scraping com sucesso → translata → resumo: false
      ├── Falha → expandArticleWithAI() → resumo: false
      └── AI = original → salva só imagem se conseguiu
   d. saveArticle() → DynamoDB
```

### articleExistsFull() — critério de skip

```ts
resumo === false
  AND imagem não é genérica (/world-map-*.jpg, /historical-books*.jpg, /geopolitics*.jpg)
```

Artigos com `resumo: false` mas imagem genérica são reprocessados na próxima rodada para tentar capturar o og:image da fonte.

---

## Problemas Resolvidos (Agosto 2026)

### 1. Remoção do Redis

O Redis (Upstash) foi removido completamente do fluxo de leitura. O DynamoDB é a única fonte de cache persistente.

**Antes:** in-memory → Redis → Lambda Function URL → RSS fetch  
**Depois:** in-memory → DynamoDB → RSS fetch

Funções removidas de `news.ts`:
- `getCachedRssArticles` / `setCachedRssArticles`
- `getCachedArticleBySlug` / `setCachedArticleBySlug`

O pacote `@upstash/redis` ainda está em `package.json` e `lib/redis-cache.ts` ainda existe como código morto. Podem ser removidos com segurança.

### 2. Bug: artigo nunca persistido após enriquecimento

`enrichArticleWithFullText` retornava o artigo sem incluir `resumo: false`. A condição `if (!enriched.resumo) saveNoticiaDb(enriched)` no `enrichAndCache` nunca era verdadeira — cada visita a um artigo refazia scraping + tradução + OpenAI do zero (5-8s).

**Fix:** `enrichArticleWithFullText` agora retorna `resumo: false` explicitamente no objeto de retorno.

### 3. Bug: `force-dynamic` re-renderizava em cada request

`export const dynamic = "force-dynamic"` em `/noticias/[slug]/page.tsx` impedia qualquer cache de HTML. Substituído por `export const revalidate = 300`.

### 4. Bug: `import { cache } from "react"` quebrando Route Handlers

A função `cache()` do React foi adicionada para deduplicar chamadas DynamoDB dentro de um request. No contexto de Route Handlers (`/api/rss`, `/api/noticias`), o React não tem contexto de request inicializado no momento de carregamento do módulo, causando falha silenciosa no load de `lib/news.ts`. Todas as rotas API retornavam 500, componentes client ficavam com array vazio.

**Fix:** removido o wrapper `cache()`. O `getNoticiaDb` é importado diretamente.

### 5. Performance: Lambda → DynamoDB direto no read path

O Next.js chamava a Lambda Function URL (SigV4 signed) para ler artigos. Cold start da Lambda causava latência de ~2s por request. Migrado para leitura direta do DynamoDB (~10ms).

A Lambda permanece como write path (EventBridge → scraping → DynamoDB). O Next.js lê diretamente sem passar pela Lambda.

### 6. Imagens genéricas nos artigos

**Causa:** G1 e outras fontes brasileiras não incluem `media:content` nem `enclosure` no RSS. O `resolveArticleImage()` no Next.js tem timeout de 3s (insuficiente para scraping). Artigos salvos com imagem genérica nunca eram reprocessados pois `articleExistsFull` só verificava `resumo`.

**Fix em duas frentes:**
- Lambda: `enrichArticle()` busca og:image em paralelo com scraping de texto (`Promise.all`)
- Lambda: `articleExistsFull()` agora também retorna `false` para artigos com imagem genérica
- Next.js: `enrichArticleWithFullText()` busca og:image após scraping (HTML já em cache, custo zero de rede)

### 7. pnpm v11 minimumReleaseAge bloqueando build Amplify

O pnpm v11 rejeita pacotes publicados há menos de 24h durante o build. `@aws-sdk/client-dynamodb@3.1119.0` foi publicado no mesmo dia do build.

**Fix:** Pinado para `3.1118.0` (publicado 25/08, >24h antes do build) sem `^` no `package.json`. O lockfile foi atualizado localmente com `pnpm install --no-frozen-lockfile` antes do push.

Para atualizações futuras do AWS SDK: aguardar 24h após publicação da versão, ou verificar a data de publicação em npmjs.com antes de atualizar.

---

## Estrutura de Arquivos Relevantes

```
eventos-historicos/
├── amplify.yml                          # build config do Amplify
├── MIGRACAO-VERCEL-AWS.md               # documentação da migração
├── NOTICIAS-ARQUITETURA.md              # este arquivo
├── infra/
│   └── lambda/
│       ├── main.tf                      # Lambda, Function URL, EventBridge, IAM
│       └── variables.tf
└── lambda/
│   ├── src/
│   │   ├── handler.ts                   # roteamento HTTP + EventBridge
│   │   ├── process.ts                   # scraping, tradução, enriquecimento
│   │   ├── dynamodb.ts                  # leitura/escrita DynamoDB (Lambda)
│   │   ├── translate.ts                 # DeepL + fallbacks
│   │   └── utils.ts                     # scraping, parsing HTML
│   └── dist/index.mjs                  # bundle gerado por build.mjs
└── eventos-historicos/
    ├── lib/
    │   ├── news.ts                      # lógica central de notícias
    │   ├── dynamodb.ts                  # leitura DynamoDB (Next.js)
    │   ├── news-api.ts                  # cliente da Lambda Function URL (SigV4)
    │   ├── redis-cache.ts               # CÓDIGO MORTO — pode ser removido
    │   └── deepl.ts                     # tradução resiliente
    ├── app/
    │   ├── api/rss/route.ts             # GET /api/rss → getRssNews()
    │   ├── api/noticias/route.ts        # GET /api/noticias → getCuratedNews()
    │   └── noticias/[slug]/page.tsx     # revalidate=300, ISR
    └── components/
        ├── home-page-runtime.tsx        # "use client", fetch /api/rss
        └── news-page-runtime.tsx        # "use client", fetch /api/noticias
```

---

## Deploy do Lambda

O Lambda é deployado separadamente do Next.js (não via Amplify).

```bash
# Build
cd lambda
npm run build          # gera dist/index.mjs e function.zip

# Deploy (AWS CLI)
aws lambda update-function-code \
  --function-name eventos-historicos-noticias \
  --zip-file fileb://function.zip \
  --region us-east-1

# Trigger manual
aws lambda invoke \
  --function-name eventos-historicos-noticias \
  --region us-east-1 \
  --payload '{"source":"aws.events","detail-type":"Scheduled Event","detail":{}}' \
  /tmp/out.json && cat /tmp/out.json
```

O Terraform (`infra/lambda/`) gerencia a infraestrutura (IAM, EventBridge, Function URL). Para mudanças de código apenas, `aws lambda update-function-code` é suficiente sem rodar `terraform apply`.

---

## Pendências

- [ ] Remover `lib/redis-cache.ts` e `@upstash/redis` do `package.json`
- [ ] Remover imports de `news-api.ts` de `lib/news.ts` (não utilizados no read path)
- [ ] Configurar `DEEPL_API_KEY` no Lambda e no Amplify (tradução mais fiel)
- [ ] Alertas de custo AWS (Billing Alarm no CloudWatch)
- [ ] Monitoramento de erros Lambda no CloudWatch
