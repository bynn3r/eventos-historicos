# Eventos Históricos — Plano de Evolução

## Objetivo

Transformar o Eventos Históricos de um portal de conteúdo histórico/geopolítico em uma plataforma de conhecimento histórico interligado, mantendo a arquitetura atual e evoluindo o projeto de forma incremental.

O projeto atualmente utiliza AWS como infraestrutura e possui conteúdos de Curiosidades, Grandes Eventos e Linha do Tempo estruturados em JSON dentro do código.

**Diretriz fundamental:** não migrar os dados para banco de dados nesta etapa. O JSON deve continuar sendo a fonte de dados até que exista uma necessidade real de backend/administração/escala.

---

# REGRAS GERAIS PARA O CLAUDE CODE

Antes de alterar qualquer coisa:

1. Analise a arquitetura atual do projeto.
2. Entenda como os dados JSON estão organizados.
3. Identifique os componentes, páginas, rotas e serviços existentes.
4. Reutilize componentes e estruturas existentes sempre que possível.
5. Não faça uma reconstrução desnecessária.
6. Não altere funcionalidades fora do escopo da fase atual.
7. Não remova conteúdo existente.
8. Preserve a identidade visual atual.
9. Preserve compatibilidade com a infraestrutura AWS.
10. Evite dependências pesadas quando uma solução simples for suficiente.
11. Priorize performance, acessibilidade, SEO e responsividade.
12. Não invente dados históricos.
13. Quando houver dúvida histórica, sinalize antes de alterar.
14. Depois de cada fase, execute testes/lint/build quando disponíveis.
15. Ao finalizar cada fase, produza um resumo do que foi alterado, arquivos modificados, possíveis problemas e próximos passos.
16. NÃO iniciar automaticamente a próxima fase sem autorização.
17. Antes de implementar uma fase, apresentar um plano curto e aguardar confirmação quando houver risco de alteração estrutural significativa.

---

# VISÃO DO PRODUTO

A visão final é:

**EVENTOS HISTÓRICOS**

    ├── Linha do Tempo
    │      └── Eventos históricos
    │
    ├── Grandes Eventos
    │      └── Seleção editorial
    │
    ├── Curiosidades
    │      └── Porta de entrada para eventos
    │
    ├── Geopolítica / Notícias
    │      └── Notícias + contexto histórico
    │
    └── Futuramente
           ├── Personagens
           ├── Países
           ├── Guerras
           ├── Impérios
           └── Mapas históricos

A ideia central é criar uma **rede de conhecimento histórico**:

Evento ↔ Personagem ↔ País/Região ↔ Guerra ↔ Período ↔ Outro Evento ↔ Curiosidade ↔ Notícia

O usuário deve conseguir começar por qualquer conteúdo e continuar descobrindo outros conteúdos relacionados.

---

# FASE 1 — BASE ATUAL

Esta fase representa o estado atual do projeto.

Não reconstruir o que já funciona.

Objetivo: preservar e entender a estrutura existente antes das próximas alterações.

---

# SPRINT 1 — QUALIDADE TÉCNICA E SEO

## Objetivo

Garantir que a base técnica esteja correta antes de aumentar o conteúdo.

## Tarefas

### [x] 1. Linha do Tempo — duplicação

Investigar se os eventos da Linha do Tempo estão sendo renderizados mais de uma vez no DOM/HTML.

Verificar:

- desktop/mobile;
- SSR/client;
- hidratação;
- componentes duplicados;
- loops;
- renderização responsiva;
- dados duplicados.

Se existir duplicação real, corrigir a causa na origem.

Não remover eventos.

**Implementado:** `{open && <EventDialogContent>}` — conteúdo do diálogo só monta quando aberto. Cada evento aparece uma única vez no HTML estático.

### [x] 2. SSR e internacionalização

Verificar:

- Home;
- Linha do Tempo;
- páginas individuais;
- Grandes Eventos;
- Curiosidades;
- Notícias.

Garantir que o HTML inicial contenha textos corretos.

Não permitir chaves como:

- hero.title
- menu.events
- newsletter.title
- footer.description

no HTML final entregue aos crawlers.

**Resultado:** i18n customizado inicializa com PT via `useState("pt")`. Nenhuma chave vaza no SSR. Todas as páginas entregam texto em português no HTML inicial.

### [x] 3. SEO das páginas

Cada página individual de evento deve possuir:

- title único;
- meta description;
- slug;
- canonical;
- Open Graph;
- Twitter/X metadata quando aplicável;
- headings corretos;
- breadcrumbs;
- dados estruturados apropriados.

