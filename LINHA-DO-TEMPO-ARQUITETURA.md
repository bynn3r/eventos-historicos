# Arquitetura da Linha do Tempo, Curiosidades e Grandes Eventos

**Projeto:** Eventos Históricos
**Domínio:** eventoshistoricos.com.br
**Última atualização:** Agosto 2026
**Ver também:** `NOTICIAS-ARQUITETURA.md` (sistema de notícias — Lambda + DynamoDB), `MIGRACAO-VERCEL-AWS.md`

---

## Visão Geral

Esta é a "base de conhecimento histórico" do site — em contraste com Notícias (dinâmico, Lambda + DynamoDB), aqui tudo é **JSON estático no repositório**, versionado no Git, sem banco de dados. É uma escolha deliberada: o volume de conteúdo (dezenas de eventos, não milhares) não justifica a complexidade de um banco, e simplicidade de deploy (`git push` → rebuild → ar) foi priorizada.

```
data/linha-do-tempo.json      (29 eventos)  ──┐
data/curiosidades.json        (26 curiosidades) ├──→ lib/related-content.ts ──→ notícias, artigos cruzados
data/grandes-eventos.json     (9 flagship)   ──┘         (match por keyword)

app/linha-do-tempo/page.tsx          → listagem com busca/filtro/ordenação
app/linha-do-tempo/[slug]/page.tsx   → artigo individual (SSG, SEO completo)
app/curiosidades/[slug]/page.tsx     → artigo individual
app/evento/[slug]/page.tsx           → experiência imersiva (scrollytelling + mapa)
app/grandes-eventos/page.tsx         → listagem dos 9 flagship
```

Três tipos de conteúdo, três propósitos:

| Tipo | Arquivo | Quantidade | Propósito |
|---|---|---|---|
| **Linha do Tempo** | `data/linha-do-tempo.json` | 29 | Enciclopédia — todo evento histórico relevante, artigo padrão |
| **Grandes Eventos** | `data/grandes-eventos.json` | 9 | Vitrine — só os eventos mais marcantes, tratamento imersivo caro (scrollytelling, mapa, figuras) |
| **Curiosidades** | `data/curiosidades.json` | 26 | Ganchos de entrada — fatos curiosos que puxam o leitor para o resto do acervo |

**Importante:** os 9 eventos flagship de `grandes-eventos.json` **também existem** como entradas em `linha-do-tempo.json` (mesmo `slug`), com `"featured": true`. Isso evita duplicar dado — a Linha do Tempo mostra o evento normalmente, e quem quiser a experiência completa clica em "Explorar experiência completa" (banner exibido quando `hasFlagshipExperience` é true em `app/linha-do-tempo/[slug]/page.tsx`).

---

## Schema: `data/linha-do-tempo.json`

```ts
interface TimelineEvent {
  id: string                    // = slug
  slug: string                  // URL: /linha-do-tempo/{slug}
  title: string
  startYear: number              // negativo = a.C. (ex: -1754 = 1754 a.C.)
  endYear: number
  dateDisplay: string            // string formatada pra exibição ("1789–1799", "c. 1754 a.C.")
  period: string                 // EXATAMENTE um de: "Idade Antiga" | "Idade Média" | "Idade Moderna" | "Idade Contemporânea"
                                  // (periodização brasileira padrão: Antiga até 476, Média 476–1453, Moderna 1453–1789, Contemporânea 1789–hoje)
  region: string
  country: string
  category: string                // livre (Política, Militar, Religião, Direito, Economia...)
  summary: string                 // 1-2 frases, aparece nos cards e como meta description
  content: string                 // corpo do artigo, parágrafos separados por \n\n
  importance: number              // 1-5, não usado na UI ainda (reservado p/ ordenação futura)
  featured: boolean                // true = tem experiência imersiva em grandes-eventos.json
  image: string                    // "/eventos/hero-{slug}.jpg"
  relatedEvents: string[]          // slugs de OUTROS eventos da linha do tempo (grafo manual)
  characters: { name, role, image, description }[]   // pode ser []
  sources: { title, url }[]        // hoje sempre [] — nenhuma curadoria de fontes ainda
  keywords: string[]               // termos em português minúsculo p/ o matcher de conteúdo relacionado
}
```

