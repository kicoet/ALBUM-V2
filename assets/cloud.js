// ===========================================================
// Album Ucapan-Ultah V2 — Firebase + Cloudinary cloud layer
// Reuses Firebase project-website-ultah but isolates data in
// the 'album_v2' Firestore collection so V1 is untouched.
// ===========================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  initializeFirestore, doc, getDoc, setDoc, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCY6ptzYzoVX4nfzpdjDVYw_g5asmWpfw8',
  authDomain: 'project-website-ultah.firebaseapp.com',
  projectId: 'project-website-ultah',
  storageBucket: 'project-website-ultah.firebasestorage.app',
  messagingSenderId: '1026782360639',
  appId: '1:1026782360639:web:dca5e060285d64348db48a',
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

// Distinct collection from V1 (which uses "greeting/main") so V1 + V2 coexist.
const DOC = doc(db, 'album_v2', 'main');

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

function getLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

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
    const snap = await getDoc(DOC);
    if (snap.exists()) {
      const cloud = snap.data().content;
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
    if (ser === lastPushSerialized) return true; // skip dup pushes
    lastPushSerialized = ser;
    await setDoc(DOC, { content, updatedAt: Date.now() });
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
  ready: pullCloud(), // promise — pages can await this if needed
};
window.dispatchEvent(new CustomEvent('cloud-init'));

// Realtime subscribe so multi-device edits propagate within seconds.
try {
  onSnapshot(DOC, (snap) => {
    if (!snap.exists()) return;
    const cloud = snap.data().content;
    if (cloud) applyRemote(cloud);
  }, (err) => console.warn('[cloud] subscribe failed:', err?.message || err));
} catch (e) {
  console.warn('[cloud] no realtime subscribe:', e?.message || e);
}

// Refresh on tab refocus (mobile PWA aware)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pullCloud();
});