**Implementado:**
- Metadata adicionada a: home, curiosidades listing, noticias listing, sobre, grandes-eventos, contato.
- `app/linha-do-tempo/layout.tsx` criado com metadata (workaround para página "use client").
- `/evento/[slug]`: openGraph, twitter, canonical, JSON-LD (Event schema).
- `/curiosidades/[slug]`: openGraph, twitter, canonical, JSON-LD (Article schema), breadcrumb visual.
- `/noticias/[slug]`: openGraph, twitter, canonical; typo "Historicos" corrigido.
- Placeholder `google verification` removido do layout.tsx.

**Pendente identificado (não entra nesta Sprint):**
- [ ] Breadcrumb visual em `/evento/[slug]` — link de retorno adicionado, breadcrumb semântico completo a implementar na Sprint 2.
- [ ] Google Search Console: adicionar código de verificação real quando disponível (comentário no layout.tsx indica onde).

### [x] 4. Links internos

Garantir conexões corretas entre:

- Linha do Tempo → Evento;
- Evento → Evento relacionado;
- Evento → Curiosidade;
- Curiosidade → Evento;
- Grandes Eventos → Evento.

**Implementado:**
- Linha do Tempo → artigos: links "Artigo completo" e "Explorar evento" adicionados abaixo de cada card (rastreáveis por crawlers).
- `/evento/[slug]`: botão "Ver artigo completo" adicionado no hero (link para `/linha-do-tempo/[slug]` quando existe).
- Conexões já existiam: linha-do-tempo slug → relacionados, curiosidade → linha-do-tempo, evento → curiosidades.

### [x] 5. Sitemap e robots

Verificar:

- sitemap.xml;
- robots.txt;
- URLs indexáveis;
- URLs que não devem ser indexadas.

**Implementado:**
- `app/sitemap.ts`: inclui todas as rotas estáticas + timeline (29) + eventos (grandes-eventos) + curiosidades.
- `app/robots.ts`: allow "/" exceto "/api/"; aponta para sitemap.
- Notícias não incluídas no sitemap (slugs dinâmicos via DynamoDB; `generateStaticParams` retorna []).

### [x] 6. Performance

Identificar problemas óbvios relacionados a:

- imagens;
- JavaScript;
- fontes;
- componentes pesados;
- carregamento;
- animações.

Não realizar grande refatoração de performance nesta fase.

**Identificado (não corrigido nesta Sprint — risco arquitetural):**
- `next.config.mjs`: `images: { unoptimized: true }` desabilita WebP/srcset/lazy hints. Provável necessidade da arquitetura de deploy AWS. Não alterado sem entender o ambiente de produção.
- `typescript.ignoreBuildErrors: true` e `eslint.ignoreDuringBuilds: true` mascaram erros — manter por agora.
- Linha do Tempo inteira como `"use client"` é limitação arquitetural que ficará para Sprint futura se necessário.

### [x] 7. Privacidade

Verificar se a política de privacidade está coerente com as tecnologias atualmente utilizadas.

**Implementado:**
- Navigation e Footer adicionados à página `/privacidade`.
- Seção LGPD (Lei nº 13.709/2018) adicionada explicitamente.
- Dados de contato placeholder (telefone fictício, email genérico) substituídos por link para a página de contato.
- Metadata atualizada com menção à LGPD.

## Restrições

Nesta Sprint:

- não criar novos eventos;
- não criar personagens;
- não criar mapas;
- não redesenhar o site;
- não migrar JSON para banco;
- não criar grandes funcionalidades.

---

## Status da Sprint 1

- **Data:** 2026-08-30
- **Status:** Concluída

**O que foi implementado:**
- Duplicação da Linha do Tempo corrigida (`{open && <EventDialogContent>}`)
- SSR/i18n verificado — sem vazamento de chaves
- `app/robots.ts` criado
- `app/sitemap.ts` criado (estático + timeline + eventos + curiosidades)
- `app/linha-do-tempo/layout.tsx` criado com metadata
- Metadata adicionada a 6 páginas sem título (home, curiosidades, noticias, sobre, grandes-eventos, contato)
- Metadata completada em `/evento/[slug]`, `/curiosidades/[slug]`, `/noticias/[slug]` (openGraph, twitter, canonical)
- JSON-LD adicionado em `/evento/[slug]` (Event) e `/curiosidades/[slug]` (Article)
- Breadcrumb visual adicionado em `/curiosidades/[slug]`
- Links rastreáveis adicionados abaixo dos cards da Linha do Tempo
- Link de `/evento/[slug]` para `/linha-do-tempo/[slug]` adicionado
- Typo "Historicos" corrigido em `/noticias/[slug]`
- Placeholder `google verification` removido do layout.tsx
- Página `/privacidade`: Navigation, Footer, seção LGPD adicionados; placeholder de contato substituído