**`lib/timeline.ts`** expõe as funções puras sobre esse array: `getAllTimelineEvents()`, `getTimelineEventBySlug(slug)`, `getRelatedTimelineEvents(event)` (resolve os slugs de `relatedEvents`), `filterTimelineEvents({query, period, region, category, sort})`, além das constantes `TIMELINE_PERIODS`, `TIMELINE_CATEGORIES`, `TIMELINE_REGIONS` (essas duas últimas derivadas do próprio array, não hardcoded).

---

## Schema: `data/curiosidades.json`

```ts
interface Curiosidade {
  id: string
  titulo: string                   // formato de afirmação: "X Nunca Foi Y"
  slug: string                      // URL: /curiosidades/{slug}
  descricao: string                 // 1-2 frases, preview
  conteudo: string                  // 3-4 parágrafos, separados por \n\n
  data: string                      // "YYYY-MM-DD" — só ordena a lista, sem relação com o fato em si
  categoria: string
  imagem: string                    // "/curiosidades/{slug}.jpg"
  keywords: string[]                // mesmo propósito que em TimelineEvent
}
```

Sem `relatedEvents` própria — a conexão de curiosidades com o resto do site é sempre calculada em tempo real pelo matcher (não é um grafo manual como no `relatedEvents` da Linha do Tempo).

---

## Schema: `data/grandes-eventos.json` (o "flagship" caro)

Schema bem mais rico — cada entrada vira uma página imersiva inteira em `/evento/[slug]`:

```ts
{
  slug, titulo, ano, periodo, categoria,
  hook: string,                     // frase de efeito no hero
  heroImagem: string, heroLegenda: string,
  jornadaTitulo: string, jornadaDescricao: string,      // título/descrição da seção de scrollytelling
  mapaTitulo: string, mapaDescricao: string,             // título/descrição do mapa interativo
  estatisticas: { label, valor }[],                       // exatamente 4, mostradas em destaque
  contexto: string,                                       // 1 parágrafo longo (200-350 palavras)
  momentos: { data, titulo, local, texto, imagem }[],     // 6-9 "cenas" do scrollytelling
  locais: { nome, lat, lng, descricao }[],                // 5-7 pontos no mapa (posição ilustrativa, não GPS preciso)
  figuras: { nome, papel, imagem, descricao }[],          // 4 personagens
  legado: string,                                          // 2-3 parágrafos, separados por \n\n
  curiosidadesRelacionadas: string[]                       // ids de data/curiosidades.json (não slugs!)
}
```

Componentes que consomem isso: `components/evento/event-journey.tsx` (scrollytelling com `IntersectionObserver`), `components/evento/event-map.tsx` (mapa ilustrativo sobre `public/eventos/world-map.svg`, posição calculada por `toPosition(lat,lng)` com bounds assumidos, **não é geograficamente preciso** — é estético/aproximado).

**Os 9 flagship atuais:** Fim da Segunda Guerra Mundial, Queda de Constantinopla, Descobrimento da América, Revolução Francesa, Chegada do Homem à Lua, Queda do Muro de Berlim, Revolução Russa, Primeira Guerra Mundial, Independência do Brasil.

---

## O mecanismo de conteúdo relacionado (`lib/related-content.ts`)

**O problema que resolve:** notícias mudam várias vezes por dia (Lambda reprocessa 4×/dia) — impossível linkar manualmente notícia-por-notícia a um evento histórico. Uma chamada de IA por notícia pra julgar relevância seria cara nesse volume. A solução é busca literal por palavra-chave, sem IA:

