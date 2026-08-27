# Migração: Vercel → AWS (Amplify + Route 53)

**Domínio:** eventoshistoricos.com.br  
**App:** Next.js 14 (App Router + SSR)  
**Data:** Junho 2026  

---

## Visão Geral da Arquitetura

### Antes (Vercel)
```
Usuário → Vercel Edge Network → Vercel Serverless Functions → Next.js App
DNS: Registro.br → Vercel IPs
```

### Depois (AWS)
```
Usuário → CloudFront (CDN) → AWS Lambda (SSR) → Next.js App
DNS: Registro.br nameservers → Route 53 → CloudFront → Amplify
```

---

## Por que cada serviço AWS?

| Serviço | Função | Equivalente Vercel |
|---------|--------|--------------------|
| **AWS Amplify Hosting** | Faz o build do Next.js, hospeda o app SSR | Vercel Hosting |
| **AWS Lambda** | Executa as rotas de servidor (API routes, SSR pages) | Vercel Serverless Functions |
| **Amazon CloudFront** | CDN global — cacheia assets estáticos, distribui conteúdo | Vercel Edge Network |
| **AWS Certificate Manager (ACM)** | Emite e renova o certificado SSL/TLS gratuitamente | Vercel gerenciava automaticamente |
| **Amazon Route 53** | DNS gerenciado — resolve `eventoshistoricos.com.br` para o CloudFront | DNS do Registro.br |

---

## Fase 1 — Remoção das Dependências Vercel

O código tinha integrações específicas da Vercel que precisavam ser removidas antes de hospedar em outro lugar.

### O que foi removido

**`eventos-historicos/app/layout.tsx`**
```tsx
// REMOVIDO:
import { Analytics } from "@vercel/analytics/next"
// REMOVIDO do JSX:
<Analytics />
```
O `@vercel/analytics` é um script proprietário da Vercel que injeta rastreamento de visitas. Fora da Vercel, ele não funciona.

**`eventos-historicos/package.json`**
```json
// REMOVIDO das dependências:
"@vercel/analytics": "latest"
```

**`eventos-historicos/app/api/rss/route.ts`**
```ts
// REMOVIDO:
export const runtime = "edge"
```
`runtime = "edge"` instrui a Vercel a executar essa rota no Edge Runtime (V8 isolates). Na AWS, as funções rodam em Lambda (Node.js), então essa diretiva causaria erro de build.

---

## Fase 2 — Configuração do AWS Amplify

### Como o Amplify funciona

O Amplify Hosting tem dois modos:
- **Static (S3):** para sites estáticos sem servidor
- **WEB_COMPUTE (SSR):** para Next.js com rotas de servidor — o que usamos

Quando você faz push para o GitHub, o Amplify:
1. Clona o repositório
2. Executa o build (`pnpm build`)
3. Empacota o resultado em funções Lambda
4. Distribui via CloudFront

### Problema do Monorepo

O repositório tem esta estrutura:
```
eventos-historicos/          ← raiz do repositório (GitHub)
└── eventos-historicos/      ← onde fica o app Next.js
    ├── app/
    ├── package.json
    └── ...
```

O Amplify por padrão procura o `package.json` na raiz do repositório. Como o app está numa subpasta, foi necessário:

