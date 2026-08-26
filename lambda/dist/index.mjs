// src/translate.ts
function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const runNext = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const run = queue.shift();
    run?.();
  };
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          active--;
          runNext();
        });
      });
      runNext();
    });
  };
}
var myMemoryLimit = createLimiter(3);
var googleLimit = createLimiter(8);
function splitIntoChunks(text, maxLen = 480) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= maxLen) {
      current = next;
    } else {
      if (current) chunks.push(current);
      current = sentence.length > maxLen ? sentence.slice(0, maxLen) : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
async function translateWithDeepL(text, apiKey) {
  const apiUrl = apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: "PT-BR" }),
    signal: AbortSignal.timeout(8e3)
  });
  if (!res.ok) return text;
  const data = await res.json();
  return data.translations?.[0]?.text || text;
}
async function translateChunkWithGoogle(chunk) {
  return googleLimit(async () => {
    try {
      const url = new URL("https://translate.googleapis.com/translate_a/single");
      url.searchParams.set("client", "gtx");
      url.searchParams.set("sl", "en");
      url.searchParams.set("tl", "pt");
      url.searchParams.set("dt", "t");
      url.searchParams.set("q", chunk);
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(3500),
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (!res.ok) return null;
      const data = await res.json();
      const segments = Array.isArray(data) ? data[0] : null;
      if (!Array.isArray(segments) || segments.length === 0) return null;
      return segments.map((s) => Array.isArray(s) ? s[0] ?? "" : "").join("").trim() || null;
    } catch {
      return null;
    }
  });
}
async function translateWithGoogle(text) {
  const paragraphs = text.split(/\n\s*\n/);
  const results = [];
  for (const paragraph of paragraphs) {
    const chunks = paragraph.length <= 4500 ? [paragraph] : splitIntoChunks(paragraph, 4500);
    const translated = [];
    for (const chunk of chunks) {
      const result = await translateChunkWithGoogle(chunk);
      if (!result) return null;
      translated.push(result);
    }
    results.push(translated.join(" "));
  }
  return results.join("\n\n");
}
async function translateChunkWithMyMemory(chunk) {
  return myMemoryLimit(async () => {
    try {
      const email = process.env.MYMEMORY_EMAIL ?? "";
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", chunk);
      url.searchParams.set("langpair", "en|pt-BR");
      if (email) url.searchParams.set("de", email);
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return chunk;
      const data = await res.json();
      if (data.responseStatus !== 200) return chunk;
      return data.responseData?.translatedText || chunk;
    } catch {
      return chunk;
    }
  });
}
async function translateWithMyMemory(text) {
  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length === 1) {
    const chunks = splitIntoChunks(paragraphs[0]);
    if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0]);
    const results = await Promise.allSettled(chunks.map(translateChunkWithMyMemory));
    return results.map((r, i) => r.status === "fulfilled" ? r.value : chunks[i]).join(" ");
  }
  const translatedParagraphs = await Promise.all(paragraphs.map(async (paragraph) => {
    const chunks = splitIntoChunks(paragraph);
    if (chunks.length === 1) return translateChunkWithMyMemory(chunks[0]);
    const results = await Promise.allSettled(chunks.map(translateChunkWithMyMemory));
    return results.map((r, i) => r.status === "fulfilled" ? r.value : chunks[i]).join(" ");
  }));
  return translatedParagraphs.join("\n\n");
}
var translationCache = /* @__PURE__ */ new Map();
async function translateToPortuguese(text) {
  if (!text.trim()) return text;
  const cacheKey = text.slice(0, 250);
  const cached = translationCache.get(cacheKey);
  if (cached !== void 0) return cached;
  const pending = (async () => {
    try {
      const deeplKey = process.env.DEEPL_API_KEY;
      if (deeplKey) return await translateWithDeepL(text, deeplKey);
      const googleResult = await translateWithGoogle(text);
      if (googleResult) return googleResult;
      return await translateWithMyMemory(text);
    } catch {
      return text;
    }
  })();
  translationCache.set(cacheKey, pending);
  return pending;
}