```ts
findRelatedContent(query: string, {
  category?: string,     // bônus de pontuação se a categoria bater
  limit?: number,        // default 3
  excludeSlug?: string,  // pra não sugerir o próprio item na sua própria página
  onlyType?: "evento" | "curiosidade",
}): RelatedContentItem[]
```

Como funciona: normaliza acentos/maiúsculas, monta um "pool" com todos os eventos da Linha do Tempo + todas as Curiosidades (cada um com seu array `keywords`), soma 2 pontos por keyword encontrada como substring no `query`, +1 se a categoria bater, ordena por pontuação, corta pelos `limit` melhores. **Se pontuação for 0 para todos, retorna array vazio** — isso é proposital: uma notícia sem paralelo histórico óbvio não deve forçar uma sugestão irrelevante.

**Onde é usado hoje:**
1. `app/noticias/[slug]/page.tsx` → seção "Contexto histórico" no artigo de notícia (busca em `titulo + descricao`, filtra por `categoria`)
2. `app/curiosidades/[slug]/page.tsx` → seção "Continue explorando" (substituiu o antigo "2 curiosidades aleatórias"; tem fallback pras 2 aleatórias se o match vier vazio)
3. `app/linha-do-tempo/[slug]/page.tsx` → seção "Curiosidades Relacionadas" (`onlyType: "curiosidade"`, já que eventos-para-eventos usa o `relatedEvents` manual)

**Não está conectado ainda (próximo passo natural):** Grandes Eventos (`/evento/[slug]`) não usa esse matcher — ele só mostra `curiosidadesRelacionadas` (lista manual fixa por evento). Dava pra somar o matcher automático ali também.

---

## Como adicionar um evento novo à Linha do Tempo

1. Escrever a entrada seguindo o schema de `TimelineEvent` acima em `data/linha-do-tempo.json`.
2. Escolher/gerar `keywords`: pense em que termos apareceriam numa notícia atual sobre o tema, não só no nome do próprio evento.
3. Preencher `relatedEvents` com slugs de eventos que já existem no arquivo — **não invente eventos novos só pra conectar** (isso já causou confusão uma vez: uma pesquisa mencionou "Era Napoleônica" e "Congresso de Viena" como relacionados à Revolução Francesa, mas esses eventos não existem no site — não foram adicionados).
4. Buscar uma imagem real no Wikimedia:
   ```
   https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=<QUERY>&gsrlimit=5&prop=pageimages&piprop=thumbnail&pithumbsize=1600&inprop=url
   ```
   Se a busca por texto livre (`generator=search`) trouxer resultado errado (acontece bastante — nomes de pessoas/lugares comuns colidem com outros artigos), tentar `titles=<Nome Exato do Artigo>&redirects=1` em vez de busca — muito mais preciso quando você já sabe o título exato do artigo da Wikipedia.
   Salvar em `public/eventos/hero-{slug}.jpg`. Checar tamanho do arquivo (`ls -la`) — Wikimedia às vezes retorna página de erro HTML salva com extensão `.jpg` (o filtro é: arquivo <15KB ou `file` reportando "HTML document" em vez de "JPEG image data" = descartar e tentar de novo).
5. Rodar `pnpm build` e `npx tsc --noEmit` antes de publicar.

## Como promover um evento da Linha do Tempo a "flagship" (Grandes Eventos)

Isso é caro — não faça isso pra todo evento novo. Só pros marcos mais importantes.

