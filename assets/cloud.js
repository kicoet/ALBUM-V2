// ===========================================================
// Album Ucapan-Ultah V2 — PocketBase backend (AksaraDesigns VPS)
// Migrated from Firebase RTDB + Cloudinary → self-hosted PocketBase.
//
//  • Whole-site content lives as ONE JSON blob in the `config`
//    collection (one record, key = "album_v2") — same single-blob
//    model the app used on Firebase, just a different store.
//  • Uploaded files (foto/video/lagu) go to the `media` collection
//    and we keep the public file URL in the content blob.
//  • Realtime sync via pb.collection().subscribe() (sub-second).
//
// The public `window.CLOUD` interface is UNCHANGED, so site.js /
// admin.html / every page keep working without edits.
// ===========================================================
import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.22.1/dist/pocketbase.es.mjs';

// ---------- Resolve PocketBase base URL ----------
// Each customer is served at  https://aksaradesigns.com/<slug>/...
// and its PocketBase lives at  https://aksaradesigns.com/<slug>/pb
// We derive <slug> from the first path segment so the SAME build works
// for every customer with zero edits. Override with window.POCKETBASE_URL
// if you ever need to point somewhere else.
function resolvePbBase() {
  if (typeof window !== 'undefined' && window.POCKETBASE_URL) return window.POCKETBASE_URL;
  const { origin, pathname } = location;
  const segs = pathname.split('/').filter(Boolean);
  // First segment is the slug, unless we're at the root and it's a file (xxx.html).
  const slug = (segs[0] && !segs[0].toLowerCase().endsWith('.html')) ? segs[0] : '';
  return slug ? `${origin}/${slug}/pb` : `${origin}/pb`;
}

const pb = new PocketBase(resolvePbBase());
pb.autoCancellation(false); // we fire overlapping pulls (refocus, realtime) — don't cancel them

// Collections (create these in PocketBase Admin UI — see README).
const CONFIG_COLLECTION = 'config';   // fields: key (text), value (text/json)
const CONFIG_KEY        = 'album_v2'; // the single record holding all site content
const MEDIA_COLLECTION  = 'media';    // fields: file (file), folder (text, optional)

let configRecordId = null;            // cached id of the config record

function fileURL(record, filename) {
  // SDK renamed getUrl → getURL in 0.21; support both just in case.
  return pb.files.getURL ? pb.files.getURL(record, filename)
                         : pb.files.getUrl(record, filename);
}
function parseValue(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;          // json field type
  try { return JSON.parse(v); } catch { return null; } // text field type
}

// ---------- File storage (replaces Cloudinary) ----------
async function pbUpload(file, folder = 'album-v2/misc') {
  const fd = new FormData();
  const name = (file && file.name) ? file.name : `upload-${Date.now()}`;
  fd.append('file', file, name);
  fd.append('folder', folder);
  const rec = await pb.collection(MEDIA_COLLECTION).create(fd);
  return fileURL(rec, rec.file);
}

async function uploadDataUrl(dataUrl, folder) {
  const r = await fetch(dataUrl);
  const blob = await r.blob();
  return pbUpload(blob, folder);
}

// ---------- Cloud pull/push ----------
const STORAGE_KEY = 'pm-content';

/* Auto-fix mojibake: when admin saved earlier, charset mismatch double-encoded
   UTF-8 strings (so 💬 became "ðŸ'¬"). We detect those markers, re-interpret
   the string as Latin-1 bytes, then decode as proper UTF-8. */
let _didFixMojibake = false;
function _fixMojibake(s) {
  if (typeof s !== 'string') return s;
  // Common double-encoding markers
  if (!/Ã|ð[Ÿœž]|Â[^a-zA-Z]|â€|â„|â–|â–º/.test(s)) return s;
  // Bail if any char is outside Latin-1 range (means string has real Unicode mixed in)
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 255) return s;
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    const out = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (out !== s) _didFixMojibake = true;
    return out;
  } catch { return s; }
}
function _deepFixMojibake(o) {
  if (typeof o === 'string') return _fixMojibake(o);
  if (Array.isArray(o)) return o.map(_deepFixMojibake);
  if (o && typeof o === 'object') {
    const out = {};
    for (const k in o) out[k] = _deepFixMojibake(o[k]);
    return out;
  }
  return o;
}

/* Security: admin credentials must NEVER live in the public content blob.
   Older saves stored settings.adminUser / settings.adminPass (plaintext),
   which was shipped to every visitor. Strip them on read; if any were
   present we self-heal by pushing the cleaned blob back to the cloud so
   the secret stops being served. Auth is now validated server-side by
   PocketBase (_superusers) — see adminLogin() below. */