// src/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
var TABLE = process.env.DYNAMODB_NOTICIAS_TABLE ?? "eventos-historicos-noticias";
var TTL_SECONDS = 30 * 24 * 60 * 60;
var _client = null;
function getClient() {
  if (_client) return _client;
  const raw = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true }
  });
  return _client;
}
async function saveArticle(article) {
  try {
    await getClient().send(
      new PutCommand({
        TableName: TABLE,
        Item: { ...article, expiresAt: Math.floor(Date.now() / 1e3) + TTL_SECONDS }
      })
    );
  } catch (err) {
    console.error("[dynamodb] saveArticle:", err);
  }
}
async function getArticle(slug) {
  try {
    const result = await getClient().send(new GetCommand({ TableName: TABLE, Key: { slug } }));
    return result.Item ?? null;
  } catch {
    return null;
  }
}
async function articleExistsFull(slug) {
  try {
    const result = await getClient().send(
      new GetCommand({ TableName: TABLE, Key: { slug }, ProjectionExpression: "slug, resumo" })
    );
    const item = result.Item;
    return Boolean(item?.slug && item.resumo === false);
  } catch {
    return false;
  }
}
async function listArticles(limit = 20) {
  try {
    const result = await getClient().send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: "tipo-data-index",
        KeyConditionExpression: "#tipo = :tipo",
        ExpressionAttributeNames: { "#tipo": "tipo" },
        ExpressionAttributeValues: { ":tipo": "rss" },
        ScanIndexForward: false,
        Limit: limit
      })
    );
    return result.Items ?? [];
  } catch {
    return [];
  }
}

// src/utils.ts
function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function normalizeEncoding(value) {
  return value.replace(/�/g, "").replace(/Ã¡/g, "\xE1").replace(/Ã¢/g, "\xE2").replace(/Ã£/g, "\xE3").replace(/Ãª/g, "\xEA").replace(/Ã©/g, "\xE9").replace(/Ã­/g, "\xED").replace(/Ã³/g, "\xF3").replace(/Ãµ/g, "\xF5").replace(/Ãº/g, "\xFA").replace(/Ã§/g, "\xE7").replace(/Ã"/g, "\xD3").replace(/Ã/g, "\xE0");
}
function normalizeText(value) {
  return normalizeEncoding(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function decodeEntities(value) {
  return normalizeEncoding(
    value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16))).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim()
  );
}
function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}
function looksMostlyEnglish(value) {
  const normalized = ` ${normalizeText(value)} `;
  return /\b(the|a|an|is|are|was|were|be|been|of|in|on|to|for|and|but|or|with|by|at|from|as|it|its|this|that|he|she|they|we|you|who|which|has|have|had|will|would|can|could|should|may|might|must|not|no|up|out|if|so|than|then|after|before|over|under|about|into|through|says|said|warns|calls|reports|amid|despite|against|during|while|when|where|how|new|more|last|first|their|our|his|her|us|uk)\b/.test(normalized);
}
function clipText(text, maxLength) {
  const normalized = normalizeEncoding(text).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}