1. Escrever a entrada completa em `data/grandes-eventos.json` (schema acima — precisa de 6-9 `momentos`, 5-7 `locais` com lat/lng, 4 `figuras`).
2. Atualizar a entrada correspondente em `data/linha-do-tempo.json`: `featured: true`, e opcionalmente reaproveitar `contexto + legado` do flagship como o `content` da Linha do Tempo (evita reescrever tudo duas vezes).
3. Adicionar ao array inline em `app/grandes-eventos/page.tsx` (ainda é um array hardcoded no componente, não lê de `grandes-eventos.json` diretamente — ver "Dívidas técnicas conhecidas" abaixo).
4. Sourcing de imagem: hero + 1 por momento + 1 por figura = 11-14 imagens por evento flagship. Se for gerar em lote via agentes paralelos, escrever as queries de busca ANTES de disparar os agentes (não confiar em transformação automática de dado — já aconteceu de um script de merge "perder" as queries de imagem por bug de transcrição).

## Como adicionar uma curiosidade nova

Mesma lógica do evento de Linha do Tempo, mas mais simples (sem `relatedEvents`, sem `momentos`). O valor está em escolher o TEMA propositalmente: curiosidades que conectam a eventos flagship que ainda não têm nenhuma (`curiosidadesRelacionadas: []` em algum lugar de `grandes-eventos.json`) valem mais do que curiosidades genéricas soltas.

---

## Dívidas técnicas conhecidas (não é bug, é trabalho futuro)

- **`app/grandes-eventos/page.tsx`** tem os 9 eventos flagship num array **hardcoded dentro do componente**, com campos meio redundantes com `grandes-eventos.json` (`year`, `title`, `description`, `impact`, `casualties`, `icon`, `image` escolhidos à mão). Seria melhor ler direto de `data/grandes-eventos.json` como as outras listagens fazem — não foi refatorado ainda porque os campos não batem 1:1 (`impact`/`casualties` não existem no JSON) e a tela tem textos curados à mão que não estão no JSON.
- **`app/linha-do-tempo/page.tsx`** tem um `EVENT_VISUALS` (ícone + cor por slug) **hardcoded no componente** — necessário porque JSON não pode guardar componentes React. Todo slug que não está nesse mapa cai no fallback `DEFAULT_VISUAL` (ícone de livro, cinza). Ao promover um evento a featured ou adicionar um flagship novo, vale adicionar a entrada aqui também por consistência visual (nem todo evento novo da Linha do Tempo "normal" precisa, só os que ficam em destaque).
- **`sources: []`** em 100% das entradas de `linha-do-tempo.json` — nenhuma curadoria de fontes/citações foi feita ainda. O campo existe no schema e é renderizado condicionalmente (`app/linha-do-tempo/[slug]/page.tsx`), só não tem dado.
- **Grandes Eventos não usa `findRelatedContent`** — só a lista manual `curiosidadesRelacionadas`. Ver seção acima.
- **`importance` (1-5)** existe no schema da Linha do Tempo mas não é usado em lugar nenhum da UI ainda (nem pra ordenar, nem pra destacar).

---

## Armadilhas já resolvidas nesta sessão (não repetir)

### Bug de layout: cards da Linha do Tempo sobrepondo o marcador central

O componente `Card` do shadcn usa `display: flex` internamente. Ao adicionar `inline-block` numa tentativa de permitir *shrink-to-fit* (pra alinhar cards à esquerda/direita da linha do tempo), o `CardHeader` interno usa **container queries** (`@container/card-header`), e um elemento com `container-type` é tratado como "vazio" pelo navegador ao calcular o tamanho intrínseco de um ancestral sem largura explícita — o card colapsava pra ~109px de largura. A correção **não foi** trocar `inline-block` por outra coisa (isso não resolveu sozinho) — foi dar ao Card uma **largura explícita** (`w-full max-w-md`) dentro de um wrapper `flex justify-end`/`justify-start`, eliminando a dependência de cálculo de largura intrínseca. Ver `app/linha-do-tempo/page.tsx`.

### Guardian (e outras fontes) com imagem genérica nas notícias

