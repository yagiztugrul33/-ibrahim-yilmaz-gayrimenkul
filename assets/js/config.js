/*
 * config.js — TÜM SİTE AYARLARI TEK YERDE
 * -----------------------------------------------------------------
 * Bu dosyayı düzenleyerek firma bilgilerini, iletişim kanallarını,
 * Google entegrasyonlarını ve admin panel şifresini değiştirebilirsiniz.
 * Değişiklik sonrası dosyayı kaydedip sunucuya (public_html) tekrar
 * yüklemeniz yeterlidir — başka hiçbir dosyayı değiştirmenize gerek yoktur.
 *
 * "TODO" etiketli alanlar, görev talimatında köşeli parantez [ ] ile
 * bırakılmış ve henüz gerçek değeri verilmemiş alanlardır. Yayına
 * almadan önce mutlaka gerçek bilgilerle değiştirin.
 */
window.SITE_CONFIG = {
  // ------------------------------------------------------------------
  // FİRMA KİMLİĞİ
  // ------------------------------------------------------------------
  companyName: "İbrahim Yılmaz Gayrimenkul",
  companyShortName: "İbrahim Yılmaz Gayrimenkul",
  slogan: "Ankara İskitler ve Altındağ'da güvenilir emlak danışmanlığı",
  foundedYear: 2010,

  // ------------------------------------------------------------------
  // İLETİŞİM — TODO: gerçek bilgilerle değiştirin
  // ------------------------------------------------------------------
  // Görünen telefon (ekranda gösterilecek biçim)
  phoneDisplay: "+90 505 458 38 38",
  // tel: bağlantısı için sadece rakam + ülke kodu (boşluksuz)
  phoneHref: "905054583838",
  // WhatsApp numarası — SADECE RAKAM, başında + veya 0 OLMADAN (90 ile başlasın)
  whatsappNumber: "905054583838", // TODO: WhatsApp numarası telefonla aynı değilse güncelleyin
  email: "info@ibrahimyilmazgayrimenkul.com",

  // Açık adres
  addressLine: "Zübeyde Hanım Mahallesi, Aslanbey Caddesi No: 46/C, Altındağ/Ankara",
  addressLocality: "Altındağ",
  addressRegion: "Ankara",
  addressCountry: "TR",
  postalCode: "06070",

  // Google Maps koordinatı — Aslanbey Caddesi (Zübeyde Hanım Mah.) için yaklaşık
  // değerdir (açık web haritalarından tahmin edilmiştir). Kesin nokta için Google
  // Maps'te adresi arayıp haritaya sağ tıklayarak koordinatı buradan güncelleyin.
  geoLat: 39.9530,
  geoLng: 32.8465,

  // Google Maps embed linki oluşturmak için kullanılan sorgu
  mapsQuery: "Zübeyde Hanım Mahallesi, Aslanbey Caddesi No:46, Altındağ, Ankara",

  // Çalışma saatleri (insan tarafından okunabilir + schema.org için yapılandırılmış)
  workingHoursDisplay: "Pazartesi - Cumartesi 09:00 - 19:00",
  workingHoursSchema: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "19:00" }
  ],

  // ------------------------------------------------------------------
  // BÖLGE / SEO ODAK ALANLARI
  // ------------------------------------------------------------------
  areaServed: ["Ankara", "İskitler", "Altındağ", "Ulus", "Hasköy", "Yıldıraltı"],
  primaryKeywords: [
    "Ankara İskitler emlak",
    "İskitler gayrimenkul",
    "İskitler satılık daire",
    "İskitler kiralık daire",
    "Altındağ emlakçı",
    "Altındağ satılık işyeri"
  ],

  // ------------------------------------------------------------------
  // SOSYAL MEDYA — TODO: doldurun, boş bırakılırsa site otomatik gizler
  // ------------------------------------------------------------------
  social: {
    instagram: "", // TODO: örn. https://instagram.com/ibrahimyilmazgayrimenkul
    facebook: ""   // TODO
  },

  // ------------------------------------------------------------------
  // ALAN ADI
  // ------------------------------------------------------------------
  siteUrl: "https://ibrahimyilmazgayrimenkul.com",

  // ------------------------------------------------------------------
  // GOOGLE ENTEGRASYONLARI — dolu ise otomatik yüklenir, "yok"/boş ise atlanır
  // ------------------------------------------------------------------
  ga4Id: "", // TODO: "G-XXXXXXXXXX" ya da boş bırakın ("yok")
  searchConsoleVerify: "", // TODO: Search Console HTML tag content değeri ya da boş ("yok")
  gtmId: "", // TODO: "GTM-XXXXXXX" ya da boş bırakın ("yok")

  // ------------------------------------------------------------------
  // ADMIN PANEL
  // ------------------------------------------------------------------
  // Şifre asla düz metin olarak SAKLANMAZ, sadece SHA-256 hash'i saklanır.
  // VARSAYILAN ŞİFRE: Iskitler2026!  — YAYINA ALMADAN ÖNCE MUTLAKA DEĞİŞTİRİN.
  // Yeni şifre hash'i üretmek için admin/index.html içindeki
  // "Şifre Hash Üret" aracını kullanın (bkz. README.md "Şifre Değiştirme").
  adminPasswordHash: "fa8e67a4564b5f5e1df16e5b68f5888b9eb47423aeac1e8df23206bcad0d2e6f",

  // Oturumun tarayıcıda açık kalma süresi (dakika)
  adminSessionMinutes: 60
};
