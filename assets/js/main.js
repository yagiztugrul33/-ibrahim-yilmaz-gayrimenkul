/*
 * main.js — İbrahim Yılmaz Gayrimenkul
 * Ortak veri katmanı + genel site davranışları (framework yok).
 * Bu dosya hem genel sayfalarda hem admin panelinde (config.js'den sonra) yüklenir.
 */
(function () {
  "use strict";

  var IYG = (window.IYG = window.IYG || {});
  IYG.STORAGE_KEY = "iyg_listings_v1";
  IYG.SETTINGS_KEY = "iyg_settings_override_v1";
  IYG.DATA_URL = "data/listings.json";
  IYG.GUIDES_URL = "data/guides.json";

  // ----------------------------------------------------------------------
  // Yardımcılar
  // ----------------------------------------------------------------------
  function relPrefix() {
    // admin/ klasöründen çağrıldığında bir üst dizine çık
    return location.pathname.indexOf("/admin/") !== -1 ? "../" : "";
  }

  IYG.formatPrice = function (num, currency) {
    if (num === null || num === undefined || num === "") return "Fiyat belirtilmemiş";
    var n = Number(num);
    var formatted = n.toLocaleString("tr-TR");
    var symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
    return formatted + " " + symbol;
  };

  IYG.operationLabel = function (op) {
    return op === "kiralik" ? "Kiralık" : "Satılık";
  };

  IYG.categoryLabel = function (cat) {
    var map = { daire: "Daire", dukkan: "Dükkan", isyeri: "İş Yeri", arsa: "Arsa", devren: "Devren", sanayi: "Fabrika / Sanayi" };
    return map[cat] || cat;
  };

  IYG.sha256Hex = async function (message) {
    var enc = new TextEncoder().encode(message);
    var buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.prototype.map
      .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  };

  IYG.resolveImg = function (src) {
    if (!src) return relPrefix() + "assets/img/placeholder.svg";
    if (/^(data:|https?:|\/)/.test(src)) return src;
    return relPrefix() + src;
  };

  IYG.uid = function () {
    return "iyg-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };

  IYG.qs = function (name, url) {
    var params = new URLSearchParams(url ? url.split("?")[1] : location.search);
    return params.get(name);
  };

  // ----------------------------------------------------------------------
  // Ayarlar (config.js + admin panelden yapılan localStorage override'ı)
  // ----------------------------------------------------------------------
  IYG.getSettingsOverride = function () {
    try {
      var raw = localStorage.getItem(IYG.SETTINGS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  IYG.saveSettingsOverride = function (obj) {
    localStorage.setItem(IYG.SETTINGS_KEY, JSON.stringify(obj));
  };

  IYG.getConfig = function () {
    var base = window.SITE_CONFIG || {};
    var override = IYG.getSettingsOverride();
    return Object.assign({}, base, override);
  };

  // ----------------------------------------------------------------------
  // İlan veri katmanı (localStorage; ilk ziyarette data/listings.json'dan tohumlanır)
  // ----------------------------------------------------------------------
  IYG.getListingsSync = function () {
    try {
      var raw = localStorage.getItem(IYG.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  IYG.saveListings = function (arr) {
    localStorage.setItem(IYG.STORAGE_KEY, JSON.stringify(arr));
  };

  IYG.getListings = async function () {
    var existing = IYG.getListingsSync();
    if (existing) return existing;
    try {
      var res = await fetch(relPrefix() + IYG.DATA_URL, { cache: "no-store" });
      var json = await res.json();
      IYG.saveListings(json);
      return json;
    } catch (e) {
      console.error("İlan verisi yüklenemedi:", e);
      return [];
    }
  };

  IYG.getListingById = async function (id) {
    var all = await IYG.getListings();
    return all.find(function (l) { return l.id === id; }) || null;
  };

  IYG.upsertListing = async function (listing) {
    var all = await IYG.getListings();
    var idx = all.findIndex(function (l) { return l.id === listing.id; });
    if (idx === -1) {
      all.unshift(listing);
    } else {
      all[idx] = listing;
    }
    IYG.saveListings(all);
    return all;
  };

  IYG.deleteListing = async function (id) {
    var all = await IYG.getListings();
    all = all.filter(function (l) { return l.id !== id; });
    IYG.saveListings(all);
    return all;
  };

  IYG.resetListingsToSeed = async function () {
    localStorage.removeItem(IYG.STORAGE_KEY);
    return IYG.getListings();
  };

  // ----------------------------------------------------------------------
  // WhatsApp
  // ----------------------------------------------------------------------
  IYG.waLink = function (text) {
    var cfg = IYG.getConfig();
    var number = (cfg.whatsappNumber || "").replace(/\D/g, "");
    return "https://wa.me/" + number + (text ? "?text=" + encodeURIComponent(text) : "");
  };

  // ----------------------------------------------------------------------
  // config.js değerlerini DOM'a bağlama: [data-cfg], [data-cfg-tel], [data-cfg-wa],
  // [data-cfg-mail], [data-cfg-href]
  // ----------------------------------------------------------------------
  IYG.applyConfigBindings = function () {
    var cfg = IYG.getConfig();

    document.querySelectorAll("[data-cfg]").forEach(function (el) {
      var key = el.getAttribute("data-cfg");
      if (cfg[key] !== undefined && cfg[key] !== null && cfg[key] !== "") {
        el.textContent = cfg[key];
      }
    });

    document.querySelectorAll("[data-cfg-tel]").forEach(function (el) {
      el.setAttribute("href", "tel:+" + (cfg.phoneHref || "").replace(/\D/g, ""));
    });

    document.querySelectorAll("[data-cfg-wa]").forEach(function (el) {
      var presetText = el.getAttribute("data-cfg-wa") || ("Merhaba " + cfg.companyName + ", bilgi almak istiyorum.");
      el.setAttribute("href", IYG.waLink(presetText));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });

    document.querySelectorAll("[data-cfg-mail]").forEach(function (el) {
      el.setAttribute("href", "mailto:" + cfg.email);
    });

    document.querySelectorAll("[data-cfg-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // Sosyal medya linkleri boşsa gizle
    document.querySelectorAll("[data-social]").forEach(function (el) {
      var key = el.getAttribute("data-social");
      var url = cfg.social && cfg.social[key];
      if (url) {
        el.setAttribute("href", url);
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

    var addrEls = document.querySelectorAll("[data-cfg-address]");
    addrEls.forEach(function (el) { el.textContent = cfg.addressLine; });

    var hoursEls = document.querySelectorAll("[data-cfg-hours]");
    hoursEls.forEach(function (el) { el.textContent = cfg.workingHoursDisplay; });
  };

  // ----------------------------------------------------------------------
  // Google entegrasyonları (GA4 / GTM / Search Console) — sadece dolu ise yüklenir
  // ----------------------------------------------------------------------
  IYG.loadGoogleIntegrations = function () {
    var cfg = IYG.getConfig();

    if (cfg.searchConsoleVerify) {
      var meta = document.createElement("meta");
      meta.name = "google-site-verification";
      meta.content = cfg.searchConsoleVerify;
      document.head.appendChild(meta);
    }

    if (cfg.gtmId) {
      var gtmScript = document.createElement("script");
      gtmScript.innerHTML =
        "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
        "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
        "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
        "})(window,document,'script','dataLayer','" + cfg.gtmId + "');";
      document.head.appendChild(gtmScript);

      var noscript = document.createElement("noscript");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.googletagmanager.com/ns.html?id=" + cfg.gtmId;
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    if (cfg.ga4Id) {
      var s1 = document.createElement("script");
      s1.async = true;
      s1.src = "https://www.googletagmanager.com/gtag/js?id=" + cfg.ga4Id;
      document.head.appendChild(s1);

      var s2 = document.createElement("script");
      s2.innerHTML =
        "window.dataLayer = window.dataLayer || [];" +
        "function gtag(){dataLayer.push(arguments);}" +
        "gtag('js', new Date());" +
        "gtag('config', '" + cfg.ga4Id + "');";
      document.head.appendChild(s2);
    }
  };

  // ----------------------------------------------------------------------
  // schema.org yapısal veri — RealEstateAgent / LocalBusiness (her sayfa)
  // ----------------------------------------------------------------------
  IYG.injectLocalBusinessSchema = function () {
    var cfg = IYG.getConfig();
    var openingHours = (cfg.workingHoursSchema || []).map(function (row) {
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: row.days,
        opens: row.opens,
        closes: row.closes
      };
    });

    var data = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: cfg.companyName,
      description: cfg.slogan,
      url: cfg.siteUrl,
      telephone: "+" + (cfg.phoneHref || "").replace(/\D/g, ""),
      email: cfg.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: cfg.addressLine,
        addressLocality: cfg.addressLocality,
        addressRegion: cfg.addressRegion,
        postalCode: cfg.postalCode,
        addressCountry: cfg.addressCountry
      },
      geo: { "@type": "GeoCoordinates", latitude: cfg.geoLat, longitude: cfg.geoLng },
      areaServed: cfg.areaServed,
      openingHoursSpecification: openingHours,
      sameAs: [cfg.social && cfg.social.instagram, cfg.social && cfg.social.facebook].filter(Boolean),
      priceRange: "₺₺"
    };

    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-localbusiness";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  };

  IYG.injectListingSchema = function (listing) {
    var cfg = IYG.getConfig();
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: listing.title,
      description: listing.description,
      image: (listing.images || []).map(function (i) { return cfg.siteUrl + i; }),
      brand: cfg.companyName,
      offers: {
        "@type": "Offer",
        priceCurrency: listing.currency || "TRY",
        price: listing.price,
        availability: "https://schema.org/InStock",
        url: cfg.siteUrl + "/ilan-detay.html?id=" + listing.id,
        seller: { "@type": "RealEstateAgent", name: cfg.companyName }
      }
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-product";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  };

  // ----------------------------------------------------------------------
  // Mobil menü
  // ----------------------------------------------------------------------
  IYG.markCurrentNavLink = function () {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a[href]").forEach(function (a) {
      var href = a.getAttribute("href").split("/").pop();
      if (href === here) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };

  IYG.initNav = function () {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    var backdrop = document.querySelector(".nav-backdrop");
    if (!toggle || !nav) return;
    function close() {
      nav.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    function open() {
      nav.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }
    toggle.addEventListener("click", function () {
      nav.classList.contains("is-open") ? close() : open();
    });
    if (backdrop) backdrop.addEventListener("click", close);
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", close); });
  };

  // ----------------------------------------------------------------------
  // Kart render
  // ----------------------------------------------------------------------
  IYG.listingCardHTML = function (l) {
    var img = (l.images && l.images[0]) || "/assets/img/placeholder.svg";
    return (
      '<article class="listing-card">' +
      '<a class="thumb" href="ilan-detay.html?id=' + encodeURIComponent(l.id) + '">' +
      '<span class="badge ' + (l.operation === "kiralik" ? "kiralik" : "") + '">' + IYG.operationLabel(l.operation) + "</span>" +
      '<img src="' + img + '" alt="' + escapeHtml(l.title) + '" loading="lazy" width="400" height="300"></a>' +
      '<div class="body">' +
      '<div class="price">' + IYG.formatPrice(l.price, l.currency) + (l.operation === "kiralik" ? " /ay" : "") + "</div>" +
      '<h3><a href="ilan-detay.html?id=' + encodeURIComponent(l.id) + '">' + escapeHtml(l.title) + "</a></h3>" +
      '<div class="loc">' + escapeHtml(l.district) + ", " + escapeHtml(l.city) + "</div>" +
      '<div class="meta">' +
      (l.rooms ? "<span>" + l.rooms + "</span>" : "") +
      (l.areaGross ? "<span>" + l.areaGross + " m²</span>" : "") +
      "<span>" + IYG.categoryLabel(l.category) + "</span>" +
      "</div>" +
      '<div class="cta-row">' +
      '<a class="btn btn-outline btn-sm" href="ilan-detay.html?id=' + encodeURIComponent(l.id) + '">Detay</a>' +
      '<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" href="' +
      IYG.waLink("Merhaba, \"" + l.title + "\" ilanı hakkında bilgi almak istiyorum.") +
      '">WhatsApp</a>' +
      "</div></div></article>"
    );
  };

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  IYG.escapeHtml = escapeHtml;

  // ----------------------------------------------------------------------
  // Genel form -> WhatsApp yönlendirme (sunucu gerekmez)
  // ----------------------------------------------------------------------
  IYG.wireWhatsAppForm = function (formEl, buildMessage) {
    if (!formEl) return;
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(formEl).entries());
      var msg = buildMessage(data);
      window.open(IYG.waLink(msg), "_blank", "noopener");
      var note = formEl.querySelector(".form-success-note");
      if (note) note.classList.remove("hidden");
      formEl.reset();
    });
  };

  // ----------------------------------------------------------------------
  // Google Maps embed (API anahtarı gerekmez)
  // ----------------------------------------------------------------------
  IYG.mapsEmbedSrc = function (lat, lng, zoom) {
    return "https://www.google.com/maps?q=" + lat + "," + lng + "&hl=tr&z=" + (zoom || 15) + "&output=embed";
  };

  // ----------------------------------------------------------------------
  // ANA SAYFA
  // ----------------------------------------------------------------------
  IYG.initHomePage = async function () {
    var listings = await IYG.getListings();
    var featured = listings.filter(function (l) { return l.featured; }).slice(0, 3);
    var latest = listings
      .slice()
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 6);

    var featuredEl = document.getElementById("featured-listings");
    if (featuredEl) featuredEl.innerHTML = featured.map(IYG.listingCardHTML).join("") || '<p class="text-muted">Henüz öne çıkan ilan yok.</p>';

    var latestEl = document.getElementById("latest-listings");
    if (latestEl) latestEl.innerHTML = latest.map(IYG.listingCardHTML).join("") || '<p class="text-muted">Henüz ilan eklenmedi.</p>';

    var searchForm = document.getElementById("home-search-form");
    if (searchForm) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var params = new URLSearchParams(new FormData(searchForm));
        // Boş alanları temizle
        Array.from(params.keys()).forEach(function (k) {
          if (!params.get(k)) params.delete(k);
        });
        window.location.href = "ilanlar.html?" + params.toString();
      });
    }
  };

  // ----------------------------------------------------------------------
  // İLANLAR SAYFASI (filtre + liste + sayfalama)
  // ----------------------------------------------------------------------
  IYG.initListingsPage = async function () {
    var all = await IYG.getListings();
    var grid = document.getElementById("listings-grid");
    var countEl = document.getElementById("result-count");
    var emptyEl = document.getElementById("empty-state");
    var pagerEl = document.getElementById("pagination");
    var form = document.getElementById("filters-form");
    var PAGE_SIZE = 9;
    var currentPage = 1;

    function readFilters() {
      var fd = new FormData(form);
      return {
        operation: fd.get("operation") || "",
        category: fd.get("category") || "",
        district: fd.get("district") || "",
        rooms: fd.get("rooms") || "",
        min: fd.get("min") ? Number(fd.get("min")) : null,
        max: fd.get("max") ? Number(fd.get("max")) : null,
        sort: fd.get("sort") || "yeni"
      };
    }

    function applyFilters(list, f) {
      return list.filter(function (l) {
        if (f.operation && l.operation !== f.operation) return false;
        if (f.category && l.category !== f.category) return false;
        if (f.district && l.district !== f.district) return false;
        if (f.rooms && l.rooms !== f.rooms) return false;
        if (f.min !== null && l.price < f.min) return false;
        if (f.max !== null && l.price > f.max) return false;
        return true;
      });
    }

    function sortList(list, sort) {
      var copy = list.slice();
      if (sort === "fiyat-artan") copy.sort(function (a, b) { return a.price - b.price; });
      else if (sort === "fiyat-azalan") copy.sort(function (a, b) { return b.price - a.price; });
      else copy.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      return copy;
    }

    function render() {
      var f = readFilters();
      var filtered = sortList(applyFilters(all, f), f.sort);
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      currentPage = Math.min(currentPage, totalPages);
      var pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

      if (countEl) countEl.textContent = filtered.length + " ilan bulundu";
      if (grid) grid.innerHTML = pageItems.map(IYG.listingCardHTML).join("");
      if (emptyEl) emptyEl.classList.toggle("hidden", filtered.length > 0);

      if (pagerEl) {
        pagerEl.innerHTML = "";
        if (totalPages > 1) {
          for (var p = 1; p <= totalPages; p++) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = String(p);
            if (p === currentPage) btn.setAttribute("aria-current", "page");
            btn.addEventListener("click", function () {
              currentPage = Number(this.textContent);
              render();
              grid.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            pagerEl.appendChild(btn);
          }
        }
      }
    }

    // URL parametrelerinden ilk filtreleri doldur
    var initParams = new URLSearchParams(location.search);
    initParams.forEach(function (value, key) {
      var input = form.querySelector('[name="' + key + '"]');
      if (input) input.value = value;
    });

    form.addEventListener("input", function () { currentPage = 1; render(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); currentPage = 1; render(); });
    var resetBtn = document.getElementById("filters-reset");
    if (resetBtn) resetBtn.addEventListener("click", function () { form.reset(); currentPage = 1; render(); });

    render();
  };

  // ----------------------------------------------------------------------
  // İLAN DETAY SAYFASI
  // ----------------------------------------------------------------------
  IYG.initDetailPage = async function () {
    var id = IYG.qs("id");
    var wrap = document.getElementById("detail-wrap");
    var notFound = document.getElementById("detail-not-found");
    if (!id) { if (notFound) notFound.classList.remove("hidden"); if (wrap) wrap.classList.add("hidden"); return; }

    var listing = await IYG.getListingById(id);
    if (!listing) { if (notFound) notFound.classList.remove("hidden"); if (wrap) wrap.classList.add("hidden"); return; }

    var cfg = IYG.getConfig();

    document.title = listing.title + " | " + cfg.companyName;
    var metaDesc = document.querySelector('meta[name="description"]');
    var descText = (listing.description || "").slice(0, 155);
    if (metaDesc) metaDesc.setAttribute("content", descText);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", listing.title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", descText);
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && listing.images && listing.images[0]) ogImg.setAttribute("content", cfg.siteUrl + listing.images[0]);

    IYG.injectListingSchema(listing);

    document.getElementById("breadcrumb-current").textContent = listing.title;
    document.getElementById("detail-title").textContent = listing.title;
    document.getElementById("detail-price").textContent = IYG.formatPrice(listing.price, listing.currency) + (listing.operation === "kiralik" ? " /ay" : "");
    document.getElementById("detail-loc").textContent = listing.district + ", " + listing.city;
    document.getElementById("detail-desc").textContent = listing.description;
    document.getElementById("detail-badge").textContent = IYG.operationLabel(listing.operation) + " · " + IYG.categoryLabel(listing.category);

    // Galeri
    var mainImg = document.getElementById("gallery-main-img");
    var thumbsWrap = document.getElementById("gallery-thumbs");
    var images = (listing.images && listing.images.length) ? listing.images : ["assets/img/placeholder.svg"];
    mainImg.src = images[0];
    mainImg.alt = listing.title;
    thumbsWrap.innerHTML = images
      .map(function (src, i) { return '<img src="' + src + '" alt="Görsel ' + (i + 1) + '" class="' + (i === 0 ? "active" : "") + '">'; })
      .join("");
    thumbsWrap.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("click", function () {
        mainImg.src = img.src;
        thumbsWrap.querySelectorAll("img").forEach(function (t) { t.classList.remove("active"); });
        img.classList.add("active");
      });
    });

    // Özellik tablosu
    var rows = [
      ["İşlem", IYG.operationLabel(listing.operation)],
      ["Tür", IYG.categoryLabel(listing.category)],
      ["Oda Sayısı", listing.rooms],
      ["Brüt m²", listing.areaGross ? listing.areaGross + " m²" : null],
      ["Net m²", listing.areaNet ? listing.areaNet + " m²" : null],
      ["Bulunduğu Kat", listing.floor],
      ["Bina Kat Sayısı", listing.buildingFloors],
      ["Bina Yaşı", listing.buildingAge !== null && listing.buildingAge !== undefined ? listing.buildingAge : null],
      ["Isıtma", listing.heating],
      ["Banyo Sayısı", listing.bathrooms],
      ["Tapu Durumu", listing.titleDeedStatus],
      ["Krediye Uygunluk", listing.creditEligible === true ? "Evet" : listing.creditEligible === false ? "Hayır" : null]
    ].filter(function (r) { return r[1] !== null && r[1] !== undefined && r[1] !== ""; });

    document.getElementById("feature-table-body").innerHTML = rows
      .map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + escapeHtml(String(r[1])) + "</td></tr>"; })
      .join("");

    document.getElementById("chip-list").innerHTML = (listing.features || [])
      .map(function (f) { return '<span class="chip">' + escapeHtml(f) + "</span>"; })
      .join("");

    // Harita
    var mapFrame = document.getElementById("detail-map-frame");
    if (mapFrame) mapFrame.src = IYG.mapsEmbedSrc(listing.lat || cfg.geoLat, listing.lng || cfg.geoLng, 15);

    // WhatsApp CTA
    var waText = "Merhaba, \"" + listing.title + "\" (" + IYG.formatPrice(listing.price, listing.currency) + ") ilanı hakkında bilgi almak istiyorum.";
    document.querySelectorAll(".detail-wa-btn").forEach(function (el) {
      el.setAttribute("href", IYG.waLink(waText));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
    document.querySelectorAll(".detail-tel-btn").forEach(function (el) {
      el.setAttribute("href", "tel:+" + (cfg.phoneHref || "").replace(/\D/g, ""));
    });

    // Bilgi talep formu
    var reqForm = document.getElementById("listing-request-form");
    IYG.wireWhatsAppForm(reqForm, function (data) {
      return (
        "Merhaba, \"" + listing.title + "\" ilanı hakkında bilgi almak istiyorum.\n" +
        "Ad Soyad: " + (data.name || "-") + "\n" +
        "Telefon: " + (data.phone || "-") + "\n" +
        "Mesaj: " + (data.message || "-")
      );
    });

    // Benzer ilanlar
    var all = await IYG.getListings();
    var similar = all
      .filter(function (l) { return l.id !== listing.id && l.category === listing.category && l.operation === listing.operation })
      .slice(0, 3);
    var similarEl = document.getElementById("similar-listings");
    if (similarEl) similarEl.innerHTML = similar.map(IYG.listingCardHTML).join("") || '<p class="text-muted">Benzer ilan bulunamadı.</p>';
  };

  // ----------------------------------------------------------------------
  // İLETİŞİM SAYFASI
  // ----------------------------------------------------------------------
  IYG.initContactPage = function () {
    var cfg = IYG.getConfig();
    var mapFrame = document.getElementById("contact-map-frame");
    if (mapFrame) mapFrame.src = IYG.mapsEmbedSrc(cfg.geoLat, cfg.geoLng, 15);

    var form = document.getElementById("contact-form");
    IYG.wireWhatsAppForm(form, function (data) {
      return (
        "Merhaba, " + cfg.companyName + " üzerinden iletişim formu dolduruyorum.\n" +
        "Ad Soyad: " + (data.name || "-") + "\n" +
        "Telefon: " + (data.phone || "-") + "\n" +
        "Konu: " + (data.subject || "-") + "\n" +
        "Mesaj: " + (data.message || "-")
      );
    });
  };

  // ----------------------------------------------------------------------
  // REHBERLER / BLOG
  // ----------------------------------------------------------------------
  IYG.getGuides = async function () {
    try {
      var res = await fetch(relPrefix() + IYG.GUIDES_URL, { cache: "no-store" });
      return await res.json();
    } catch (e) {
      console.error("Rehber verisi yüklenemedi:", e);
      return [];
    }
  };

  IYG.guideCardHTML = function (g) {
    return (
      '<article class="guide-card">' +
      '<a class="guide-thumb" href="rehber-detay.html?id=' + encodeURIComponent(g.id) + '">' +
      '<img src="' + g.coverImage + '" alt="" loading="lazy"></a>' +
      '<div class="guide-body">' +
      '<span class="eyebrow">' + escapeHtml(g.category) + '</span>' +
      '<h3><a href="rehber-detay.html?id=' + encodeURIComponent(g.id) + '">' + escapeHtml(g.title) + '</a></h3>' +
      '<p>' + escapeHtml(g.excerpt) + '</p>' +
      '<div class="guide-meta">' + (g.readMinutes || 4) + ' dk okuma</div>' +
      '</div></article>'
    );
  };

  IYG.initGuidesPage = async function () {
    var guides = await IYG.getGuides();
    var konu = IYG.qs("konu");
    var filtered = konu
      ? guides.filter(function (g) { return (g.tags || []).indexOf(konu) !== -1; })
      : guides;
    filtered = filtered.slice().sort(function (a, b) {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
    var grid = document.getElementById("guides-grid");
    if (grid) grid.innerHTML = filtered.map(IYG.guideCardHTML).join("");

    if (konu === "kentsel-donusum") {
      var heading = document.getElementById("guides-heading");
      var lead = document.getElementById("guides-lead");
      if (heading) heading.textContent = "İskitler'de Kentsel Dönüşüm Haberleri";
      if (lead) lead.textContent = "İskitler ve Altındağ'da kentsel dönüşüm süreciyle ilgili güncel bilgilendirmeler; riskli yapı tespiti, kira yardımı, harç muafiyeti ve süreç adımları.";
      document.title = "Kentsel Dönüşüm Haberleri | İbrahim Yılmaz Gayrimenkul";
    }
  };

  IYG.initGuideDetailPage = async function () {
    var id = IYG.qs("id");
    var guides = await IYG.getGuides();
    var guide = guides.find(function (g) { return g.id === id; });
    var wrap = document.getElementById("guide-wrap");
    var notFound = document.getElementById("guide-not-found");
    if (!guide) {
      if (notFound) notFound.classList.remove("hidden");
      if (wrap) wrap.classList.add("hidden");
      return;
    }
    var cfg = IYG.getConfig();
    document.title = guide.title + " | " + cfg.companyName;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", guide.excerpt);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", guide.title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", guide.excerpt);

    document.getElementById("breadcrumb-current").textContent = guide.title;
    document.getElementById("guide-category").textContent = guide.category;
    document.getElementById("guide-title").textContent = guide.title;
    document.getElementById("guide-meta").textContent = guide.readMinutes + " dk okuma · " + new Date(guide.publishedAt).toLocaleDateString("tr-TR");
    document.getElementById("guide-cover").src = guide.coverImage;
    document.getElementById("guide-cover").alt = guide.title;

    var body = document.getElementById("guide-content");
    body.innerHTML = (guide.sections || [])
      .map(function (s) { return "<h2>" + escapeHtml(s.heading) + "</h2><p>" + escapeHtml(s.body) + "</p>"; })
      .join("");

    var schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.excerpt,
      image: guide.coverImage,
      datePublished: guide.publishedAt,
      author: { "@type": "Organization", name: cfg.companyName },
      publisher: { "@type": "Organization", name: cfg.companyName }
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    var related = guides.filter(function (g) { return g.id !== guide.id; }).slice(0, 3);
    var relatedEl = document.getElementById("related-guides");
    if (relatedEl) relatedEl.innerHTML = related.map(IYG.guideCardHTML).join("");
  };

  // ----------------------------------------------------------------------
  // DEĞERLEME TALEP FORMU
  // ----------------------------------------------------------------------
  IYG.initValuationPage = function () {
    var form = document.getElementById("valuation-form");
    IYG.wireWhatsAppForm(form, function (data) {
      return (
        "Merhaba, gayrimenkulümün değerlemesini talep etmek istiyorum.\n" +
        "Ad Soyad: " + (data.name || "-") + "\n" +
        "Telefon: " + (data.phone || "-") + "\n" +
        "Gayrimenkul Türü: " + (data.type || "-") + "\n" +
        "İşlem: " + (data.operation || "-") + "\n" +
        "Adres/Bölge: " + (data.address || "-") + "\n" +
        "Yaklaşık m²: " + (data.area || "-") + "\n" +
        "Not: " + (data.message || "-")
      );
    });
  };

  // ----------------------------------------------------------------------
  // Sayfa açılışında ortak kurulum
  // ----------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    IYG.applyConfigBindings();
    IYG.loadGoogleIntegrations();
    IYG.injectLocalBusinessSchema();
    IYG.initNav();
    IYG.markCurrentNavLink();

    var page = document.body.getAttribute("data-page");
    if (page === "home") IYG.initHomePage();
    if (page === "listings") IYG.initListingsPage();
    if (page === "detail") IYG.initDetailPage();
    if (page === "contact") IYG.initContactPage();
    if (page === "guides") IYG.initGuidesPage();
    if (page === "guide-detail") IYG.initGuideDetailPage();
    if (page === "valuation") IYG.initValuationPage();
  });
})();