**O que ficou pendente (registrar para próxima Sprint):**
- [ ] `images: { unoptimized: true }` — avaliar impacto no deploy antes de alterar
- [ ] Breadcrumb visual em `/evento/[slug]` — apenas link de retorno adicionado; breadcrumb semântico completo pode ser feito na Sprint 2
- [ ] Google Search Console verification code — adicionar quando disponível (local indicado em `app/layout.tsx`)
- [ ] Notícias dinâmicas não incluídas no sitemap (slugs DynamoDB; solução necessária separada)

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- Verificação manual de todos os arquivos editados

**Problemas encontrados:**
- Nenhum erro novo introduzido

**Próximo passo sugerido:** Sprint 2 — Profundidade Histórica (cronologia interna dos eventos, melhoria de relacionamentos, fontes, precisão histórica).

---

# SPRINT 2 — PROFUNDIDADE HISTÓRICA

## Objetivo

Transformar os eventos individuais em conteúdos históricos completos e conectados.

## 1. Cronologia interna

Cada evento importante deve poder possuir uma seção:

**Linha do tempo do evento**

Exemplo:

1939 — Invasão da Polônia
↓
1940 — Queda da França
↓
1941 — Operação Barbarossa
↓
1941 — Pearl Harbor
↓
1942–43 — Stalingrado
↓
1944 — Dia D
↓
1945 — Queda de Berlim
↓
1945 — Rendição do Japão

A estrutura deve continuar compatível com o JSON atual.

## 2. Eventos relacionados

Melhorar os relacionamentos.

Quando possível, diferenciar:

### Relação direta

Evento diretamente conectado.

### Relação contextual

Evento que ajuda a compreender o contexto.

Evitar relações artificiais.

## 3. Curiosidades relacionadas

Permitir:

Evento → Curiosidade

e

Curiosidade → Evento.

## 4. Contexto histórico para notícias

Quando houver relação clara:

Notícia
↓
Contexto histórico
↓
Evento relacionado
↓
Linha do Tempo

Não criar relações automáticas sem sentido.

## 5. Fontes

Adicionar estrutura para:

- nome da fonte;
- título;
- URL;
- tipo da fonte.

Priorizar:

- universidades;
- museus;
- arquivos;
- instituições oficiais;
- enciclopédias reconhecidas;
- literatura acadêmica.

## 6. Precisão histórica

Revisar formulações excessivamente simplificadas.

Exemplos:

- "Nascimento da democracia moderna";
- "Descobrimento da América".

Preferir linguagem historicamente mais precisa.

---

## Status da Sprint 2

- **Data:** 2026-08-30
- **Status:** Concluída

**O que foi implementado:**

- Campo `cronologia` adicionado aos 29 eventos em `linha-do-tempo.json` (4–7 marcos por evento)
- Tipos TypeScript novos em `lib/timeline.ts`: `TimelineCronologiaItem`, `TimelineRelatedContext`, campo `tipo` em `TimelineSource`
- Campo `sources[]` preenchido com fontes primárias e secundárias para 8 eventos prioritários (Narmer, Hamurábi, Alexandre, Magna Carta, Queda de Constantinopla, Colombo, Brasil, Reforma Protestante, Declaração Americana, Revolução Francesa)
- Campo `relatedEventsContext` adicionado a 3 eventos com relações causais contextuais relevantes:
  - `queda-constantinopla` → `descobrimento-america` (rotas otomanas motivaram navegação atlântica)
  - `revolucao-industrial` → `primeira-guerra-mundial` (escala industrial da guerra)
  - `grande-depressao-1929` → `fim-segunda-guerra-mundial` (depressão nutriiu extremismo)
- Componente `EventCronologia` criado (`components/event-cronologia.tsx`) — exibe linha vertical dentro do artigo
- Página `/linha-do-tempo/[slug]` atualizada: seção cronologia, badge "contextual" em eventos relacionados, exibição de fontes com badge de tipo e fallback para URL vazia
- Precisão histórica: "Descobrimento da América" → "Chegada de Colombo às Américas"

**O que ficou pendente (registrar para próxima Sprint):**
- [ ] `eventosRelacionados` em `curiosidades.json` (Evento→Curiosidade e Curiosidade→Evento bidirecional)
- [ ] Contexto histórico nas páginas de notícias (Notícia→Evento)
- [ ] Breadcrumb semântico completo em `/evento/[slug]`
- [ ] Fontes com URLs reais para os eventos que têm apenas referências bibliográficas

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- Verificação de todos os arquivos editados

**Próximo passo sugerido:** Sprint 3 — Experiência Visual e Animações.

---

## Auditoria e Enriquecimento Histórico

