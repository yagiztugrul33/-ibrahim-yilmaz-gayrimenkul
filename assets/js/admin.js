/*
 * admin.js — /admin paneline özel mantık.
 * config.js ve main.js dosyalarından SONRA yüklenir.
 */
(function () {
  "use strict";
  var IYG = window.IYG;
  var SESSION_KEY = "iyg_admin_session_v1";

  var viewLogin = document.getElementById("view-login");
  var viewPanel = document.getElementById("view-panel");

  var currentImages = []; // modal için geçici görsel listesi

  // ----------------------------------------------------------------------
  // Oturum
  // ----------------------------------------------------------------------
  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isAuthenticated() {
    var s = getSession();
    return !!(s && s.expiresAt && Date.now() < s.expiresAt);
  }

  function startSession() {
    var cfg = IYG.getConfig();
    var minutes = cfg.adminSessionMinutes || 60;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + minutes * 60000 }));
  }

  function endSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function showLogin() {
    viewLogin.classList.remove("hidden");
    viewPanel.classList.add("hidden");
  }

  function showPanel() {
    viewLogin.classList.add("hidden");
    viewPanel.classList.remove("hidden");
    var cfg = IYG.getConfig();
    document.getElementById("session-info").textContent = cfg.companyName + " — oturum " + (cfg.adminSessionMinutes || 60) + " dk açık kalır";
    refreshDashboard();
    refreshListingsTable();
    fillSettingsForm();
  }

  document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var pass = document.getElementById("login-password").value;
    var cfg = IYG.getConfig();
    var hash = await IYG.sha256Hex(pass);
    var errorEl = document.getElementById("login-error");
    if (hash === cfg.adminPasswordHash) {
      errorEl.classList.add("hidden");
      startSession();
      showPanel();
    } else {
      errorEl.classList.remove("hidden");
    }
  });

  document.getElementById("btn-logout").addEventListener("click", function () {
    endSession();
    showLogin();
  });

  // ----------------------------------------------------------------------
  // Sekme geçişleri
  // ----------------------------------------------------------------------
  document.querySelectorAll(".admin-sidebar .nav-item[data-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".admin-sidebar .nav-item[data-tab]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab").forEach(function (sec) { sec.classList.add("hidden"); });
      document.getElementById("tab-" + tab).classList.remove("hidden");
    });
  });

  // ----------------------------------------------------------------------
  // Özet
  // ----------------------------------------------------------------------
  async function refreshDashboard() {
    var all = await IYG.getListings();
    document.getElementById("stat-total").textContent = all.length;
    document.getElementById("stat-satilik").textContent = all.filter(function (l) { return l.operation === "satilik"; }).length;
    document.getElementById("stat-kiralik").textContent = all.filter(function (l) { return l.operation === "kiralik"; }).length;
    document.getElementById("stat-featured").textContent = all.filter(function (l) { return l.featured; }).length;
  }

  // ----------------------------------------------------------------------
  // İlan tablosu
  // ----------------------------------------------------------------------
  async function refreshListingsTable() {
    var all = await IYG.getListings();
    var body = document.getElementById("admin-listings-body");
    body.innerHTML = all.map(function (l) {
      var img = IYG.resolveImg(l.images && l.images[0]);
      return (
        "<tr>" +
        '<td><img class="thumb-sm" src="' + img + '" alt=""></td>' +
        "<td>" + IYG.escapeHtml(l.title) + "</td>" +
        "<td>" + IYG.operationLabel(l.operation) + "</td>" +
        "<td>" + IYG.categoryLabel(l.category) + "</td>" +
        "<td>" + IYG.formatPrice(l.price, l.currency) + "</td>" +
        "<td>" + IYG.escapeHtml(l.district || "") + "</td>" +
        '<td><span class="status-pill ' + (l.status || "aktif") + '">' + (l.status || "aktif") + "</span></td>" +
        '<td class="row-actions">' +
        '<button class="btn btn-outline btn-sm" data-edit="' + l.id + '">Düzenle</button>' +
        '<button class="btn btn-danger btn-sm" data-delete="' + l.id + '">Sil</button>' +
        "</td></tr>"
      );
    }).join("");

    body.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () { openModalForEdit(btn.getAttribute("data-edit")); });
    });
    body.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var id = btn.getAttribute("data-delete");
        if (confirm("Bu ilanı silmek istediğinize emin misiniz?")) {
          await IYG.deleteListing(id);
          refreshListingsTable();
          refreshDashboard();
        }
      });
    });
  }

  // ----------------------------------------------------------------------
  // İlan modalı
  // ----------------------------------------------------------------------
  var modal = document.getElementById("listing-modal");
  var listingForm = document.getElementById("listing-form");

  function openModal() { modal.classList.remove("hidden"); }
  function closeModal() {
    modal.classList.add("hidden");
    listingForm.reset();
    currentImages = [];
    renderImagePreviews();
  }

  document.getElementById("btn-new-listing").addEventListener("click", function () {
    document.getElementById("modal-title").textContent = "Yeni İlan";
    listingForm.reset();
    listingForm.elements["id"].value = "";
    currentImages = [];
    renderImagePreviews();
    openModal();
  });
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  async function openModalForEdit(id) {
    var listing = await IYG.getListingById(id);
    if (!listing) return;
    document.getElementById("modal-title").textContent = "İlanı Düzenle";
    var f = listingForm;
    f.elements["id"].value = listing.id;
    f.elements["title"].value = listing.title || "";
    f.elements["operation"].value = listing.operation || "satilik";
    f.elements["category"].value = listing.category || "daire";
    f.elements["price"].value = listing.price || "";
    f.elements["district"].value = listing.district || "İskitler";
    f.elements["addressText"].value = listing.addressText || "";
    f.elements["rooms"].value = listing.rooms || "";
    f.elements["areaGross"].value = listing.areaGross || "";
    f.elements["areaNet"].value = listing.areaNet || "";
    f.elements["floor"].value = listing.floor || "";
    f.elements["buildingFloors"].value = listing.buildingFloors || "";
    f.elements["buildingAge"].value = listing.buildingAge != null ? listing.buildingAge : "";
    f.elements["heating"].value = listing.heating || "";
    f.elements["bathrooms"].value = listing.bathrooms || "";
    f.elements["titleDeedStatus"].value = listing.titleDeedStatus || "";
    f.elements["status"].value = listing.status || "aktif";
    f.elements["lat"].value = listing.lat || "";
    f.elements["lng"].value = listing.lng || "";
    f.elements["featured"].checked = !!listing.featured;
    f.elements["creditEligible"].checked = !!listing.creditEligible;
    f.elements["description"].value = listing.description || "";
    f.elements["featuresText"].value = (listing.features || []).join(", ");
    currentImages = (listing.images || []).slice();
    renderImagePreviews();
    openModal();
  }

  function renderImagePreviews() {
    var wrap = document.getElementById("image-preview-list");
    wrap.innerHTML = currentImages.map(function (src, i) {
      return (
        '<span class="chip" style="display:flex;align-items:center;gap:6px;">' +
        '<img src="' + IYG.resolveImg(src) + '" alt="" style="width:36px;height:26px;object-fit:cover;border-radius:3px;">' +
        'Görsel ' + (i + 1) +
        '<button type="button" data-remove-img="' + i + '" style="border:none;background:none;color:var(--color-danger);cursor:pointer;">×</button>' +
        "</span>"
      );
    }).join("") || '<span class="text-muted">Henüz görsel eklenmedi (varsayılan görsel kullanılacak).</span>';

    wrap.querySelectorAll("[data-remove-img]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentImages.splice(Number(btn.getAttribute("data-remove-img")), 1);
        renderImagePreviews();
      });
    });
  }

  document.getElementById("image-upload-input").addEventListener("change", function (e) {
    var files = Array.from(e.target.files || []);
    var readers = files.map(function (file) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(function (results) {
      currentImages = currentImages.concat(results);
      renderImagePreviews();
      e.target.value = "";
    });
  });

  listingForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    var fd = new FormData(listingForm);
    var id = fd.get("id") || IYG.uid();
    var featuresText = fd.get("featuresText") || "";
    var listing = {
      id: id,
      title: fd.get("title"),
      operation: fd.get("operation"),
      category: fd.get("category"),
      price: Number(fd.get("price")) || 0,
      currency: "TRY",
      city: "Ankara",
      district: fd.get("district"),
      addressText: fd.get("addressText"),
      rooms: fd.get("rooms") || null,
      areaGross: fd.get("areaGross") ? Number(fd.get("areaGross")) : null,
      areaNet: fd.get("areaNet") ? Number(fd.get("areaNet")) : null,
      floor: fd.get("floor") || null,
      buildingFloors: fd.get("buildingFloors") ? Number(fd.get("buildingFloors")) : null,
      buildingAge: fd.get("buildingAge") !== "" ? Number(fd.get("buildingAge")) : null,
      heating: fd.get("heating") || null,
      bathrooms: fd.get("bathrooms") ? Number(fd.get("bathrooms")) : null,
      titleDeedStatus: fd.get("titleDeedStatus") || null,
      status: fd.get("status"),
      lat: fd.get("lat") ? Number(fd.get("lat")) : null,
      lng: fd.get("lng") ? Number(fd.get("lng")) : null,
      featured: fd.get("featured") === "on",
      creditEligible: fd.get("creditEligible") === "on",
      description: fd.get("description"),
      features: featuresText.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      images: currentImages.length ? currentImages : ["assets/img/placeholder.svg"],
      createdAt: new Date().toISOString().slice(0, 10)
    };
    await IYG.upsertListing(listing);
    closeModal();
    refreshListingsTable();
    refreshDashboard();
  });

  // ----------------------------------------------------------------------
  // Site Ayarları (önizleme override)
  // ----------------------------------------------------------------------
  function fillSettingsForm() {
    var cfg = IYG.getConfig();
    var f = document.getElementById("settings-form");
    ["phoneDisplay", "phoneHref", "whatsappNumber", "email", "addressLine", "workingHoursDisplay", "geoLat", "geoLng", "ga4Id", "gtmId", "searchConsoleVerify"]
      .forEach(function (key) { if (f.elements[key]) f.elements[key].value = cfg[key] || ""; });
    if (f.elements["social.instagram"]) f.elements["social.instagram"].value = (cfg.social && cfg.social.instagram) || "";
    if (f.elements["social.facebook"]) f.elements["social.facebook"].value = (cfg.social && cfg.social.facebook) || "";
  }

  document.getElementById("settings-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var override = IYG.getSettingsOverride();
    fd.forEach(function (value, key) {
      if (key === "social.instagram" || key === "social.facebook") {
        override.social = override.social || {};
        override.social[key.split(".")[1]] = value;
      } else if (value !== "") {
        override[key] = key === "geoLat" || key === "geoLng" ? Number(value) : value;
      }
    });
    IYG.saveSettingsOverride(override);
    var note = document.getElementById("settings-saved-note");
    note.classList.remove("hidden");
    setTimeout(function () { note.classList.add("hidden"); }, 3000);
  });

  document.getElementById("settings-reset").addEventListener("click", function () {
    localStorage.removeItem(IYG.SETTINGS_KEY);
    fillSettingsForm();
  });

  // ----------------------------------------------------------------------
  // Veri Yönetimi
  // ----------------------------------------------------------------------
  document.getElementById("btn-export-json").addEventListener("click", async function () {
    var all = await IYG.getListings();
    var blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "listings.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-json-input").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Geçersiz format");
        IYG.saveListings(data);
        refreshListingsTable();
        refreshDashboard();
        var note = document.getElementById("data-note");
        note.textContent = data.length + " ilan içe aktarıldı.";
        note.classList.remove("hidden");
        setTimeout(function () { note.classList.add("hidden"); }, 3000);
      } catch (err) {
        alert("JSON dosyası okunamadı: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-reset-seed").addEventListener("click", async function () {
    if (confirm("Tüm ilanlar data/listings.json içindeki örnek verilere sıfırlanacak. Emin misiniz?")) {
      await IYG.resetListingsToSeed();
      refreshListingsTable();
      refreshDashboard();
    }
  });

  // ----------------------------------------------------------------------
  // Şifre hash aracı
  // ----------------------------------------------------------------------
  document.getElementById("btn-generate-hash").addEventListener("click", async function () {
    var val = document.getElementById("hash-input").value;
    if (!val) return;
    document.getElementById("hash-output").value = await IYG.sha256Hex(val);
  });

  document.getElementById("btn-copy-hash").addEventListener("click", function () {
    var out = document.getElementById("hash-output");
    if (!out.value) return;
    out.select();
    navigator.clipboard && navigator.clipboard.writeText(out.value);
    var note = document.getElementById("hash-copied-note");
    note.classList.remove("hidden");
    setTimeout(function () { note.classList.add("hidden"); }, 2500);
  });

  // ----------------------------------------------------------------------
  // Başlangıç
  // ----------------------------------------------------------------------
  isAuthenticated() ? showPanel() : showLogin();
})();