function sanitizeHtml(html) {
  return normalizeEncoding(html).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<picture[\s\S]*?<\/picture>/gi, "").replace(/<figure[\s\S]*?<\/figure>/gi, "").replace(/<img[^>]*>/gi, "").replace(/<source[^>]*>/gi, "").replace(/\son\w+="[^"]*"/gi, "").replace(/\son\w+='[^']*'/gi, "").replace(/javascript:/gi, "").replace(/<iframe[\s\S]*?<\/iframe>/gi, "").replace(/<a[^>]*>\s*(leia mais|read more|continue reading)[\s\S]*?<\/a>/gi, "").replace(/<p>\s*(leia mais|read more|continue reading)[\s\S]*?<\/p>/gi, "").trim();
}
function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}
function extractAttribute(block, tag, attribute) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}
function extractMetaContent(html, propertyName) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${propertyName}["'][^>]+content=["']([^"']+)["']`, "i"));
  return match ? decodeEntities(match[1]) : "";
}
var JUNK_PARAGRAPH_PATTERN = /(cookie|assine|inscreva-se|newsletter|publicidade|advertisement|compartilhe esta|leia tamb[ée]m|veja tamb[ée]m|siga o |siga a |clique aqui|todos os direitos reservados|copyright ©|sign up|subscribe|related:|read more:|leia mais:|^listen\b|save share|share-nodes|whatsapp-stroke|copylink|caret-right|add .+ on google|download our app|follow us|^by [a-z .]+$|min read|mins read|\bfacebook\b.*\bx\b.*\bwhatsapp\b|recommended stories|^list \d+ of \d+|end of list)/i;
var SENTENCE_END_PATTERN = /[.!?"'")]\s*$/;
function cleanFeedText(text) {
  return normalizeEncoding(text).replace(/�/g, "").replace(/(?:veja os v[íi]deos[^.]*\.)/gi, "").replace(/(?:mande para o g1[^.]*\.)/gi, "").replace(/(?:tem alguma sugest[aã]o de reportagem[^.]*\.)/gi, "").replace(/(?:clique aqui para seguir[^.]*\.)/gi, "").replace(/(?:leia mais no site original\.?)/gi, "").replace(/\s{2,}/g, " ").trim();
}
function paragraphizeText(text) {
  const normalized = cleanFeedText(text);
  if (!normalized) return [];
  const rawBlocks = normalized.split(/\n\s*\n/).map((block) => block.replace(/\s+/g, " ").trim()).filter(Boolean);
  const paragraphs = [];
  for (const block of rawBlocks) {
    if (block.length <= 360) {
      paragraphs.push(block);
      continue;
    }
    const sentences = block.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9"])/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length <= 1) {
      paragraphs.push(block);
      continue;
    }
    let current = "";
    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence;
      if (next.length > 420 && current) {
        paragraphs.push(current);
        current = sentence;
      } else {
        current = next;
      }
    }
    if (current) paragraphs.push(current);
  }
  return paragraphs;
}
function extractParagraphText(html) {
  const clean = sanitizeHtml(html);
  if (!clean) return "";
  const text = clean.replace(/<(br|\/p|\/div|\/li|\/h\d)>/gi, "\n").replace(/<li>/gi, "\u2022 ").replace(/<[^>]+>/g, " ");
  return paragraphizeText(text).join("\n\n");
}
function textToHtmlParagraphs(text) {
  return paragraphizeText(text).map((p) => `<p>${p}</p>`).join("");
}
function fetchSourceArticleText(url) {
  return _fetchSourceArticleText(url);
}
async function _fetchSourceArticleText(url) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6e3)
    });
    if (!response.ok) return "";
    const html = await response.text();
    const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    const mainHtml = sanitizeHtml(articleMatch ? articleMatch[1] : html);
    const paragraphs = extractParagraphText(mainHtml).split(/\n\s*\n/).map((p) => p.replace(/last modified on[\s\S]*?\b(am|pm|edt|gmt|bst|utc)\b\.?/gi, "").replace(/\blist \d+ of \d+\b/gi, "").replace(/recommended stories[\s\S]*?end of list/gi, "").replace(/\s{2,}/g, " ").trim()).filter(Boolean).filter((p) => !JUNK_PARAGRAPH_PATTERN.test(p)).filter((p) => {
      const words = p.split(/\s+/).filter(Boolean).length;
      if (words < 6) return false;
      if (p.length < 200 && !SENTENCE_END_PATTERN.test(p)) return false;
      return true;
    });
    const selected = [];
    let total = 0;
    for (const p of paragraphs) {
      if (total >= 2200) break;
      selected.push(p);
      total += p.length;
    }
    const text = selected.join("\n\n");
    return text.length >= 400 ? text : "";
  } catch {
    return "";
  }
}