**1. Criar `amplify.yml` na raiz do repositório**
```yaml
version: 1
applications:
  - appRoot: eventos-historicos   # diz ao Amplify onde está o app
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - export npm_config_min_pkg_age=0
            - pnpm install --no-frozen-lockfile
        build:
          commands:
            - pnpm build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

**2. Criar `package.json` na raiz do repositório**
```json
{
  "name": "eventos-historicos-monorepo",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "next": "14.2.16"
  }
}
```
O Amplify verifica se existe `next` no `package.json` da raiz antes de ler o `amplify.yml`. Sem isso, ele recusa o build.

### Problema do pnpm v10 (supply-chain policy)

O pnpm v10 introduziu uma política de segurança que bloqueia pacotes publicados há menos de X horas. Dois pacotes no lockfile tinham sido publicados no mesmo dia do build:
- `autoprefixer@10.5.1`
- `electron-to-chromium@1.5.377`

A solução foi setar a variável de ambiente antes do install no `amplify.yml`:
```yaml
- export npm_config_min_pkg_age=0   # desativa o bloqueio de pacotes novos
- pnpm install --no-frozen-lockfile  # permite atualizar o lockfile durante o build
```

### Variáveis de Ambiente no Amplify

Configuradas em **App settings → Environment variables**:
```
OPENAI_API_KEY=sk-...
OPENAI_EDITORIAL_MODEL=gpt-4o-mini
```
Nunca ficam no código — o Amplify injeta na hora do build/runtime.

---

## Fase 3 — DNS com Route 53

### Como o DNS funciona (resumo)

Quando alguém digita `eventoshistoricos.com.br` no navegador:
1. O navegador pergunta: "quem é responsável por `.com.br`?"
2. O registro de `.com.br` (Registro.br) responde: "os nameservers são `ns-7.awsdns-00.com` etc."
3. O navegador pergunta ao Route 53: "qual é o IP de `eventoshistoricos.com.br`?"
4. O Route 53 responde com o endereço do CloudFront
5. O navegador conecta ao CloudFront, que entrega o site

### Por que não ficamos no DNS do Registro.br?

O Registro.br não suporta registro do tipo **ALIAS** (também chamado ANAME). 

O problema: o domínio raiz (`eventoshistoricos.com.br` sem o `www`) não pode tecnicamente usar CNAME pelo padrão DNS (RFC 1912). Ele precisa de um registro A (IP) ou ALIAS (que funciona como CNAME mas é permitido na raiz).

O Route 53 suporta **Alias Record** nativo para CloudFront, resolvendo isso.

### Registros criados no Route 53

| Tipo | Nome | Valor | Criado por | Função |
|------|------|-------|-----------|--------|
| A (Alias) | `eventoshistoricos.com.br` | `d36mww6q6jyazw.cloudfront.net` | Nós | Domínio raiz → CloudFront |
| CNAME | `www.eventoshistoricos.com.br` | `d36mww6q6jyazw.cloudfront.net` | Nós | www → CloudFront |
| CNAME | `_cda29af409b2e7f184d3f8457638daed...` | `_1d0f36993fd3c6dc174aaf03bcac6418...acm-validations.aws` | Nós | Validação do certificado SSL |
| NS | `eventoshistoricos.com.br` | 4 nameservers AWS | Route 53 (automático) | Informa quem resolve o DNS |
| SOA | `eventoshistoricos.com.br` | ns-1230.awsdns-25.org... | Route 53 (automático) | Registro administrativo padrão |

### Nameservers configurados no Registro.br

```
ns-7.awsdns-00.com
ns-913.awsdns-50.net
ns-1230.awsdns-25.org
ns-1595.awsdns-07.co.uk
```

### Certificado SSL

O AWS Certificate Manager (ACM) emite o certificado automaticamente. Para provar que você é dono do domínio, a AWS pede que você crie um registro CNAME específico (o `_cda29af...`). Quando o Route 53 responde com esse registro, o ACM emite o certificado e o Amplify o ativa no CloudFront.

---

## Fluxo Completo de uma Requisição

```
Usuário acessa eventoshistoricos.com.br
         ↓
Registro.br: "os nameservers são os da AWS"
         ↓
Route 53: resolve para d36mww6q6jyazw.cloudfront.net
         ↓
CloudFront (CDN global):
  - Se for asset estático (JS, CSS, imagem): entrega do cache
  - Se for página SSR ou API route: repassa para Lambda
         ↓
AWS Lambda executa o Next.js
  - Busca notícias (RSS feeds)
  - Chama OpenAI API (traduções, análises editoriais)
  - Renderiza o HTML
         ↓
Resposta volta pelo CloudFront → Usuário
```

---

## Custos Estimados

| Serviço | Free Tier | Custo após free tier |
|---------|-----------|----------------------|
| Amplify Hosting (build) | 1.000 min/mês | $0,01/min |
| Amplify Hosting (SSR requests) | 500.000 req/mês | $0,00002/req |
| CloudFront (data transfer) | 1 TB/mês | $0,0085/GB |
| Route 53 (hosted zone) | - | $0,50/mês por zona |
| Route 53 (queries) | 1M queries/mês | $0,40/milhão |
| ACM (certificado SSL) | Gratuito sempre | Gratuito |

**Para tráfego baixo/médio:** ~$0,50/mês (só o Route 53)

---

## IDs dos Recursos AWS

```
Amplify App ID:     d3f1wrnh921kl0
CloudFront Domain:  d36mww6q6jyazw.cloudfront.net
Route 53 Zone ID:   Z0956151292B1FVYZAG6Z
Região:             us-east-1
```

---

## Próximos Passos Sugeridos

- [ ] Configurar alertas de custo na AWS (billing alarm)
- [ ] Adicionar variáveis de ambiente de produção restantes
- [ ] Remover o projeto da Vercel após confirmar que o domínio está funcionando na AWS
- [ ] Configurar monitoramento (AWS CloudWatch) para erros Lambda
