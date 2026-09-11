/*
 * Cloudflare Worker — statik siteyi olduğu gibi sunar, ek olarak
 * /api/haberler adresinde canlı "kentsel dönüşüm" haberlerini çekip
 * JSON olarak döner (kenarda önbelleklenir), ve /ilan-detay.html ile
 * /rehber-detay.html isteklerinde ?id= parametresine göre <title>,
 * meta description, canonical, Open Graph etiketlerini ve JSON-LD
 * yapılandırılmış veriyi SUNUCU TARAFINDA (HTMLRewriter ile) o ilana/
 * rehbere özel değerlerle değiştirir. Bu sayede JavaScript çalıştırmayan
 * veya zayıf çalıştıran botlar (ör. YandexBot) bile ilana özel başlık/
 * açıklama/şema görür — statik dosyadaki jenerik içerik yalnızca id
 * bulunamazsa (veya veri okunamazsa) geri döner.
 *
 * Google Haberler RSS'i bulut/veri merkezi IP'lerinden gelen istekleri
 * zaman zaman 503 ile reddediyor; bu yüzden önce Google, başarısız
 * olursa Bing Haberler RSS'i denenir.
 */

const HABER_SORGUSU = "kentsel dönüşüm Ankara Altındağ İskitler";
const HABER_SAYISI = 10;
const HABER_CACHE_SANIYE = 3600; // 1 saat
// Parse/format mantığı değiştiğinde bu sürümü artırın — aksi halde eski
// (bozuk) yanıt, yeni kod deploy edilse bile TTL dolana kadar önbellekten
// gelmeye devam eder.
const HABER_CACHE_SURUMU = "v3";
const HABER_MAKS_YAS_GUN = 365; // bu süreden eski haberler "güncel" listede gösterilmez

