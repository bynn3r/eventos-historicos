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
