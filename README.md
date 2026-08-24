# İbrahim Yılmaz Gayrimenkul — Web Sitesi

Ankara İskitler ve Altındağ odaklı, yerel SEO uyumlu, kurumsal emlak ilan sitesi.
Framework kullanılmadan, saf HTML/CSS/JS ile hazırlanmıştır; herhangi bir paylaşımlı
(cPanel) hosting üzerinde çalışır, sunucu tarafı programlama (PHP/Node vb.)
gerektirmez.

## ⚠️ Önemli varsayımlar (yayına almadan önce mutlaka kontrol edin)

Görev talimatında telefon, WhatsApp, e-posta, açık adres, koordinat, GA4 ve
Search Console alanları köşeli parantez `[ ]` ile boş bırakılmıştı. Bu alanlar
gerçek verilerle **doldurulmadı**; bunun yerine gerçekçi görünen **yer tutucu
(placeholder)** değerler kullanıldı ve `assets/js/config.js` içinde `TODO`
etiketiyle işaretlendi. Yayına almadan önce aşağıdaki dosyayı açıp bu alanları
gerçek bilgilerinizle güncelleyin:

```
assets/js/config.js
```

Değiştirmeniz gerekenler: `phoneDisplay`, `phoneHref`, `whatsappNumber`, `email`,
`addressLine`, `postalCode`, `geoLat`/`geoLng` (gerçek Google Maps koordinatı),
`social.instagram`/`social.facebook`, `ga4Id`, `gtmId`, `searchConsoleVerify`,
ve **admin panel şifresi** (`adminPasswordHash` — bkz. aşağıdaki "Panel
Şifresini Değiştirme" bölümü).

## Dosya Yapısı

```
├── index.html              Ana sayfa (hero + arama + öne çıkan/son ilanlar)
├── ilanlar.html             İlan listesi (fiyat/oda/tür/bölge/işlem filtreli)
├── ilan-detay.html          İlan detay (galeri + özellik tablosu + harita + WhatsApp + form)
├── hakkimizda.html          Kurumsal / Hakkımızda
├── iletisim.html            İletişim (form + harita)
├── 404.html                 Sayfa bulunamadı
├── robots.txt                Arama motoru tarama kuralları (admin/ disallow)
├── sitemap.xml                Site haritası
├── .htaccess                 HTTPS yönlendirme, güvenlik başlıkları, sıkıştırma, önbellek
├── admin/
│   └── index.html            Şifreli yönetim paneli (giriş + ilan/ayar/veri yönetimi)
├── assets/
│   ├── css/style.css         Tek CSS dosyası (genel site + admin paneli)
│   ├── js/config.js          TÜM SİTE AYARLARI — firma bilgisi, Google entegrasyonları, admin şifre hash'i
│   ├── js/main.js            Ortak veri katmanı + genel site davranışları
│   ├── js/admin.js           Yalnızca /admin sayfasında kullanılan panel mantığı
│   └── img/                  Logo, favicon, OG görseli, örnek ilan görselleri (SVG)
└── data/
    └── listings.json         Örnek ilan verisi (4 gerçekçi ilan) — admin panelden dışa aktarılan dosyanın hedefi
```

## Nasıl Çalışır? (mimari özet)

- **Framework yok.** Tüm sayfalar bağımsız `.html` dosyalarıdır, ortak
  header/footer her sayfada tekrarlanır (statik site + basit barındırma
  hedefiyle bilinçli bir tercihtir).
- **Tüm ayarlar `assets/js/config.js` içinde.** Telefon, WhatsApp, adres,
  harita koordinatı, çalışma saatleri, sosyal medya, Google Analytics/Tag
  Manager/Search Console kimlikleri ve admin şifre hash'i tek dosyada
  toplanmıştır. Bu dosyayı değiştirip kaydetmeniz, siteyi güncellemek için
  çoğunlukla yeterlidir.
- **İlanlar tarayıcıda saklanır (localStorage).** Ziyaretçi siteyi ilk
  açtığında `data/listings.json` dosyası okunur ve tarayıcının
  `localStorage`'ına kaydedilir; sonraki ziyaretlerde oradan okunur. Admin
  panelinden yapılan ekleme/düzenleme/silme işlemleri de bu `localStorage`'a
  yazılır.
- **Admin panelindeki değişikliklerin siteye kalıcı yansıması için** panelin
  "Veri Yönetimi" sekmesinden **"listings.json İndir"** ile güncel veriyi
  indirip, sunucudaki `data/listings.json` dosyasının üzerine yazıp tekrar
  yüklemeniz gerekir (statik sitenin doğası gereği; sunucu tarafı veritabanı
  yoktur). Aksi halde değişiklikler yalnızca admin işlemi yaptığınız
  tarayıcıda görünür.
- **Formlar sunucu kullanmaz.** İletişim ve bilgi talep formları
  gönderildiğinde otomatik olarak WhatsApp'a (`wa.me`) yönlendirir; mesaj
  metni form alanlarından otomatik oluşturulur.

## Yerel Test

Herhangi bir statik dosya sunucusuyla önizleyebilirsiniz, örneğin:

```
python3 -m http.server 8080
```

sonra tarayıcıda `http://localhost:8080/index.html` adresini açın.
(Doğrudan `file://` ile açmak `fetch()` güvenlik kısıtları nedeniyle
`data/listings.json` yüklemesini engelleyebilir; mutlaka bir yerel sunucu
üzerinden test edin.)

## Yayına Alma (cPanel / public_html)

1. Bu klasördeki **tüm dosya ve klasörleri** (`.htaccess` dahil — gizli
   dosyadır, "Dosyaları Göster" / "Show Hidden Files" seçeneğini açık tutun)
   içeren zip dosyasını indirin.
2. cPanel → **Dosya Yöneticisi (File Manager)** açın, `public_html` klasörüne
   girin (alan adınız doğrudan bu klasöre bağlıysa; alt klasördeyse ilgili
   alt klasöre girin).
3. `public_html` içeriği boşsa doğrudan **Upload** ile zip dosyasını yükleyin;
   doluysa önce eski dosyaları yedekleyin.
4. Yüklenen zip dosyasına sağ tıklayıp **Extract (Ayıkla)** seçeneğini
   kullanın; dosyaların `public_html` kökünde (`public_html/index.html`
   şeklinde, `public_html/ibrahim-yilmaz-gayrimenkul/index.html` şeklinde
   DEĞİL) yer aldığından emin olun.
5. `.htaccess` dosyasının yüklendiğini doğrulayın (bazı zip
   ayıklayıcılar/FTP istemcileri gizli dosyaları atlayabilir).
6. Alan adınızın hosting hesabına doğru yönlendirildiğinden ve **SSL
   sertifikasının aktif** olduğundan emin olun (çoğu cPanel'de "AutoSSL"
   ücretsizdir). `.htaccess` içindeki HTTPS yönlendirmesi SSL aktif değilse
   siteyi erişilemez hale getirebilir.
7. `assets/js/config.js` dosyasını düzenleyip gerçek bilgilerinizi girin
   (yukarıdaki "Önemli varsayımlar" bölümüne bakın), ardından **admin panel
   şifresini değiştirin** (aşağıya bakın).
8. `https://ibrahimyilmazgayrimenkul.com/index.html` yerine ana adresin
   (`https://ibrahimyilmazgayrimenkul.com/`) de çalıştığını doğrulayın —
   `.htaccess` içindeki `DirectoryIndex index.html` ayarı bunu otomatik
   sağlar.

## Admin Panel Kullanımı

Adres: `https://ibrahimyilmazgayrimenkul.com/admin/`

- **Özet:** Toplam/satılık/kiralık/öne çıkan ilan sayıları.
- **İlanlar:** Yeni ilan ekleyin, mevcut ilanı düzenleyin veya silin.
  Görsel eklerken bilgisayarınızdan fotoğraf seçebilirsiniz (dosyalar
  tarayıcıda saklanır, boyutlarını küçük tutmaya özen gösterin).
- **Site Ayarları:** Telefon, WhatsApp, adres, harita koordinatı, sosyal
  medya ve Google kimliklerini **önizleme amacıyla** bu tarayıcıda
  değiştirebilirsiniz. Kalıcı ve tüm ziyaretçilerde geçerli olması için
  aynı değerleri `assets/js/config.js` dosyasına da elle işlemeniz gerekir.
- **Veri Yönetimi:** Güncel ilan verisini `listings.json` olarak indirin
  (ardından sunucudaki `data/listings.json` dosyasının üzerine yazın),
  JSON dosyasından içe aktarın veya örnek verilere sıfırlayın.
- **Şifre Hash Aracı:** Yeni admin şifrenizin SHA-256 hash'ini üretir.

### Panel Şifresini Değiştirme (ÖNEMLİ — mutlaka yapın)

Bu depo **herkese açık (public)** olduğu için başlangıç şifresi bilerek bu
dosyaya yazılmadı; size ayrıca sohbet üzerinden iletildi. Şifre kaynak
kodda asla düz metin olarak tutulmaz, yalnızca SHA-256 hash'i saklanır.
Değiştirmek için:

1. `/admin/` adresine gidip mevcut şifreyle giriş yapın.
2. Sol menüden **"Şifre Hash Aracı"**na tıklayın.
3. Yeni şifrenizi yazıp **"Hash Üret"** butonuna basın, çıkan hash değerini
   **"Panoya Kopyala"** ile kopyalayın.
4. `assets/js/config.js` dosyasını açın, `adminPasswordHash` satırındaki
   değeri kopyaladığınız yeni hash ile değiştirin, dosyayı kaydedip
   sunucuya tekrar yükleyin.
5. (Alternatif/komut satırı yöntemi — Node.js veya OpenSSL yüklüyse):
   ```bash
   # Node.js ile:
   node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('YeniSifreniz')).then(b=>console.log(Buffer.from(b).toString('hex')))"

   # OpenSSL ile (macOS/Linux):
   printf '%s' 'YeniSifreniz' | openssl dgst -sha256
   ```
   Çıkan 64 karakterlik hex değeri `adminPasswordHash` alanına yapıştırın.

## SEO ve Google Kurulum Kontrol Listesi

Site zaten şunları otomatik yapar: her sayfada benzersiz `<title>` ve meta
açıklama, `canonical` etiketi, Open Graph etiketleri, mobil uyumlu tasarım,
`schema.org` `RealEstateAgent`/`LocalBusiness` yapısal verisi (her sayfada,
`config.js`'teki bilgilerden otomatik üretilir) ve ilan detay sayfasında
`Product`/`Offer` yapısal verisi.

Yayına aldıktan sonra şu adımları izleyin:

### (a) Google Search Console'a Site Ekleme ve Sitemap Gönderme

1. https://search.google.com/search-console adresine gidin, Google
   hesabınızla giriş yapın.
2. **"URL öneki"** yöntemiyle `https://ibrahimyilmazgayrimenkul.com/`
   adresini ekleyin (alan adı (domain) yöntemi DNS TXT kaydı gerektirir;
   URL öneki yöntemi HTML etiketiyle daha basittir).
3. Doğrulama yöntemi olarak **"HTML etiketi"**ni seçin, verilen
   `content="..."` değerini kopyalayın.
4. `assets/js/config.js` içindeki `searchConsoleVerify` alanına bu değeri
   yapıştırın, dosyayı kaydedip sunucuya tekrar yükleyin (site bu değeri
   otomatik olarak `<head>` içine `google-site-verification` meta etiketi
   olarak ekler).
5. Search Console'da **"Doğrula"** butonuna basın.
6. Sol menüden **"Site Haritaları (Sitemaps)"**a gidin, `sitemap.xml` yazıp
   **"Gönder"**e basın.
7. İlk indekslemenin birkaç gün sürebileceğini unutmayın; "URL Denetimi"
   aracıyla ana sayfanızın dizine eklenmesini manuel olarak da isteyebilirsiniz.

### (b) Google İşletme Profili (Google Business Profile) Oluşturma

İskitler'de haritada ve "yakınımdaki emlakçı" aramalarında çıkmanın **en
güçlü** yoludur — mutlaka yapın:

1. https://business.google.com adresine gidin, **"Yönet"** ile başlayın.
2. İşletme adı olarak **"İbrahim Yılmaz Gayrimenkul"** girin.
3. Kategori olarak **"Emlak Danışmanlığı" / "Real Estate Agency"** (ve
   uygunsa "Emlak Ofisi") seçin.
4. **Fiziksel adresiniz** olduğu için "Müşterilerin ziyaret edebileceği bir
   yerim var" seçeneğini işaretleyip açık adresinizi girin (İskitler Mah.
   .../ Altındağ/Ankara).
5. Hizmet alanı olarak İskitler, Altındağ, Ulus, Hasköy gibi çevre
   mahalleleri de ekleyin.
6. Telefon numaranızı ve **web sitenizi** (`https://ibrahimyilmazgayrimenkul.com`)
   girin.
7. Çalışma saatlerinizi girin (Pazartesi - Cumartesi 09:00 - 19:00).
8. **Doğrulama:** Google genellikle posta ile bir kod gönderir (birkaç gün
   sürer); bazı hesaplarda telefon/e-posta ile anında doğrulama da
   sunulabilir.
9. Doğrulama sonrası: profil fotoğrafı, kapak fotoğrafı ve ofis/ilan
   fotoğrafları ekleyin, işletme açıklamasına "Ankara İskitler ve Altındağ"
   ifadelerini doğal şekilde geçirin.
10. Müşterilerinizden **Google yorumu** istemeyi ihmal etmeyin — yerel
    aramalarda sıralamayı doğrudan etkiler.
11. (Opsiyonel ama önerilir) Google Business Profile'da paylaşılan bağlantı
    olarak WhatsApp linkinizi ("Mesajlar" özelliği) ve web sitenizi ekleyin.

### GA4 / Google Tag Manager (opsiyonel)

`config.js` içindeki `ga4Id` (örn. `G-XXXXXXXXXX`) ve/veya `gtmId` (örn.
`GTM-XXXXXXX`) alanlarını doldurursanız, site bu betikleri **otomatik**
olarak her sayfaya ekler. Boş bırakılırsa hiçbir şey yüklenmez (performansı
etkilemez).

## Güvenlik Notları

- `.htaccess` dosyası HTTP→HTTPS yönlendirmesi, `Content-Security-Policy`,
  `Strict-Transport-Security` (HSTS), `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  başlıklarını; dizin listelemeyi kapatmayı; sunucu imzasını gizlemeyi;
  Gzip sıkıştırmayı ve tarayıcı önbelleğini otomatik uygular.
- `robots.txt` `/admin/` ve `/data/` klasörlerini taramadan hariç tutar;
  ayrıca `.htaccess` bu klasöre `X-Robots-Tag: noindex` başlığı ekler.
- Admin şifresi kaynak kodda **yalnızca SHA-256 hash** olarak saklanır,
  düz metin hiçbir yerde bulunmaz.
- Oturum tarayıcının `sessionStorage`'ında tutulur ve (varsayılan olarak)
  60 dakika sonra otomatik sona erer (`config.js` → `adminSessionMinutes`).
- Bu bir istemci-taraflı (client-side) koruma modelidir: statik site sunucu
  tarafı kimlik doğrulama yapamadığından, "gerçek" bir arka uç kadar güçlü
  değildir ancak halka açık bir emlak ilan sitesi için makul ve yaygın bir
  yaklaşımdır. Daha yüksek güvenlik gerekiyorsa `/admin/` klasörünü ayrıca
  cPanel'in "Dizin Gizliliği" (Directory Privacy / .htpasswd) özelliğiyle
  ek bir HTTP Basic Auth katmanıyla koruyabilirsiniz.

## Bilinen Sınırlamalar

- `ilan-detay.html` tek bir dosyadır ve `?id=...` parametresiyle ilgili
  ilanı JavaScript ile yükler; sayfa başlığı/meta açıklaması JS çalıştıktan
  sonra güncellenir. Modern Google bunu tarayıp indeksleyebilir, ancak
  ölçekte çok sayıda ilan için ideal SEO, her ilana özel statik HTML dosyası
  üretmektir (ör. basit bir derleme betiği ile). Mevcut ilan sayısı için
  bu yaklaşım yeterlidir.
- Google Haritalar yerleştirmesi (embed) API anahtarı gerektirmeyen genel
  `maps?q=...&output=embed` biçimini kullanır; interaktif kontroller
  (yol tarifi vb.) sınırlıdır. Daha zengin bir harita için ücretli bir
  Google Maps Embed API anahtarı eklenebilir.
- Görseller örnek/yer tutucu SVG'lerdir; gerçek ilan fotoğraflarını admin
  panelinden yükleyebilir veya `assets/img/listings/` klasörüne kendi
  dosyalarınızı ekleyip `data/listings.json` içindeki yolları
  güncelleyebilirsiniz.