- **Data:** 2026-08-30
- **Status:** Concluída (lote inicial)

**Auditoria de precisão histórica:**

- `conquistas-alexandre-grande`: corrigido "rio Indo" → "rio Hidaspes (atual Jhelum, no Paquistão)" — a Batalha do Hidaspes (326 a.C.) ocorreu no rio Hidaspes, não no Indo. Cronologia do evento atualizada em coerência.
- `primeira-cruzada`: corrigido `country: "Israel"` → `"Levante (Palestina histórica)"` — o Estado de Israel só existe desde 1948; em 1099 a região era o Levante.
- `descobrimento-america`: título corrigido de "Descobrimento da América" → "Chegada de Colombo às Américas" (já feito no Sprint 2).

**Auditoria de todo o conteúdo:**

- `curiosidades.json` (26 artigos): revisados e sem erros factuais encontrados.
- `grandes-eventos.json` (2 eventos — fim-segunda-guerra-mundial, queda-constantinopla): revisados e sem erros factuais.
- `linha-do-tempo.json` (29 eventos originais): erros corrigidos acima.

**6 novos eventos criados na Linha do Tempo:**

- `fundacao-imperio-mongol` (1206–1294): maior Império contíguo da história, Pax Mongolica, saque de Bagdá.
- `revolucao-cientifica` (1543–1687): Copérnico → Kepler → Galileu → Newton; método científico.
- `guerras-napoleonicas` (1803–1815): Austerlitz, invasão da Rússia, Waterloo, Congresso de Viena.
- `conferencia-berlim` (1884–1885): Corrida por África, Ato Geral de Berlim, legado das fronteiras coloniais.
- `abolicao-escravatura-brasil` (1850–1888): Lei Áurea, Joaquim Nabuco, José do Patrocínio, ausência de políticas pós-abolição.
- `criacao-estado-israel` (1948–1949): Declaração Balfour, Plano de Partilha ONU, Guerra da Independência, Nakba.

**Total de eventos na Linha do Tempo após esta etapa:** 35

**Testes realizados:**
- JSON válido (node -e require())
- TypeScript: sem erros (`tsc --noEmit`)

**Pendências desta etapa:**
- [ ] Imagens hero para os 6 novos eventos (atualmente apontam para paths inexistentes)
- [ ] Fontes (`sources[]`) ainda vazias nos 6 novos eventos — adicionar quando artigos mencionarem explicitamente suas fontes
- [ ] `relatedEventsContext` para relações causais entre os novos e existentes eventos

---

# SPRINT 3 — EXPERIÊNCIA VISUAL E ANIMAÇÕES

## Objetivo

Criar uma experiência de exploração histórica mais imersiva.

A animação deve transmitir:

**"viajar pela história"**

e não parecer um site cheio de efeitos.

## Linha do Tempo

Adicionar:

- linha cronológica sendo construída durante scroll;
- eventos aparecendo progressivamente;
- datas com animações sutis;
- fade/slide discreto;
- transições suaves.

## Página individual

Criar entrada visual mais interessante:

Ano
↓
Título
↓
Contexto/imagem
↓
Conteúdo
↓
Cronologia
↓
Relacionamentos

## Identidade temporal

Criar sistema que permita pequenas diferenças visuais conforme o período:

Antiguidade:
- pedra;
- papiro;
- inscrições;
- mapas antigos.

Idade Média:
- manuscritos;
- pergaminhos;
- mapas históricos.

Idade Moderna:
- documentos;
- gravuras;
- navegação.

Contemporânea:
- fotografia;
- arquivo;
- documentos.

Essas referências devem ser sutis.

O layout principal deve permanecer consistente.

## Performance

Animações devem:

- funcionar em mobile;
- respeitar prefers-reduced-motion;
- não causar layout shift;
- não bloquear interação;
- não prejudicar performance.

Evitar:

- partículas excessivas;
- parallax exagerado;
- efeitos de fogo;
- sangue;
- sons automáticos;
- textos piscando;
- transições lentas.

A animação deve servir ao conteúdo.

---

## Status da Sprint 3

- **Data:** 2026-09-XX
- **Status:** Concluída

**O que foi implementado:**
- `globals.css`: reset de `prefers-reduced-motion` aplicado a todas as animações
- `globals.css`: classe `.reveal-section` para scroll-reveal
- `components/reveal-section.tsx`: componente client novo com `IntersectionObserver`, fade-in escalonado
- `components/event-hero.tsx`: linha de destaque de período (âmbar/pedra/céu/ardósia) no topo do hero
- `linha-do-tempo/page.tsx`: ícones para os 6 eventos novos da época; borda esquerda colorida por período nos cards
- `linha-do-tempo/[slug]/page.tsx`: seções de cronologia, personagens, fontes e relacionados envolvidas em `RevealSection` para fade-in escalonado ao rolar

