# Album Ucapan-Ultah V2

Website album kenangan multi-halaman dengan tema neo-brutalist handcrafted
(warm paper, gold + brick-red accent, handwritten fonts) — 7 halaman dengan
transisi cinematic, backend Firebase + Cloudinary, admin panel privat.

## Login admin

| Field    | Value     |
|----------|-----------|
| URL      | `/admin.html` |
| Username | `Admin`   |
| Password | `Ganteng` |

Ganti kredensial via tab **Sandi** di panel admin. Perubahan langsung tersinkron
ke cloud (semua device pakai kredensial baru setelah satu kali save).

## Tech

- **Frontend:** static HTML/CSS/JS (no build) — sama style dengan ucapan-ultah V1
- **Backend:** Firebase Firestore (project `project-website-ultah`, koleksi `album_v2`)
- **File storage:** Cloudinary (preset `ucapan_uploads`, folder `album-v2/`)
- **PWA:** installable, theme color tangerine `#FF9F1C`
- **Halaman:** Landing, Our Story, Gallery, Love Notes, Special Moments, Video Memories, Admin

> Catatan: project ini **reuse** Firebase + Cloudinary dari V1, tapi koleksi
> Firestore-nya beda (`album_v2` vs `greeting`) — V1 dan V2 tidak saling bentrok.

## Jalankan di PC

```bash
cd C:\Users\user\album-ucapan-ultah-v2
python -m http.server 5173
```

Buka http://localhost:5173

> Firebase + Cloudinary butuh internet. Tanpa internet, app tetap jalan dari cache
> localStorage tapi sync ke cloud tidak terjadi sampai online.

## Deploy ke Vercel

### Cara cepat (drag-and-drop)
1. https://vercel.com/new → Deploy without Git
2. Drag folder `album-ucapan-ultah-v2` → Deploy
3. Dapat URL `https://xxx.vercel.app`

### Cara Git (recommended)
```bash
cd C:\Users\user\album-ucapan-ultah-v2
git init && git add . && git commit -m "init"
gh repo create ALBUM-V2 --public --source=. --push
```
Lalu connect repo di vercel.com — tiap push auto-deploy.

## Install ke HP (PWA)

1. Buka URL Vercel di HP (Chrome Android / Safari iOS)
2. Menu browser → **Install app** / **Add to Home Screen**
3. App jadi icon standalone, sync data antar device via Firebase

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
  cloud.js              Firebase + Cloudinary wrapper
icons/                  PWA icons (svg + 192/512 png)
manifest.webmanifest    PWA manifest
vercel.json             headers config
```

## Bagaimana sync bekerja

- **Read:** Setiap halaman baca content dari `localStorage` cache → render instan.
  Background `cloud.js` pull dari Firestore → jika beda, update cache dan
  reload halaman (kecuali halaman admin, yang biarkan user lanjut edit).
- **Write:** `PM.save(content)` (admin Save button) → tulis ke localStorage +
  push ke Firestore. Subscribe realtime di device lain otomatis update.
- **Conflict:** last-write-wins (push terakhir menang).

## Reset data

Lewat admin → tombol **Reset Default** → lalu Save (untuk push reset ke cloud).
Atau hapus localStorage `pm-content` dari DevTools.
