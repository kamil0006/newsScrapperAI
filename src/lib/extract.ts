const FETCH_TIMEOUT_MS = 8000;
const MAX_CHARS = 4000;
const MAX_RESPONSE_BYTES = 3_000_000; // 3 MB — more than an article body needs

// articles come from external, partially uncontrolled content (RSS, HN
// posts) — someone could slip in a link to an internal service (localhost,
// private network, cloud metadata endpoint). We block the obvious cases;
// this does not protect against DNS rebinding, which would need its own
// DNS resolution before connecting for full protection.
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1, 3).map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // covers the cloud metadata endpoint
  }

  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  return false;
}

function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return !isBlockedHost(parsed.hostname);
  } catch {
    return false;
  }
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z0-9]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const codePoint =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function extractRegion(html: string): string {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article) return article[1];

  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1];

  return html;
}

function stripNoise(html: string): string {
  return html
    .replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

// reads the response with a byte cap so a server can't send an unbounded
// stream and exhaust memory — the content-length header is sometimes
// absent or lies, so we count the actually received bytes
async function readBounded(res: Response): Promise<string | null> {
  const contentLength = res.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) return null;

  if (!res.body) return res.text();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      return null;
    }
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

// shared by both extractors: safety checks, timeout, size cap
async function fetchHtml(url: string): Promise<string | null> {
  if (!isSafeUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; newsScrapperAI/0.1; personal news reader)",
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("text/html")) return null;

    return await readBounded(res);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// flat text for the classifier — it doesn't need paragraphs
export async function extractArticleText(url: string): Promise<string | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const region = stripNoise(extractRegion(html));
  const text = decodeEntities(
    region
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  return text.length > 200 ? text.slice(0, MAX_CHARS) : null;
}

// ---- in-app reader: keeps the article's structure (paragraphs, headings)

export type ReaderBlock = { t: "p" | "h" | "li" | "q"; x: string };

const READER_MAX_CHARS = 30_000;
// below this much paragraph text the page was most likely a JS app, a
// paywall or a cookie wall — better to say so than show scraps
const READER_MIN_CHARS = 400;
const MIN_PARAGRAPH_CHARS = 40;
const JUNK = /^(advertisement|reklama|subscribe|sign up|newsletter|read more|related:|see also|follow us|share this|image:|photo:|credit:)/i;

const BLOCK_TAGS: Record<string, ReaderBlock["t"]> = {
  p: "p",
  h2: "h",
  h3: "h",
  li: "li",
  blockquote: "q",
};

function cleanText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function htmlToBlocks(html: string): ReaderBlock[] | null {
  const region = stripNoise(extractRegion(html)).replace(
    /<(figure|figcaption|form|button|svg|select|template)[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );

  const blocks: ReaderBlock[] = [];
  let total = 0;
  let paragraphChars = 0;
  // blockquotes usually wrap <p>s — skip the inner paragraphs we've already
  // taken as part of the quote
  let quoteEnd = -1;

  const pattern = /<(p|h2|h3|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const match of region.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start < quoteEnd) continue;

    const type = BLOCK_TAGS[match[1].toLowerCase()];
    const text = cleanText(match[2]);
    if (type === "q") quoteEnd = start + match[0].length;

    if (!text || JUNK.test(text)) continue;
    if (type === "h" && (text.length < 3 || text.length > 160)) continue;
    if (type !== "h" && text.length < MIN_PARAGRAPH_CHARS) continue;
    if (blocks.length > 0 && blocks[blocks.length - 1].x === text) continue;

    blocks.push({ t: type, x: text });
    total += text.length;
    if (type === "p" || type === "q") paragraphChars += text.length;
    if (total > READER_MAX_CHARS) break;
  }

  // a trailing heading with nothing under it is just noise
  while (blocks.length > 0 && blocks[blocks.length - 1].t === "h") blocks.pop();

  return paragraphChars >= READER_MIN_CHARS ? blocks : null;
}

export async function extractReadableBlocks(url: string): Promise<ReaderBlock[] | null> {
  const html = await fetchHtml(url);
  return html ? htmlToBlocks(html) : null;
}