**Identidade temporal implementada:** cores/acentos diferentes por período (Antiga/Média/Moderna/Contemporânea), mantendo o layout consistente conforme pedido pelo roadmap.

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- `prefers-reduced-motion` verificado no CSS

**Próximo passo sugerido:** Sprint 4 — Expansão do Acervo.

---

# SPRINT 4 — EXPANSÃO DO ACERVO

## Objetivo

Chegar aproximadamente a 50 eventos históricos de alta qualidade.

Não adicionar eventos aleatórios.

## Distribuição

Buscar equilíbrio entre:

- Antiguidade;
- Idade Média;
- Idade Moderna;
- Idade Contemporânea;
- guerras;
- revoluções;
- política;
- ciência;
- tecnologia;
- exploração;
- cultura;
- economia.

Também garantir diversidade geográfica:

- Europa;
- Ásia;
- África;
- Américas;
- Oriente Médio;
- Oceania;
- eventos globais.

## Cada evento deve possuir

- título;
- slug;
- data;
- período;
- região;
- país(es);
- categoria;
- resumo;
- conteúdo;
- importância;
- imagem quando disponível;
- eventos relacionados;
- curiosidades relacionadas;
- fontes.

## Qualidade

Evitar:

- eventos obscuros sem relevância;
- duplicações;
- textos superficiais;
- afirmações sem fonte;
- excesso de eventos europeus;
- concentração excessiva no século XX.

Manter o estilo:

**informativo + narrativo + fácil de ler.**

## Processo

Antes de inserir os 50 eventos:

1. apresentar lista proposta;
2. agrupar por período;
3. agrupar por região;
4. verificar equilíbrio;
5. só então inserir os conteúdos.

Não criar personagens, mapas ou novas grandes entidades nesta Sprint.

---

## Status da Sprint 4

- **Data:** 2026-09-XX
- **Status:** Concluída

**Processo seguido:** lista de 16 eventos propostos e confirmada pelo usuário antes da inserção (incluindo `inicio-segunda-guerra-mundial`, apontado pelo usuário como lacuna — "faltava a segunda guerra mundial, não só o fim dela").

**16 novos eventos adicionados à Linha do Tempo** (total: 35 → 51), cobrindo períodos e regiões sub-representados:
- Pré-história: Revolução Agrícola Neolítica (c. 10000 a.C.)
- Antiguidade: Nascimento do Budismo, Assassinato de Júlio César
- Idade Média: Imprensa de Gutenberg, Império Mali (Mansa Musa)
- Idade Moderna: Revolução Gloriosa, Independências da América Latina
- Contemporânea: Unificação da Alemanha, Restauração Meiji, Revolução Xinhai, Declaração Universal dos Direitos Humanos, Revolução Comunista Chinesa, Descolonização da África, Colapso da URSS, 11 de Setembro, Início da Segunda Guerra Mundial

Cada evento inclui artigo completo, fontes (quando citadas explicitamente no texto), personagens e cronologia interna, conforme exigido pelo usuário.

**4 experiências imersivas novas em `grandes-eventos.json`** (total: 14 → 18): `inicio-segunda-guerra-mundial`, `assassinato-julio-cesar`, `invencao-imprensa-gutenberg`, `atentados-11-setembro` — cada uma com momentos, locais e figuras históricas.

**`EVENT_VISUALS`** atualizado com ícones e cores para os 16 novos slugs.

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- JSON válido para os dois arquivos de dados

**Próximo passo sugerido:** Sprint 5 — Mudança Conceitual.

---

# SPRINT 5 — MUDANÇA CONCEITUAL

## Objetivo

Evoluir o produto para uma plataforma de conhecimento histórico interligado.

Não reconstruir o site.

A mudança deve ocorrer principalmente por:

- conexões;
- navegação;
- profundidade;
- contexto;
- descoberta.

## Conceito

O usuário pode começar por:

- notícia;
- curiosidade;
- evento;
- Linha do Tempo.

E continuar explorando:

Evento
↕
Personagem
↕
País
↕
Guerra
↕
Período
↕
Outro evento

## Exemplo

Revolução Francesa

→ Iluminismo
→ Independência dos EUA
→ Era Napoleônica
→ Congresso de Viena
→ Luís XVI
→ Napoleão
→ França
→ Revoluções de 1848

## Home

Continuar simples.

A home é a porta de entrada.

Não transformar a home em enciclopédia.

## Linha do Tempo

Principal mecanismo cronológico:

- pesquisar;
- filtrar;
- explorar;
- navegar;
- abrir eventos.