Não é sobre este arquivo, mas relacionado: `normalizeImageUrl()` em `lib/news.ts` e `lambda/src/process.ts` reescrevia `width/height/quality` de qualquer URL de imagem, invalidando assinaturas criptográficas de CDNs como `i.guim.co.uk` (Guardian). Fix: pular a reescrita quando a URL já tem parâmetro de assinatura (`s=`, `sig=`, `signature=`, `token=`). Ver `NOTICIAS-ARQUITETURA.md` — não documentado lá ainda, só neste arquivo.

### Busca de imagem no Wikimedia: `generator=search` erra mais que se pensa

Buscar por texto livre (`gsrsearch`) frequentemente retorna a página errada quando o termo é ambíguo (nomes de pessoas comuns, lugares com múltiplos artigos). Quando você já sabe o título exato do artigo da Wikipedia, usar `titles=<Título Exato>&redirects=1` é muito mais confiável. Rate limiting (HTTP 429) do Wikimedia é comum quando vários agentes buscam em paralelo — mitigar com `User-Agent` identificável e retry com backoff.

### AWS CLI "sumindo" do PATH no meio de uma sessão longa

Não é um bug real — o executável nunca esteve quebrado (`Test-Path`/invocação direta sempre funcionaram). O PATH do processo do terminal foi carregado antes de uma atualização do AWS CLI acontecer, e processos já abertos não recebem o PATH atualizado automaticamente no Windows. Se `aws` parar de resolver no meio de uma sessão, não reinstalar nada — só um terminal novo (ou `export PATH="$PATH:/c/Program Files/Amazon/AWSCLIV2"` no Bash / `$env:Path += ...` no PowerShell pra sessão atual) resolve.

### Autenticação Git: múltiplas contas no Git Credential Manager

O repositório de produção é `bynn3r/eventos-historicos` (confirmado via `aws amplify get-app` → campo `repository`). Se `git push` começar a falhar com 403 "Permission denied to <conta>", é porque o GCM (Git Credential Manager) trocou de conta em cache — rodar `printf "protocol=https\nhost=github.com\n" | git credential reject` limpa o cache, e então `git-credential-manager github login` (de dentro de um terminal interativo de verdade, não de dentro de uma automação — o GCM recusa prompt em contexto não-interativo) refaz o login. Se o fluxo de browser padrão falhar com erro de `127.0.0.1:PORTA` recusando conexão, forçar o modo device-code: `$env:GCM_GITHUB_AUTHMODES = "device"` antes do login.

---

## Deploy

Mesma pipeline do resto do site: `git push origin main` → Amplify detecta e builda automaticamente (não precisa de passo manual, ao contrário do Lambda de notícias). Para acompanhar:

```bash
aws amplify list-jobs --app-id d3f1wrnh921kl0 --branch-name main --region us-east-1 --profile eventos-historicos --max-items 1
aws amplify get-job --app-id d3f1wrnh921kl0 --branch-name main --job-id <N> --region us-east-1 --profile eventos-historicos
```

Build local antes de publicar sempre: `pnpm build` (pega erros de runtime/SSG) + `npx tsc --noEmit` (o build do Next NÃO falha em erro de tipo — `Skipping validation of types` no output — então rodar tsc separado é o único jeito de pegar isso antes do deploy).

---

## Pendências / próximos passos naturais

- [ ] Ligar Grandes Eventos ao `findRelatedContent` (hoje só usa lista manual de curiosidades)
- [ ] Fazer `app/grandes-eventos/page.tsx` ler de `data/grandes-eventos.json` em vez do array hardcoded
- [ ] Curar `sources` (hoje `[]` em todo mundo)
- [ ] Crescer a Linha do Tempo além de 29 (meta original do usuário: 50 → 100 → 500+, gradualmente)
- [ ] Considerar promover mais 2-3 eventos a flagship se fizer sentido (ex: algo de história antiga/medieval, já que os 9 atuais pesam pro lado moderno/contemporâneo)
- [ ] `importance` (1-5) existe mas não é usado em nenhuma ordenação/destaque da UI ainda