// src/process.ts
var MAX_NEWS_AGE_DAYS = 10;
var MAX_HISTORY_AGE_DAYS = 30;
var OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
var OPENAI_MODEL = process.env.OPENAI_EDITORIAL_MODEL || "gpt-4o-mini";
var RSS_FEEDS = [
  { name: "BBC World", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "BBC Politics", url: "http://feeds.bbci.co.uk/news/politics/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "G1", url: "https://g1.globo.com/rss/g1/" },
  { name: "UOL Not\xEDcias", url: "https://rss.uol.com.br/feed/noticias.xml" },
  { name: "Ag\xEAncia Brasil", url: "https://agenciabrasil.ebc.com.br/rss.xml" },
  { name: "World History Encyclopedia", url: "https://www.worldhistory.org/rss/" },
  { name: "Smithsonian History", url: "https://www.smithsonianmag.com/rss/history/" },
  { name: "History Extra", url: "https://www.historyextra.com/feed/" }
];
var HISTORY_SOURCES = /* @__PURE__ */ new Set(["History Extra", "Smithsonian History", "World History Encyclopedia"]);
var CATEGORY_RULES = [
  { categoria: "Explora\xE7\xE3o Espacial", keywords: ["artemis", "nasa", "spacex", "space mission", "space program", "space exploration", "space flight", "space station", "orbita", "marte", "astronaut", "rocket launch", "moon landing", "lunar mission"] },
  { categoria: "Conflitos", keywords: ["guerra", "war", "conflit", "ataque", "attack", "missil", "missile", "bomb", "troops", "ceasefire", "militar", "navio de guerra"] },
  { categoria: "Pol\xEDtica", keywords: ["elei", "election", "president", "premier", "prime minister", "governo", "parliament", "congresso", "coalition", "opposition"] },
  { categoria: "Economia Global", keywords: ["trade", "tariff", "econom", "mercado", "inflation", "sanction", "energy", "oil", "gas", "supply chain"] },
  { categoria: "Hist\xF3ria", keywords: ["histori", "arqueolog", "artifact", "heritage", "museum", "ancient", "patrimonio", "memoria"] }
];
var RELEVANT_KEYWORDS = ["geopolit", "diplomac", "guerra", "war", "conflit", "election", "elei", "president", "prime minister", "sanction", "trade", "military", "militar", "border", "fronteira", "nato", "otan", "united nations", "onu", "parliament", "territory", "territorio", "oil", "gas", "space", "lua", "artemis", "nasa", "moon", "histori", "historic", "arqueolog", "heritage", "museum"];
var NEGATIVE_KEYWORDS = ["futebol", "celebrity", "celebridade", "horoscope", "horoscopo", "loteria", "reality show"];
var GLOBAL_PRIORITY_KEYWORDS = ["eua", "estados unidos", "china", "russia", "ucrania", "otan", "onu", "uniao europeia", "european union", "middle east", "oriente medio", "israel", "iran", "gaza", "taiwan", "coreia", "india", "pakistan", "africa", "global", "international", "diplomac", "border", "trade", "tariff", "sanction", "war", "conflit", "space", "nasa", "artemis"];
var SOURCE_WEIGHTS = {
  "BBC World": 50,
  "BBC Politics": 48,
  "Al Jazeera": 46,
  "The Guardian World": 44,
  "World History Encyclopedia": 40,
  "Smithsonian History": 38,
  "History Extra": 38,
  "Ag\xEAncia Brasil": 28,
  G1: 20,
  "UOL Not\xEDcias": 18
};
var GENERIC_FALLBACK_IMAGES = /* @__PURE__ */ new Set([
  "/historical-books-and-world-map-study.jpg",
  "/world-map-with-geopolitical-tensions.jpg",
  "/geopolitics-world-map-with-news-overlay.jpg"
]);
function normalizeImageUrl(url) {
  if (!url) return "";
  const normalized = decodeEntities(url).trim();
  if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/")) return "";
  if (/(logo|icon|favicon|avatar|sprite)/i.test(normalized)) return "";
  if (/(flag_of|seal_of|coat_of_arms|locator_map|blank_map|orthographic|relief_location)/i.test(normalized)) return "";
  if (/w16|w24|w32|w48/i.test(normalized)) return "";
  return normalized.replace(/([?&])(width|w)=\d+/gi, "$1$2=1600").replace(/([?&])(height|h)=\d+/gi, "$1$2=900").replace(/([?&])(quality|q)=\d+/gi, "$1$2=90");
}
function extractImage(item, html) {
  return [
    extractAttribute(item, "media:content", "url"),
    extractAttribute(item, "media:thumbnail", "url"),
    extractAttribute(item, "enclosure", "url"),
    extractAttribute(html, "img", "src")
  ].map((c) => normalizeImageUrl(c)).find(Boolean) ?? "";
}
function inferImage(article) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.categoria}`);
  if (/(space|lua|artemis|nasa|moon|apollo|marte|astronaut)/.test(text)) return "/historical-books-and-world-map-study.jpg";
  if (/(guerra|war|conflit|attack|bomb|militar|oriente medio|border|troops)/.test(text)) return "/world-map-with-geopolitical-tensions.jpg";
  return "/geopolitics-world-map-with-news-overlay.jpg";
}
async function fetchSourcePageImage(url) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6e3)
    });
    if (!res.ok) return "";
    const html = await res.text();
    const metaImage = extractMetaContent(html, "og:image") || extractMetaContent(html, "twitter:image") || extractMetaContent(html, "og:image:url");
    return normalizeImageUrl(metaImage);
  } catch {
    return "";
  }
}
async function searchWikimediaImages(query) {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "5");
    url.searchParams.set("prop", "pageimages|info");
    url.searchParams.set("piprop", "thumbnail");
    url.searchParams.set("pithumbsize", "1600");
    url.searchParams.set("inprop", "url");
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5e3),
      headers: { "User-Agent": "EventosHistoricosBot/1.0" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Object.values(data.query?.pages ?? {}).map((page) => {
      const imageUrl = normalizeImageUrl(page.thumbnail?.source);
      const pageTitle = normalizeText(page.title ?? "");
      let score = imageUrl ? 0 : -100;
      if (pageTitle.includes(normalizeText(query))) score += 40;
      if (/(ship|port|strait|gulf|commission|trump|ukraine|european union|brussels|iran)/.test(pageTitle)) score += 18;
      if (/(flag|seal|map|locator|coat of arms)/.test(pageTitle)) score -= 60;
      return { imageUrl, score };
    }).filter((e) => e.imageUrl).sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}
async function requestOpenAIImageHints(article) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_image_hints",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                searchQueries: { type: "array", items: { type: "string" } },
                theme: { type: "string" }
              },
              required: ["searchQueries", "theme"]
            }
          }
        },
        messages: [
          { role: "system", content: "Voce escolhe pistas de busca para imagens editoriais de noticias. Retorne de 3 a 5 consultas curtas e especificas para buscar imagem no Wikimedia. Priorize entidades reais, lugares, organizacoes e temas centrais da noticia." },
          { role: "user", content: JSON.stringify(article) }
        ]
      }),
      signal: AbortSignal.timeout(6e3)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      searchQueries: [...new Set((parsed.searchQueries ?? []).map((q) => normalizeEncoding(q).trim()).filter((q) => q.length >= 3))].slice(0, 5),
      theme: normalizeEncoding(parsed.theme ?? "").trim()
    };
  } catch {
    return null;
  }
}
async function resolveArticleImage(article, feedImage, timeoutMs = 8e3) {
  const normalized = normalizeImageUrl(feedImage);
  if (normalized && !GENERIC_FALLBACK_IMAGES.has(normalized)) return normalized;
  const sourceImage = await Promise.race([
    fetchSourcePageImage(article.link),
    new Promise((resolve) => setTimeout(() => resolve(""), timeoutMs))
  ]);
  if (sourceImage) return sourceImage;
  const aiHints = await requestOpenAIImageHints(article);
  const queries = [...new Set([
    ...aiHints?.searchQueries ?? [],
    article.titulo.split(" ").slice(0, 4).join(" "),
    ...aiHints?.theme ? [`${aiHints.theme} ${article.categoria}`] : []
  ].map((q) => q.trim()).filter((q) => q.length >= 3))].slice(0, 4);
  const allResults = await Promise.all(queries.map(searchWikimediaImages));
  const best = allResults.flatMap((results, i) => results.slice(0, 4).map((r) => ({ ...r, score: r.score + Math.max(0, 40 - i * 10) }))).sort((a, b) => b.score - a.score)[0];
  return best?.imageUrl || inferImage(article);
}
async function expandArticleWithAI(article) {
  const fallback = article.contexto?.trim() || article.descricao;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: "Voc\xEA \xE9 editor de um portal brasileiro de geopol\xEDtica e hist\xF3ria. Com base no t\xEDtulo, resumo e contexto adicional de uma not\xEDcia internacional, escreva um artigo informativo em portugu\xEAs do Brasil com 3 a 4 par\xE1grafos bem desenvolvidos. Mantenha-se fiel aos fatos apresentados. N\xE3o invente informa\xE7\xF5es que n\xE3o estejam no contexto fornecido. Escreva de forma clara, objetiva e jornal\xEDstica. Separe os par\xE1grafos com duas quebras de linha. N\xE3o inclua t\xEDtulo nem cabe\xE7alho, apenas os par\xE1grafos." },
          { role: "user", content: `T\xEDtulo: ${article.titulo}
