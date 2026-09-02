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
  email: "ibrahim3806@ibrahimyilmazgayrimenkul.com",

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
  // Google Business Profile ile birebir eşleşmeli (NAP tutarlılığı için).
  workingHoursDisplay: "Pzt-Salı 09:30-19:00, Çar-Cuma 09:00-19:00, Cmt 10:00-17:00",
  workingHoursSchema: [
    { days: ["Monday", "Tuesday"], opens: "09:30", closes: "19:00" },
    { days: ["Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
    { days: ["Saturday"], opens: "10:00", closes: "17:00" }
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
  ga4Id: "G-EF23Z5VLBC", // TODO: "G-XXXXXXXXXX" ya da boş bırakın ("yok")
  searchConsoleVerify: "", // TODO: Search Console HTML tag content değeri ya da boş ("yok")
  gtmId: "", // TODO: "GTM-XXXXXXX" ya da boş bırakın ("yok")

  // ------------------------------------------------------------------
  // ADMIN PANEL
  // ------------------------------------------------------------------
  // Şifre asla düz metin olarak SAKLANMAZ, sadece SHA-256 hash'i saklanır.
  // Başlangıç şifresi size ayrıca (bu depodan bağımsız, sohbet üzerinden)
  // iletildi — bu depo herkese açık (public) olduğu için düz metin şifre
  // hiçbir dosyaya yazılmadı. Değiştirmek için admin/index.html içindeki
  // "Şifre Hash Üret" aracını kullanın (bkz. README.md "Şifre Değiştirme").
  adminPasswordHash: "7039f57abb422a0d64f8f6ed5da89343a30797115dc63601d2e9f933f76b9399",

  // Oturumun tarayıcıda açık kalma süresi (dakika)
  adminSessionMinutes: 60
};