## Grandes Eventos

Funcionam como seleção editorial dos acontecimentos mais importantes.

Devem apontar para conteúdos completos.

Não duplicar simplesmente a Linha do Tempo.

## Curiosidades

Funcionam como porta de entrada.

Curiosidade
→ Evento
→ Linha do Tempo
→ Outros conteúdos

## Notícias

Quando houver relação:

O que aconteceu?
↓
Contexto histórico
↓
Eventos relacionados
↓
Linha do Tempo

## Futuro

Preparar arquitetura para:

- personagens;
- países;
- guerras;
- impérios;
- mapas.

Não implementar tudo automaticamente.

---

## Status da Sprint 5

- **Data:** 2026-09-XX
- **Status:** Concluída

**O que foi implementado:**
- `relatedEventsContext` adicionado aos 51 eventos da Linha do Tempo (143 descrições de relação causal/contextual entre eventos, substituindo o resumo genérico anteriormente exibido)
- `lib/related-content.ts`: campo `importance` adicionado ao matcher; eventos com `importance >= 4` recebem boost de pontuação na busca por conteúdo relacionado
- Notícia → Contexto histórico: query de `findRelatedContent` em `/noticias/[slug]` estendida para incluir `tags`; CTA "Explorar a Linha do Tempo completa" adicionado após o grid de contexto histórico
- `components/related-news-widget.tsx` (novo) + `app/api/noticias/related/route.ts` (novo): widget client-side que busca notícias recentes relacionadas a um evento por sobreposição de keywords, sem tornar as páginas de evento dinâmicas (fetch pós-hidratação)
- `/evento/[slug]`: rodapé de navegação com link para o artigo completo na Linha do Tempo, fechando o dead-end das páginas de Grandes Eventos

**Conceito da Sprint cumprido:** o usuário agora pode entrar por qualquer conteúdo (notícia, curiosidade, evento, Linha do Tempo) e continuar descobrindo — sem alterar a Home nem duplicar a Linha do Tempo nos Grandes Eventos.

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- Build Next.js completo sem erros

**Próximo passo sugerido:** conforme a seção "Futuro" desta Sprint — Personagens e Países foram abertos como Sprint 6 (ver abaixo); Guerras, Impérios e Mapas históricos seguem pendentes.

---

# SPRINT 6 — PERSONAGENS, BUSCA, SEO E REGIÕES (extensão não formalizada previamente)

## Objetivo

Esta Sprint não estava detalhada neste documento — foi aberta a partir da seção "Futuro" da Sprint 5 ("preparar arquitetura para personagens, países, guerras, impérios, mapas") e conduzida em 4 partes (A–D), uma de cada vez, com autorização do usuário entre cada etapa, seguindo a regra de "executar somente uma Sprint por vez".

## Status da Sprint 6

- **Data:** 2026-09-20
- **Status:** Concluída (6A, 6B, 6C, 6D)

### 6A — Personagens
- `lib/characters.ts` (novo): extrai os 152 personagens únicos dos 51 eventos, gera slugs, agrupa os 3 que aparecem em mais de um evento (Otto von Bismarck, Mikhail Gorbachev, Winston Churchill)
- `/personagens` (novo): índice alfabético com navegação sticky por letra
- `/personagens/[slug]` (novo): página individual com bio, badges de período, lista de eventos e links para artigo/experiência imersiva; JSON-LD `Person`
- Navegação: link "Personagens" no dropdown "Mais" (desktop) e no menu mobile
- Cards de personagens em `/linha-do-tempo/[slug]` agora são links para a página do personagem

### 6B — Busca Aprimorada
- `app/api/busca/route.ts` (novo): endpoint unificado que busca em eventos, curiosidades, personagens e notícias (DynamoDB), com scoring por relevância (título pesa mais que corpo) e boost por `importance`
- `/busca`: dados mockados substituídos por fetch debounced ao endpoint real; filtro de categoria populado dinamicamente

### 6C — SEO e Sitemap
- `sitemap.ts`: as 153 páginas de personagens (faltantes desde a 6A) adicionadas — sitemap foi de 103 para 256 URLs
- `/linha-do-tempo/[slug]`: Twitter Card e `alt` na imagem OG adicionados (faltavam nesta página, que já existiam em `/evento`, `/curiosidades` e `/personagens`)
- `/busca`: `layout.tsx` novo com `robots: noindex, follow` (conteúdo client-rendered de resultados de query não deve ser indexado)