Resumo: ${article.descricao}
Contexto adicional do feed: ${article.contexto || "(nenhum)"}
Categoria: ${article.categoria}
Fonte: ${article.fonte}` }
        ]
      }),
      signal: AbortSignal.timeout(2e4)
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content ? normalizeEncoding(content) : fallback;
  } catch {
    return fallback;
  }
}
function hasTruncationMarker(rawHtml) {
  const normalized = normalizeText(decodeEntities(rawHtml));
  return /(continue reading|read more|leia mais|saiba mais|veja mais)\s*(\.\.\.)?\s*(<\/a>)?\s*$/.test(normalized.trim()) || /\[\+\d+\s*chars?\]/.test(normalized) || normalized.trim().endsWith("...") || normalized.trim().endsWith("\u2026");
}
function parseRssItems(xml, feedName) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => {
    const titulo = stripTags(extractTag(item, "title"));
    const link = stripTags(extractTag(item, "link"));
    const contentEncoded = extractTag(item, "content:encoded");
    const description = extractTag(item, "description");
    const data = stripTags(extractTag(item, "pubDate"));
    const fonte = stripTags(extractTag(item, "source")) || feedName;
    const rawSource = contentEncoded || description;
    const conteudoHtml = sanitizeHtml(rawSource);
    const descricao = extractParagraphText(description || contentEncoded).split(/\n\s*\n/)[0] || titulo;
    const imagem = extractImage(item, contentEncoded || description);
    return {
      titulo: normalizeEncoding(titulo),
      descricao: normalizeEncoding(descricao),
      conteudoHtml,
      data,
      fonte: normalizeEncoding(fonte),
      link,
      imagem,
      truncated: hasTruncationMarker(rawSource)
    };
  }).filter((item) => Boolean(item.titulo && item.link));
}
async function fetchFeed(url, name) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return [];
    return parseRssItems(await res.text(), name);
  } catch {
    return [];
  }
}
function isRelevantArticle(article) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`);
  return RELEVANT_KEYWORDS.some((k) => text.includes(k)) && !NEGATIVE_KEYWORDS.some((k) => text.includes(k));
}
function inferCategory(article) {
  if (HISTORY_SOURCES.has(article.fonte)) return "Hist\xF3ria";
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`);
  return CATEGORY_RULES.find((r) => r.keywords.some((k) => text.includes(k)))?.categoria ?? "Geopol\xEDtica";
}
function scoreArticle(article, categoria) {
  const text = normalizeText(`${article.titulo} ${article.descricao} ${article.conteudoHtml}`);
  const sourceScore = SOURCE_WEIGHTS[article.fonte] ?? 24;
  const categoryScore = categoria === "Geopol\xEDtica" ? 40 : categoria === "Conflitos" ? 38 : categoria === "Pol\xEDtica" ? 34 : categoria === "Economia Global" ? 30 : categoria === "Explora\xE7\xE3o Espacial" ? 28 : 24;
  const globalScore = GLOBAL_PRIORITY_KEYWORDS.filter((k) => text.includes(k)).length * 8;
  const titleBonus = /(war|guerra|election|elei|crise|summit|coup|sanction|otan|onu|nasa|artemis)/.test(text) ? 12 : 0;
  const articleDate = article.data ? new Date(article.data) : /* @__PURE__ */ new Date();
  const ageHours = Number.isNaN(articleDate.getTime()) ? 9999 : (Date.now() - articleDate.getTime()) / 36e5;
  const ageScore = ageHours <= 12 ? 140 : ageHours <= 24 ? 115 : ageHours <= 48 ? 90 : ageHours <= 72 ? 70 : ageHours <= 120 ? 45 : ageHours <= 168 ? 25 : ageHours <= 240 ? 10 : -20;
  return sourceScore + categoryScore + globalScore + titleBonus + ageScore;
}
function buildRssSlug(item) {
  const parsedDate = item.data ? new Date(item.data) : /* @__PURE__ */ new Date();
  const datePart = Number.isNaN(parsedDate.getTime()) ? "atual" : parsedDate.toISOString().slice(0, 10);
  return slugify(`${item.fonte}-${item.titulo}-${datePart}`);
}
function buildScoredCandidate(item) {
  const categoria = inferCategory(item);
  const parsedDate = item.data ? new Date(item.data) : /* @__PURE__ */ new Date();
  if (Number.isNaN(parsedDate.getTime())) return null;
  const ageDays = (Date.now() - parsedDate.getTime()) / 864e5;
  const maxAge = categoria === "Hist\xF3ria" ? MAX_HISTORY_AGE_DAYS : MAX_NEWS_AGE_DAYS;
  if (ageDays > maxAge) return null;
  return { item, categoria, score: scoreArticle(item, categoria), data: parsedDate.toISOString() };
}
async function getAllScoredCandidates() {
  const results = await Promise.all(RSS_FEEDS.map((f) => fetchFeed(f.url, f.name)));
  const seen = /* @__PURE__ */ new Set();
  return results.flat().filter(isRelevantArticle).filter((item) => {
    const key = normalizeText(`${item.titulo}-${item.link}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(buildScoredCandidate).filter((c) => c !== null);
}
async function hydrateScoredCandidate(candidate, imageTimeoutMs = 8e3) {
  const { item, categoria, data } = candidate;
  const slug = buildRssSlug(item);
  const resumo = item.truncated || item.descricao.endsWith("...") || item.conteudoHtml.length < 600;
  const rawText = extractParagraphText(item.conteudoHtml || item.descricao) || item.descricao || item.titulo;
  const imageFallback = inferImage({ titulo: item.titulo, descricao: item.descricao, categoria });
  const [imagem, translatedTitle, translatedDesc, translatedBody] = await Promise.all([
    Promise.race([
      resolveArticleImage({ titulo: item.titulo, descricao: item.descricao, categoria, link: item.link }, item.imagem, imageTimeoutMs),
      new Promise((resolve) => setTimeout(() => resolve(imageFallback), imageTimeoutMs))
    ]),
    translateToPortuguese(item.titulo),
    translateToPortuguese(item.descricao),
    translateToPortuguese(rawText)
  ]);
  const notice = `<p><em>Conte\xFAdo do feed oficial de <strong>${item.fonte}</strong>, curado pelo Eventos Hist\xF3ricos.</em></p>`;
  return {
    id: `rss-${slug}`,
    slug,
    titulo: translatedTitle,
    descricao: clipText(translatedDesc || "Resumo selecionado automaticamente a partir de feeds abertos e confi\xE1veis.", 220),
    conteudo: translatedBody,
    conteudoHtml: `${textToHtmlParagraphs(translatedBody)}${notice}`,
    resumo,
    data,
    categoria,
    fonte: item.fonte,
    fonteUrl: item.link,
    linkFonte: item.link,
    imagem,
    tags: [normalizeText(categoria), "rss", normalizeText(item.fonte)],
    href: `/noticias/${slug}`,
    externo: false,
    tipo: "rss",
    idioma: "en",
    noticeHtml: notice,
    tituloOriginal: item.titulo,
    descricaoOriginal: item.descricao,
    conteudoOriginal: rawText
  };
}
async function enrichArticle(article) {
  if (article.tipo !== "rss" || !article.resumo) return article;
  const sourceLink = article.linkFonte || article.fonteUrl;
  const scrapedText = await fetchSourceArticleText(sourceLink);
  let body;
  let bodyOriginal;
  let bodySource = "ai";
  if (scrapedText && scrapedText.length > article.conteudo.length + 200) {
    const isEn = looksMostlyEnglish(scrapedText);
    body = isEn ? await translateToPortuguese(scrapedText) : scrapedText;
    bodyOriginal = isEn ? scrapedText : void 0;
    bodySource = "scraped";
  } else {
    const aiText = await expandArticleWithAI({
      titulo: article.titulo,
      descricao: article.descricao,
      categoria: article.categoria,
      fonte: article.fonte,
      contexto: article.conteudo
    });
    if (aiText.trim() === article.conteudo.trim()) return article;
    body = aiText;
  }
  const notice = bodySource === "scraped" ? `<p><em>Conte\xFAdo obtido a partir da reportagem original de <strong>${article.fonte}</strong>, reorganizado pelo Eventos Hist\xF3ricos. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a mat\xE9ria original</a>.</em></p>` : `<p><em>Artigo elaborado pela reda\xE7\xE3o editorial do Eventos Hist\xF3ricos com base na cobertura de <strong>${article.fonte}</strong>. <a href="${sourceLink}" target="_blank" rel="noopener noreferrer">Acesse a reportagem original</a>.</em></p>`;
  return {
    ...article,
    conteudo: body,
    conteudoHtml: `${textToHtmlParagraphs(body)}${notice}`,
    idioma: bodyOriginal ? "en" : article.idioma,
    noticeHtml: notice,
    conteudoOriginal: bodyOriginal ?? article.conteudoOriginal,
    resumo: false
  };
}
async function refreshArticles() {
  console.log("[refresh] fetching RSS candidates...");
  const candidates = (await getAllScoredCandidates()).sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 20);
  console.log(`[refresh] ${candidates.length} candidates found`);
  const checked = await Promise.all(
    candidates.map(async (candidate) => {
      const slug = buildRssSlug(candidate.item);
      const exists = await articleExistsFull(slug);
      return { candidate, slug, exists };
    })
  );
  const toProcess = checked.filter((c) => !c.exists);
  const skipped = checked.length - toProcess.length;
  console.log(`[refresh] ${toProcess.length} to process, ${skipped} already in DB`);
  await Promise.allSettled(
    toProcess.map(async ({ candidate }) => {
      try {
        const hydrated = await hydrateScoredCandidate(candidate, 8e3);
        const enriched = await enrichArticle(hydrated);
        await saveArticle(enriched);
        console.log(`[refresh] saved: ${enriched.slug}`);
      } catch (err) {
        console.error(`[refresh] failed: ${candidate.item.titulo}`, err);
      }
    })
  );
  return { processed: toProcess.length, skipped };
}

