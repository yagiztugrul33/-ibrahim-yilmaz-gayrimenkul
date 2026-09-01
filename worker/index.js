/*
 * Cloudflare Worker — statik siteyi olduğu gibi sunar, ek olarak
 * /api/haberler adresinde Google News RSS'den canlı "kentsel dönüşüm"
 * haberlerini çekip JSON olarak döner (kenarda önbelleklenir).
 *
 * Bu dosya sandbox'ta test edilemedi (ağ erişimi yok) — canlıya çıkışta
 * gerçek RSS yanıtıyla bir kez kontrol edilmesi önerilir.
 */

const HABER_SORGUSU = "kentsel dönüşüm Ankara Altındağ İskitler";
const HABER_SAYISI = 10;
const HABER_CACHE_SANIYE = 3600; // 1 saat

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/haberler") {
      return handleHaberler(request, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

async function handleHaberler(request, ctx) {
  const feedUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(HABER_SORGUSU) +
    "&hl=tr&gl=TR&ceid=TR:tr";

  const cache = caches.default;
  const cacheKey = new Request(feedUrl, { method: "GET" });

  let cached = await cache.match(cacheKey);
  if (cached) return withCors(cached);

  let items = [];
  let hata = null;
  try {
    const rssResp = await fetch(feedUrl, {
      cf: { cacheTtl: HABER_CACHE_SANIYE, cacheEverything: true },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IYGHaberBot/1.0)" }
    });
    if (!rssResp.ok) throw new Error("RSS yanıt kodu: " + rssResp.status);
    const xml = await rssResp.text();
    items = parseRss(xml).slice(0, HABER_SAYISI);
  } catch (e) {
    hata = String((e && e.message) || e);
  }

  const body = JSON.stringify({
    updatedAt: new Date().toISOString(),
    query: HABER_SORGUSU,
    items: items,
    error: hata
  });

  const response = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=" + HABER_CACHE_SANIYE
    }
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return withCors(response);
}

function withCors(response) {
  const r = new Response(response.body, response);
  r.headers.set("Access-Control-Allow-Origin", "*");
  return r;
}

function parseRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) && items.length < 30) {
    const block = m[1];
    const rawTitle = extractTag(block, "title");
    const rawLink = extractTag(block, "link");
    const rawPubDate = extractTag(block, "pubDate");
    const rawSource = extractTag(block, "source");

    const title = decodeEntities(stripTags(rawTitle));
    const link = decodeEntities(stripTags(rawLink));
    if (!title || !link) continue;

    items.push({
      title: title,
      link: link,
      pubDate: rawPubDate || "",
      source: rawSource ? decodeEntities(stripTags(rawSource)) : ""
    });
  }
  return items;
}

function extractTag(block, tag) {
  const re = new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">");
  const found = re.exec(block);
  if (!found) return "";
  const raw = found[1].trim();
  const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(raw);
  return cdata ? cdata[1] : raw;
}

function stripTags(s) {
  return String(s || "").replace(/<[^>]*>/g, "").trim();
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export const __test__ = { parseRss, extractTag, stripTags, decodeEntities };