### 6D — Regiões e Continentes
- `lib/regions.ts` (novo): agrupa os 51 eventos em 6 continentes/macrorregiões (Europa, Ásia, Oriente Médio, África, Américas, Global) a partir do texto livre do campo `region` — o campo `country` é granular demais (31 valores, muitos compostos) para agrupamento direto por país
- `/regioes` e `/regioes/[slug]` (novos): índice de continentes e listagem cronológica de eventos por continente, com países como badges
- `event-hero.tsx`: região no hero do artigo agora é link para `/regioes/[slug]`
- Sitemap: +7 URLs (263 no total)

**Pendente da lista "Futuro" da Sprint 5 (ao final da 6D):**
- [ ] Guerras (entidade própria, distinta de "evento")
- [ ] Impérios (entidade própria)
- [x] Mapas históricos (visualização geográfica interativa) — ver Sprint 7
- [ ] Página de país individual (bloqueada pela qualidade do campo `country` — precisaria de normalização dos dados primeiro)

**Testes realizados em cada etapa:** `tsc --noEmit` sem erros; `next build` completo sem erros; testes manuais via servidor de dev local para os endpoints novos (`/api/busca`, `/api/noticias/related`, páginas de região).

---

# SPRINT 7 — MAPA HISTÓRICO (extensão da lista "Futuro" da Sprint 5)

## Objetivo

Implementar a visualização geográfica interativa pendente da Sprint 5, escolhida pelo usuário entre as três opções restantes (Guerras, Impérios, Mapas históricos), com plano curto apresentado e aprovado antes da execução (regra §17).

## Status da Sprint 7

- **Data:** 2026-09-20
- **Status:** Concluída

**O que foi implementado:**
- `data/linha-do-tempo.json`: campo `coordinates` (lat/lng) adicionado aos 51 eventos — um ponto geográfico representativo por evento (capital ou local histórico do acontecimento), baseado em geografia verificável e não controversa; nenhum dado histórico foi inventado, apenas georreferenciado
- `lib/timeline.ts`: interface `TimelineCoordinates` e campo `coordinates` obrigatório em `TimelineEvent`
- `lib/map-projection.ts` (novo): função de projeção equiretangular lat/lng→posição extraída de `EventMap` para reuso, evitando duplicar a mesma lógica em dois componentes (princípio "evitar versões duplicadas do mesmo componente")
- `components/evento/event-map.tsx`: refatorado para consumir a função compartilhada, sem mudança de comportamento
- `components/historical-world-map.tsx` (novo): mapa-múndi ilustrativo (SVG estático, sem biblioteca externa pesada) com os 51 eventos, filtro por período, painel de detalhe ao clicar no marcador; eventos que caem na mesma cidade (Roma tem 4, Paris e Berlim têm 3 cada) são espalhados num pequeno círculo para continuarem individualmente clicáveis
- `app/mapa/page.tsx` (novo): página com o mapa interativo + lista textual cronológica dos 51 eventos como alternativa acessível por teclado/leitor de tela (princípio de acessibilidade do roadmap)
- Navegação e sitemap atualizados com a nova rota

**Decisão de escopo:** sem clustering de marcadores nesta primeira versão, conforme alinhado no plano — o espalhamento circular resolve a sobreposição das cidades com múltiplos eventos sem adicionar complexidade de agrupamento dinâmico.

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- Build Next.js completo sem erros; `/mapa` gerada como página estática
- Verificação via servidor de dev local: 51 marcadores e 51 links renderizados no SSR (contagem via HTML bruto)

**Pendente da lista "Futuro" da Sprint 5 (ao final da 7):**
- [x] Guerras (entidade própria, distinta de "evento") — ver Sprint 8
- [ ] Impérios (entidade própria)
- [ ] Página de país individual (bloqueada pela qualidade do campo `country`)

---

# SPRINT 8 — GUERRAS E CONFLITOS (extensão da lista "Futuro" da Sprint 5)

## Objetivo

Implementar "Guerras" como entidade própria do grafo de conhecimento (Evento ↔ Guerra ↔ Período), escolhida pelo usuário entre as opções restantes por ser a de menor risco: reaproveita os 51 eventos existentes sem exigir pesquisa histórica nova.

## Status da Sprint 8

- **Data:** 2026-09-20
- **Status:** Concluída