// src/handler.ts
function jsonResponse(statusCode, body, headers) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
      ...headers
    },
    body: JSON.stringify(body)
  };
}
function isAuthorized(event) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = event.headers?.authorization || event.headers?.Authorization;
  return auth === `Bearer ${secret}`;
}
var handler = async (event) => {
  const isScheduled = event.source?.startsWith("aws.") || event["detail-type"] === "Scheduled Event";
  if (isScheduled) {
    console.log("[handler] EventBridge trigger \u2014 refreshing articles");
    const result = await refreshArticles();
    return { statusCode: 200, body: JSON.stringify({ ok: true, ...result }) };
  }
  const method = event.requestContext?.http?.method?.toUpperCase() ?? "GET";
  const path = event.rawPath ?? event.requestContext?.http?.path ?? "/";
  if (method === "OPTIONS") {
    return jsonResponse(204, null, {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type"
    });
  }
  if (method === "POST" && path === "/refresh") {
    if (!isAuthorized(event)) return jsonResponse(401, { error: "unauthorized" });
    console.log("[handler] POST /refresh \u2014 manual trigger");
    const result = await refreshArticles();
    return jsonResponse(200, { ok: true, at: (/* @__PURE__ */ new Date()).toISOString(), ...result });
  }
  if (method === "GET" && path === "/noticias") {
    const articles = await listArticles(20);
    return jsonResponse(200, articles);
  }
  const slugMatch = path.match(/^\/noticias\/([^/]+)$/);
  if (method === "GET" && slugMatch) {
    const article = await getArticle(slugMatch[1]);
    if (!article) return jsonResponse(404, { error: "not_found" });
    return jsonResponse(200, article);
  }
  return jsonResponse(404, { error: "not_found" });
};
export {
  handler
};