function _stripSecrets(o) {
  if (!o || typeof o !== 'object' || !o.settings || typeof o.settings !== 'object') return o;
  if (!('adminUser' in o.settings) && !('adminPass' in o.settings)) return o;
  const settings = { ...o.settings };
  delete settings.adminUser;
  delete settings.adminPass;
  const clone = { ...o };
  if (Object.keys(settings).length) clone.settings = settings;
  else delete clone.settings;
  return clone;
}

function applyRemote(cloud) {
  if (!cloud) return false;
  _didFixMojibake = false;
  let fixed = _deepFixMojibake(cloud);
  const stripped = _stripSecrets(fixed);
  const dirty = _didFixMojibake || (stripped !== fixed); // either cleanup happened
  fixed = stripped;
  const current = localStorage.getItem(STORAGE_KEY);
  const incoming = JSON.stringify(fixed);
  if (current === incoming) {
    // even if no local change, push the cleanup to cloud (one-time)
    if (dirty) pushCloud(fixed).catch(()=>{});
    return false;
  }
  localStorage.setItem(STORAGE_KEY, incoming);
  window.dispatchEvent(new CustomEvent('pm-cloud-ready', { detail: fixed }));
  // Self-heal: if we cleaned mojibake or stripped secrets, push clean data back
  if (dirty) pushCloud(fixed).catch(()=>{});
  return true;
}

async function pullCloud() {
  try {
    const rec = await pb.collection(CONFIG_COLLECTION).getFirstListItem(`key="${CONFIG_KEY}"`);
    configRecordId = rec.id;
    const cloud = parseValue(rec.value);
    if (cloud) {
      applyRemote(cloud);
      return cloud;
    }
  } catch (e) {
    // 404 just means nothing has been saved yet — that's fine, stay on defaults.
    if (e?.status !== 404) console.warn('[cloud] pull failed:', e?.message || e);
  }
  return null;
}

let lastPushSerialized = null;
async function pushCloud(content) {
  try {
    const ser = JSON.stringify(content);
    if (ser === lastPushSerialized) return true;
    lastPushSerialized = ser;

    // Make sure we know the record id (first save after a fresh load).
    if (!configRecordId) {
      try {
        const rec = await pb.collection(CONFIG_COLLECTION).getFirstListItem(`key="${CONFIG_KEY}"`);
        configRecordId = rec.id;
      } catch (e) { if (e?.status !== 404) throw e; }
    }

    if (configRecordId) {
      await pb.collection(CONFIG_COLLECTION).update(configRecordId, { value: ser, key: CONFIG_KEY });
    } else {
      const rec = await pb.collection(CONFIG_COLLECTION).create({ key: CONFIG_KEY, value: ser });
      configRecordId = rec.id;
    }
    return true;
  } catch (e) {
    console.error('[cloud] push failed:', e?.message || e);
    lastPushSerialized = null; // allow retry on next save
    return false;
  }
}

// ---------- Admin auth (server-side via PocketBase) ----------
// Credentials are verified by PocketBase against the _superusers collection
// — NOTHING is checked in the browser and no password is shipped to clients.
// PocketBase persists the auth token in localStorage, so the session survives
// reloads (pb.authStore.isValid). Manage admin accounts in the PB Admin UI.
async function adminLogin(email, password) {
  await pb.collection('_superusers').authWithPassword(email, password);
  return pb.authStore.isValid;
}
function adminLogout() { pb.authStore.clear(); }
function isAdmin() { return pb.authStore.isValid; }

// Expose — same shape as before so the rest of the app is untouched.
window.CLOUD = {
  pullCloud,
  pushCloud,
  upload: pbUpload,
  uploadDataUrl,
  adminLogin,
  adminLogout,
  isAdmin,
  ready: pullCloud(),
  pb, // handy for debugging in the console
};
window.dispatchEvent(new CustomEvent('cloud-init'));

// Realtime subscribe — PocketBase pushes record changes over SSE (sub-second).
try {
  pb.collection(CONFIG_COLLECTION).subscribe('*', (e) => {
    if (!e || !e.record || e.record.key !== CONFIG_KEY) return;
    const cloud = parseValue(e.record.value);
    if (cloud) applyRemote(cloud);
  });
} catch (e) {
  console.warn('[cloud] no realtime subscribe:', e?.message || e);
}

// Refresh on tab refocus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') pullCloud();
});