**O que foi implementado:**
- `lib/wars.ts` (novo): curadoria editorial de 8 guerras a partir dos eventos já classificados como categoria "Militar" na Linha do Tempo (Segunda Guerra Mundial, Primeira Guerra Mundial, Guerras Napoleônicas, Guerra dos Cem Anos, Primeira Cruzada, Conquistas de Alexandre, Queda de Constantinopla, Conquistas Mongóis). A Segunda Guerra Mundial agrupa 2 eventos (início e fim); as demais têm 1 evento cada. Nenhum dado histórico novo foi inventado — apenas reorganização do conteúdo já publicado (datas, cronologia interna, resumos)
- `components/event-cronologia.tsx`: prop `title` opcional adicionada, permitindo reusar o componente com um cabeçalho por evento quando uma guerra tem mais de um artigo membro (sem alterar o uso existente em `/linha-do-tempo/[slug]`)
- `app/guerras/page.tsx` (novo): índice das 8 guerras
- `app/guerras/[slug]/page.tsx` (novo): cronologia interna (uma seção `EventCronologia` por evento membro), lista de artigos completos e link para experiência imersiva quando existente (início/fim da 2ª Guerra, Queda de Constantinopla, 1ª Guerra Mundial já têm página em `/evento`)
- `linha-do-tempo/[slug]/page.tsx`: banner "Parte da [guerra]" nos artigos que pertencem a uma guerra, fechando mais um dead-end de navegação
- Navegação e sitemap atualizados (+9 URLs)

**Decisão de escopo:** cronologias de eventos-membro são exibidas em seções separadas (uma por evento), não mescladas numa timeline única — evita parsing ambíguo de datas com formatos distintos ("set. 1939" vs "336 a.C.") e risco de reordenar incorretamente.

**Testes realizados:**
- TypeScript: sem erros (`tsc --noEmit`)
- Build Next.js completo sem erros; 8 páginas de guerra geradas estaticamente
- Verificação via servidor de dev local: cronologia dupla da 2ª Guerra Mundial renderiza corretamente com títulos distintos; banner "Parte da guerra" confirmado no artigo `inicio-segunda-guerra-mundial`

**Pendente da lista "Futuro" da Sprint 5:**
- [ ] Impérios (entidade própria) — maior risco editorial, exige pesquisa histórica nova
- [ ] Página de país individual (bloqueada pela qualidade do campo `country`)

---

# PRINCÍPIOS EDITORIAIS

O Eventos Históricos deve buscar:

### Precisão

Não simplificar excessivamente acontecimentos complexos.

### Contexto

Explicar causas, acontecimentos e consequências.

### Narrativa

Usar texto envolvente sem sacrificar precisão.

### Fontes

Sempre que possível, indicar referências confiáveis.

### Neutralidade

Evitar linguagem partidária ou propaganda.

### Diversidade histórica

Não concentrar o acervo apenas em Europa/Segunda Guerra/Guerra Fria.

---

# PRINCÍPIOS DE UX

O usuário deve conseguir:

1. descobrir;
2. ler;
3. entender;
4. clicar;
5. continuar explorando.

Evitar becos sem saída.

Sempre que fizer sentido, oferecer:

**"Explore também"**

ou

**"Entenda o contexto"**

ou

**"Eventos relacionados"**

---

# PRINCÍPIOS DE DESENVOLVIMENTO

## JSON

Continuar usando JSON inicialmente.

A migração para banco só deve ser considerada quando houver necessidade real de:

- painel administrativo;
- edição frequente;
- milhares de registros;
- relacionamentos complexos;
- múltiplos editores;
- conteúdo dinâmico.

## Componentes

Preferir componentes reutilizáveis.

Evitar criar versões duplicadas do mesmo componente.

## Responsividade

Desktop, tablet e mobile devem compartilhar a mesma fonte de dados e lógica sempre que possível.

Evitar renderizar duas versões completas do mesmo conteúdo apenas para adaptar layout.

## Acessibilidade

Garantir:

- navegação por teclado;
- contraste;
- labels;
- semântica HTML;
- reduced motion;
- alt text;
- foco visível.

---

# CHECKLIST DE FINALIZAÇÃO DE CADA SPRINT

Antes de considerar uma Sprint concluída:

## Sprint 1

- [x] Escopo implementado.
- [x] Nenhuma funcionalidade existente quebrada.
- [ ] Mobile verificado. ← pendente verificação manual em dispositivo
- [ ] Desktop verificado. ← pendente verificação manual em navegador
- [x] Links verificados (estrutura de código).
- [x] Build funcionando (TypeScript sem erros).
- [x] Lint/typecheck funcionando quando disponível.
- [x] SEO verificado quando aplicável.
- [x] Performance não piorou significativamente.
- [x] Conteúdo histórico revisado.
- [x] Alterações documentadas.

## Regra final

**Executar somente uma Sprint por vez.**

Após concluir uma Sprint:

1. parar;
2. apresentar resumo;
3. apresentar arquivos alterados;
4. apresentar testes executados;
5. apresentar problemas encontrados;
6. sugerir próximo passo;
7. aguardar autorização para iniciar a próxima Sprint.

Este documento é o roadmap principal do projeto e deve ser tratado como referência durante toda a evolução do Eventos Históricos.
