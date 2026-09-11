#!/usr/bin/env node
// sitemap.xml'i data/listings.json + data/guides.json'dan otomatik üretir.
// Elle URL eklemek/çıkarmak yerine: `node scripts/generate-sitemap.mjs`
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITE_URL = "https://ibrahimyilmazgayrimenkul.com";

const STATIC_PAGES = [
  { loc: "index.html", changefreq: "weekly", priority: "1.0" },
  { loc: "ilanlar.html", changefreq: "daily", priority: "0.9" },
  { loc: "hakkimizda.html", changefreq: "monthly", priority: "0.6" },
  { loc: "iletisim.html", changefreq: "monthly", priority: "0.6" },
  { loc: "hizmetler.html", changefreq: "monthly", priority: "0.7" },
  { loc: "degerleme.html", changefreq: "monthly", priority: "0.7" },
  { loc: "rehberler.html", changefreq: "weekly", priority: "0.7" },
  { loc: "sss.html", changefreq: "monthly", priority: "0.6" },
  { loc: "rehberler.html?konu=kentsel-donusum", changefreq: "weekly", priority: "0.7" }
];

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, changefreq, priority) {
  return (
    "  <url>\n" +
    "    <loc>" + xmlEscape(SITE_URL + "/" + loc) + "</loc>\n" +
    "    <changefreq>" + changefreq + "</changefreq>\n" +
    "    <priority>" + priority + "</priority>\n" +
    "  </url>"
  );
}

const listings = JSON.parse(readFileSync(join(ROOT, "data/listings.json"), "utf8"));
const guides = JSON.parse(readFileSync(join(ROOT, "data/guides.json"), "utf8"));

const activeListings = listings.filter((l) => (l.status || "aktif") === "aktif");

const entries = [];
STATIC_PAGES.forEach((p) => entries.push(urlEntry(p.loc, p.changefreq, p.priority)));
guides.forEach((g) => entries.push(urlEntry("rehber-detay.html?id=" + encodeURIComponent(g.id), "monthly", "0.6")));
activeListings.forEach((l) => entries.push(urlEntry("ilan-detay.html?id=" + encodeURIComponent(l.id), "daily", "0.8")));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.join("\n") +
  "\n</urlset>\n";

writeFileSync(join(ROOT, "sitemap.xml"), xml, "utf8");

console.log(
  "sitemap.xml üretildi: " +
    STATIC_PAGES.length +
    " statik sayfa + " +
    guides.length +
    " rehber + " +
    activeListings.length +
    " aktif ilan (" +
    (listings.length - activeListings.length) +
    " pasif ilan hariç tutuldu) = " +
    entries.length +
    " URL"
);