const TARAYICI_BASLIKLARI = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, text/xml, application/xml;q=0.9, */*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.5"
};

const SITE_URL = "https://ibrahimyilmazgayrimenkul.com";
const COMPANY_NAME = "İbrahim Yılmaz Gayrimenkul";
const OG_FALLBACK_IMAGE = SITE_URL + "/assets/img/og-cover.png";

const OPERATION_LABELS = { kiralik: "Kiralık", satilik: "Satılık" };
const CATEGORY_LABELS = { daire: "Daire", dukkan: "Dükkan", isyeri: "İş Yeri", arsa: "Arsa", devren: "Devren", sanayi: "Fabrika / Sanayi" };

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
    if (url.pathname === "/ilan-detay.html" && url.searchParams.has("id")) {
      return withSeoMeta(request, env, "ilan");
    }
    if (url.pathname === "/rehber-detay.html" && url.searchParams.has("id")) {
      return withSeoMeta(request, env, "rehber");
    }
    return env.ASSETS.fetch(request);
  }
};

// ---------------------------------------------------------------------
// İlan/rehber detay sayfaları — sunucu taraflı SEO meta enjeksiyonu
// ---------------------------------------------------------------------

async function withSeoMeta(request, env, kind) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const assetResp = await env.ASSETS.fetch(request);
  if (!id || !assetResp.ok) return assetResp;

  const contentType = assetResp.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return assetResp;

  let item = null;
  try {
    if (kind === "ilan") {
      const listings = await fetchJsonAsset(request, env, "/data/listings.json");
      item = listings.find(function (l) { return l.id === id; }) || null;
    } else {
      const guides = await fetchJsonAsset(request, env, "/data/guides.json");
      item = guides.find(function (g) { return g.id === id; }) || null;
    }
  } catch (e) {
    return assetResp; // veri okunamadıysa statik (jenerik) içeriği aynen döndür
  }
  if (!item) return assetResp;

  const meta = kind === "ilan" ? buildIlanMeta(item) : buildRehberMeta(item);
  const schema = kind === "ilan" ? buildListingSchema(item) : buildGuideSchema(item);
  return applySeoRewrite(assetResp, meta, schema);
}

async function fetchJsonAsset(request, env, path) {
  const assetUrl = new URL(path, request.url);
  const resp = await env.ASSETS.fetch(new Request(assetUrl));
  if (!resp.ok) throw new Error("asset fetch failed: " + path);
  return resp.json();
}

function operationLabel(op) {
  return OPERATION_LABELS[op] || "Satılık";
}

function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}

function formatPriceNumber(n) {
  if (n === null || n === undefined || n === "") return null;
  return String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function currencySuffix(currency) {
  return currency === "USD" ? "$" : currency === "EUR" ? "€" : "TL";
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1).trim() + "…" : str;
}

function buildIlanTitle(listing) {
  const bits = [];
  if (listing.rooms) bits.push(listing.rooms);
  bits.push(categoryLabel(listing.category));
  const priceNum = formatPriceNumber(listing.price);
  if (priceNum) {
    var priceStr = priceNum + " " + currencySuffix(listing.currency);
    if (listing.operation === "kiralik") priceStr += "/ay";
    bits.push(priceStr);
  }
  var suffix = bits.join(" ");
  return listing.title + (suffix ? " - " + suffix : "") + " | " + COMPANY_NAME;
}

function buildIlanDescription(listing) {
  const loc = [listing.district, listing.city].filter(Boolean).join(", ") || "Ankara";
  const typeLabel = (listing.rooms ? listing.rooms + " " : "") + categoryLabel(listing.category);
  const bits = [typeLabel];
  if (listing.areaGross) bits.push(listing.areaGross + " m²");
  const priceNum = formatPriceNumber(listing.price);
  const priceStr = priceNum ? priceNum + " TL" + (listing.operation === "kiralik" ? "/ay" : "") : null;
  if (priceStr) bits.push(priceStr);

  var desc = loc + " — " + operationLabel(listing.operation) + " " + bits.join(", ");
  desc += ". " + COMPANY_NAME + " güvencesiyle detaylı bilgi ve WhatsApp ile hızlı iletişim.";
  return truncate(desc, 160);
}

function buildIlanMeta(listing) {
  var url = SITE_URL + "/ilan-detay.html?id=" + encodeURIComponent(listing.id);
  var image = listing.images && listing.images[0] ? SITE_URL + listing.images[0] : OG_FALLBACK_IMAGE;
  return {
    title: buildIlanTitle(listing),
    description: buildIlanDescription(listing),
    url: url,
    image: image
  };
}

function buildListingSchema(listing) {
  var url = SITE_URL + "/ilan-detay.html?id=" + encodeURIComponent(listing.id);
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "RealEstateListing"],
    name: listing.title,
    description: listing.description,
    url: url,
    image: (listing.images || []).map(function (i) { return SITE_URL + i; }),
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.addressText || listing.district,
      addressLocality: listing.district,
      addressRegion: listing.city,
      addressCountry: "TR"
    },
    geo: listing.lat && listing.lng ? { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng } : undefined,
    datePosted: listing.createdAt,
    offers: {
      "@type": "Offer",
      priceCurrency: listing.currency || "TRY",
      price: listing.price,
      availability: "https://schema.org/InStock",
      url: url,
      seller: { "@type": "RealEstateAgent", name: COMPANY_NAME }
    }
  };
}

function buildRehberMeta(guide) {
  var url = SITE_URL + "/rehber-detay.html?id=" + encodeURIComponent(guide.id);
  var image = guide.coverImage ? SITE_URL + guide.coverImage : OG_FALLBACK_IMAGE;
  return {
    title: guide.title + " | " + COMPANY_NAME,
    description: guide.excerpt || "",
    url: url,
    image: image
  };
}

function buildGuideSchema(guide) {
  var url = SITE_URL + "/rehber-detay.html?id=" + encodeURIComponent(guide.id);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    image: guide.coverImage ? SITE_URL + guide.coverImage : undefined,
    datePublished: guide.publishedAt,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: COMPANY_NAME },
    publisher: { "@type": "Organization", name: COMPANY_NAME }
  };
}

// HTMLRewriter element handler'ları
class AttrSetter {
  constructor(attr, value) {
    this.attr = attr;
    this.value = value;
  }
  element(el) {
    el.setAttribute(this.attr, this.value);
  }
}

class TextSetter {
  constructor(value) {
    this.value = value;
  }
  element(el) {
    el.setInnerContent(this.value);
  }
}

class HeadInjector {
  constructor(html) {
    this.html = html;
  }
  element(el) {
    el.append(this.html, { html: true });
  }
}

function applySeoRewrite(assetResp, meta, schema) {
  var schemaScript = '<script type="application/ld+json" id="ld-schema">' + JSON.stringify(schema) + "</script>";
  return new HTMLRewriter()
    .on("title", new TextSetter(meta.title))
    .on('meta[name="description"]', new AttrSetter("content", meta.description))
    .on('link[rel="canonical"]', new AttrSetter("href", meta.url))
    .on('meta[property="og:title"]', new AttrSetter("content", meta.title))
    .on('meta[property="og:description"]', new AttrSetter("content", meta.description))
    .on('meta[property="og:url"]', new AttrSetter("content", meta.url))
    .on('meta[property="og:image"]', new AttrSetter("content", meta.image))
    .on("head", new HeadInjector(schemaScript))
    .transform(assetResp);
}

// ---------------------------------------------------------------------
// /api/haberler
// ---------------------------------------------------------------------

async function handleHaberler(request, ctx) {
  const url = new URL(request.url);
  const taze = url.searchParams.has("fresh"); // ?fresh=1 -> önbelleği atla (test için)

  const cache = caches.default;
  const cacheKey = new Request(
    "https://cache.internal/haberler/" + HABER_CACHE_SURUMU + "/" + encodeURIComponent(HABER_SORGUSU),
    { method: "GET" }
  );

  if (!taze) {
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached);
  }

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
      const simdi = Date.now();
      const bulunan = parseRss(xml)
        .filter(function (it) {
          const t = new Date(it.pubDate).getTime();
          return !isNaN(t) && (simdi - t) <= HABER_MAKS_YAS_GUN * 86400000;
        })
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

  if (items.length && !taze) {
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

export const __test__ = {
  parseRss,
  extractTag,
  stripTags,
  decodeEntities,
  operationLabel,
  categoryLabel,
  formatPriceNumber,
  buildIlanTitle,
  buildIlanDescription,
  buildIlanMeta,
  buildListingSchema,
  buildRehberMeta,
  buildGuideSchema
};
