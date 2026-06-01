# Album Ucapan-Ultah V2

Website album kenangan multi-halaman dengan tema neo-brutalist handcrafted
(warm paper, gold + brick-red accent, handwritten fonts) — 7 halaman dengan
transisi cinematic, backend **PocketBase** (self-hosted di VPS AksaraDesigns),
admin panel privat.

## Login admin

| Field    | Value     |
|----------|-----------|
| URL      | `/admin.html` |
| Username | `Admin`   |
| Password | `Ganteng` |

Ganti kredensial via tab **Sandi** di panel admin. Perubahan langsung tersinkron
ke cloud (semua device pakai kredensial baru setelah satu kali save).

## Tech

- **Frontend:** static HTML/CSS/JS (no build)
- **Backend:** PocketBase per-customer di VPS AksaraDesigns
  - Disajikan di `https://aksaradesigns.com/<slug>/` → PocketBase di `https://aksaradesigns.com/<slug>/pb`
  - `cloud.js` mendeteksi `<slug>` otomatis dari URL, jadi build yang sama jalan untuk semua customer
- **File storage:** PocketBase (collection `media`)
- **PWA:** installable, theme color tangerine `#FF9F1C`
- **Halaman:** Landing, Our Story, Gallery, Love Notes, Special Moments, Video Memories, Admin

Seluruh konten situs disimpan sebagai **satu blob JSON** di collection `config`
(satu record, `key = "album_v2"`). File yang diupload disimpan di collection
`media` dan URL-nya ditaruh di dalam blob konten.

## Setup PocketBase (sekali per customer)

Buka Admin UI: `https://aksaradesigns.com/<slug>/pb/_/` lalu buat 2 collection:

### 1. `config`
| Field   | Type | Keterangan |
|---------|------|------------|
| `key`   | Text | nilai `album_v2` |
| `value` | Text (atau JSON) | blob konten seluruh situs |

### 2. `media`
| Field    | Type | Keterangan |
|----------|------|------------|
| `file`   | File (single) | foto / video / lagu yang diupload |
| `folder` | Text (optional) | mis. `album-v2/images` |

**API Rules** untuk kedua collection: set **List/View/Create/Update** ke kosong
(public) supaya tamu bisa baca dan admin panel bisa menyimpan. Akses tulis
digate oleh login admin di `admin.html`, bukan oleh PocketBase.

> Override URL: kalau perlu menunjuk PocketBase lain, set
> `window.POCKETBASE_URL = 'https://.../pb'` sebelum `cloud.js` dimuat.

## Jalankan di PC

```bash
cd C:\Users\user\album-ucapan-ultah-v2
python -m http.server 5173
```

Buka http://localhost:5173

> PocketBase butuh terjangkau dari browser. Tanpa koneksi ke server, app tetap
> jalan dari cache localStorage tapi sync tidak terjadi sampai online.

## Deploy ke VPS (per customer)

```bash
# 1. Bikin customer
cd /root/AksaraDesigns && ./create-customer.sh nama-pasangan

# 2. Clone repo ke folder public
git clone https://github.com/kicoet/ALBUM-V2.git /root/AksaraDesigns/nama-pasangan/public/

# 3. Fix permission
chmod -R 755 /root/AksaraDesigns/nama-pasangan/public/

# 4. Buat collection `config` + `media` di PocketBase Admin UI (lihat di atas)
```

## Install ke HP (PWA)

1. Buka URL customer di HP (Chrome Android / Safari iOS)
2. Menu browser → **Install app** / **Add to Home Screen**
3. App jadi icon standalone, sync data antar device via PocketBase

## Struktur file

```
index.html              landing page (loader, hero, particles)
our-story.html          counter + timeline
gallery.html            masonry photo grid + lightbox
love-notes.html         envelope cards + typing reader
special-moments.html    moments grid + floating decorations
video-memories.html     video card grid + player modal
admin.html              login + tabbed CRUD panel
assets/
  theme.css             design system (3 themes, neo-brutalist tokens)
  site.js               shared chrome (nav, transition, FX, content store)
  cloud.js              PocketBase wrapper (content blob + file upload)
icons/                  PWA icons (svg + 192/512 png)
manifest.webmanifest    PWA manifest
```

## Bagaimana sync bekerja

- **Read:** Setiap halaman baca content dari `localStorage` cache → render instan.
  Background `cloud.js` pull dari PocketBase (collection `config`) → jika beda,
  update cache dan re-render (kecuali halaman admin, biarkan user lanjut edit).
- **Write:** `PM.save(content)` (admin Save button) → tulis ke localStorage +
  push ke PocketBase. Subscribe realtime (SSE) di device lain otomatis update.
- **Conflict:** last-write-wins (push terakhir menang).

## Reset data

Lewat admin → tombol **Reset Default** → lalu Save (untuk push reset ke cloud).
Atau hapus localStorage `pm-content` dari DevTools.
