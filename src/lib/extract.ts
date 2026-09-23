const FETCH_TIMEOUT_MS = 8000;
const MAX_CHARS = 4000;
const MAX_RESPONSE_BYTES = 3_000_000; // 3 MB — więcej niż potrzeba na treść artykułu

// artykuły pochodzą z zewnętrznych, częściowo niekontrolowanych treści
// (RSS, posty HN) — ktoś mógłby podesłać link do usługi wewnętrznej
// (localhost, sieć prywatna, endpoint metadanych chmury). Blokujemy
// oczywiste przypadki; nie chroni to przed DNS rebindingiem, na co
// pełna ochrona wymagałaby własnej rezolucji DNS przed połączeniem.
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1, 3).map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // obejmuje endpoint metadanych chmury
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

// czyta odpowiedź z limitem bajtów, żeby serwer nie mógł wysłać
// nieograniczonego strumienia i zjeść pamięci — nagłówek content-length
// bywa nieobecny albo skłamany, więc liczymy realnie odebrane bajty
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

export async function extractArticleText(url: string): Promise<string | null> {
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

    const html = await readBounded(res);
    if (!html) return null;

    const region = stripNoise(extractRegion(html));
    const text = decodeEntities(
      region
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );

    return text.length > 200 ? text.slice(0, MAX_CHARS) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
