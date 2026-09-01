/*
 * Cloudflare Worker — statik siteyi olduğu gibi sunar, ek olarak
 * /api/haberler adresinde canlı "kentsel dönüşüm" haberlerini çekip
 * JSON olarak döner (kenarda önbelleklenir).
 *
 * Google Haberler RSS'i bulut/veri merkezi IP'lerinden gelen istekleri
 * zaman zaman 503 ile reddediyor; bu yüzden önce Google, başarısız
 * olursa Bing Haberler RSS'i denenir.
 */

const HABER_SORGUSU = "kentsel dönüşüm Ankara Altındağ İskitler";
const HABER_SAYISI = 10;
const HABER_CACHE_SANIYE = 3600; // 1 saat

const TARAYICI_BASLIKLARI = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, text/xml, application/xml;q=0.9, */*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.5"
};

function haberKaynaklari(sorgu) {
  return [
    {
      ad: "google",
      url: "https://news.google.com/rss/search?q=" + encodeURIComponent(sorgu) + "&hl=tr&gl=TR&ceid=TR:tr"
    },
    {
      ad: "bing",
      url: "https://www.bing.com/news/search?q=" + encodeURIComponent(sorgu) + "&format=rss&setlang=tr-TR&cc=TR"
    }
  ];
}

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
  const cache = caches.default;
  const cacheKey = new Request("https://cache.internal/haberler/" + encodeURIComponent(HABER_SORGUSU), { method: "GET" });

  let cached = await cache.match(cacheKey);
  if (cached) return withCors(cached);

  let items = [];
  let kaynak = null;
  const hatalar = [];

  for (const k of haberKaynaklari(HABER_SORGUSU)) {
    try {
      const rssResp = await fetch(k.url, {
        cf: { cacheTtl: HABER_CACHE_SANIYE, cacheEverything: true },
        headers: TARAYICI_BASLIKLARI
      });
      if (!rssResp.ok) {
        hatalar.push(k.ad + ": HTTP " + rssResp.status);
        continue;
      }
      const xml = await rssResp.text();
      const bulunan = parseRss(xml)
        .sort(function (a, b) { return new Date(b.pubDate) - new Date(a.pubDate); })
        .slice(0, HABER_SAYISI);
      if (bulunan.length) {
        items = bulunan;
        kaynak = k.ad;
        break;
      }
      hatalar.push(k.ad + ": 0 haber bulundu");
    } catch (e) {
      hatalar.push(k.ad + ": " + String((e && e.message) || e));
    }
  }

  const body = JSON.stringify({
    updatedAt: new Date().toISOString(),
    query: HABER_SORGUSU,
    source: kaynak,
    items: items,
    error: items.length ? null : hatalar.join(" | ")
  });

  const response = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=" + HABER_CACHE_SANIYE
    }
  });

  if (items.length) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }
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
    .replace(/&#x([0-9a-fA-F]+);/g, function (_, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
    .replace(/&#(\d+);/g, function (_, dec) { return String.fromCodePoint(parseInt(dec, 10)); })
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export const __test__ = { parseRss, extractTag, stripTags, decodeEntities };
