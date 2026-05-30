// ===========================================================
// Album Ucapan-Ultah V2 — Firebase Realtime Database + Cloudinary
// Switched from Firestore to RTDB per user request — faster realtime
// sync (sub-second) and simpler tree-based data model.
// ===========================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getDatabase, ref, get, set, onValue
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBK96f_cgTV3-a_3biyOR3EXQPVF2ueGGU',
  authDomain: 'ucapan-ultah-v2.firebaseapp.com',
  // Realtime DB URL — auto-guess based on region. If your DB was created
  // in a non-Asia region, override with the exact URL from Firebase Console.
  databaseURL: 'https://ucapan-ultah-v2-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ucapan-ultah-v2',
  storageBucket: 'ucapan-ultah-v2.firebasestorage.app',
  messagingSenderId: '116948091313',
  appId: '1:116948091313:web:9aaf7a7547ef780e22bd90',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Path: /album_v2/main → holds { content, updatedAt }
const NODE = ref(db, 'album_v2/main');

// ---------- Cloudinary (file storage) ----------
const CLOUDINARY_CLOUD  = 'dqgelhy0d';
const CLOUDINARY_PRESET = 'ucapan_uploads';

async function cloudinaryUpload(file, folder = 'album-v2/misc') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${t.slice(0, 200)}`);
  }
  return (await res.json()).secure_url;
}

async function uploadDataUrl(dataUrl, folder) {
  const r = await fetch(dataUrl);
  const blob = await r.blob();
  return cloudinaryUpload(blob, folder);
}

// ---------- Cloud pull/push ----------
const STORAGE_KEY = 'pm-content';

function applyRemote(cloud) {
  if (!cloud) return false;
  const current = localStorage.getItem(STORAGE_KEY);
  const incoming = JSON.stringify(cloud);
  if (current === incoming) return false;
  localStorage.setItem(STORAGE_KEY, incoming);
  window.dispatchEvent(new CustomEvent('pm-cloud-ready', { detail: cloud }));
  return true;
}

async function pullCloud() {
  try {
    const snap = await get(NODE);
    if (snap.exists()) {
      const v = snap.val();
      const cloud = v && v.content ? v.content : v; // support both wrapped + flat
      if (cloud) {
        applyRemote(cloud);
        return cloud;
      }
    }
  } catch (e) {
    console.warn('[cloud] pull failed:', e?.message || e);
  }
  return null;
}

let lastPushSerialized = null;
async function pushCloud(content) {
  try {
    const ser = JSON.stringify(content);
    if (ser === lastPushSerialized) return true;
    lastPushSerialized = ser;
    await set(NODE, { content, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error('[cloud] push failed:', e?.message || e);
    return false;
  }
}

// Expose
window.CLOUD = {
  pullCloud,
  pushCloud,
  upload: cloudinaryUpload,
  uploadDataUrl,
  ready: pullCloud(),
};
window.dispatchEvent(new CustomEvent('cloud-init'));

// Realtime subscribe — RTDB is sub-second sync
try {
  onValue(NODE, (snap) => {
    if (!snap.exists()) return;
    const v = snap.val();
    const cloud = v && v.content ? v.content : v;
    if (cloud) applyRemote(cloud);
  }, (err) => console.warn('[cloud] subscribe failed:', err?.message || err));
} catch (e) {
  console.warn('[cloud] no realtime subscribe:', e?.message || e);
}

// Refresh on tab refocus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pullCloud();
});
