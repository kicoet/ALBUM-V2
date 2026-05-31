/* ===========================================================
   Album Ucapan-Ultah V2 — Shared Site Script
   Content store · chrome injection · transitions · FX
   · playlist player · in-app dialog + toast
   =========================================================== */
(function(){
  const root = document.documentElement;

  /* ---------------- content store ---------------- */
  const DEFAULTS = {
    couple:{ name1:'Padzli', name2:'Miskah',
      since:'2022-02-14',
      tagline:'Dua orang, satu cerita — yang ingin kami tulis sampai selamanya.' },
    counter:[
      {label:'Pertama Kenal', date:'2021-11-09'},
      {label:'Jadian',        date:'2022-02-14'},
      {label:'Pertama Bertemu',date:'2021-12-25'}
    ],
    timeline:[
      {date:'2021-11-09', title:'Awal Mula Sapa',     story:'Berawal dari obrolan kecil yang ternyata nyambung sampai lupa waktu.', img:''},
      {date:'2021-12-25', title:'Pertama Bertemu',    story:'Akhirnya bertatap muka langsung. Gugup, salah tingkah, tapi senyumnya bikin canggung hilang.', img:''},
      {date:'2022-02-14', title:'Resmi Berdua',       story:'Hari yang tidak akan pernah kami lupa. Sebuah "iya" yang mengubah segalanya.', img:''},
      {date:'2022-07-30', title:'Liburan Pertama',    story:'Perjalanan pertama bareng — tersesat, ketawa, dan janji untuk pergi ke lebih banyak tempat.', img:''},
      {date:'2023-02-14', title:'Setahun Bersama',    story:'Satu tahun penuh suka-duka, selalu memilih untuk tetap bersama.', img:''}
    ],
    gallery:[
      {cap:'Senja favorit kami', tall:false, img:''},
      {cap:'Ketawa nggak jelas', tall:true,  img:''},
      {cap:'Kopi sore berdua',   tall:false, img:''},
      {cap:'Jalan-jalan pertama',tall:true,  img:''},
      {cap:'Momen random',       tall:false, img:''},
      {cap:'Pelukan hangat',     tall:false, img:''}
    ],
    notes:[
      {title:'Untuk Kamu yang Selalu Ada', from:'Padzli', body:'Terima kasih sudah jadi rumah paling nyaman buat aku pulang.'},
      {title:'Hal-hal Kecil yang Aku Suka', from:'Miskah', body:'Aku suka caramu ketawa, caramu ngambek lucu, dan caramu bilang "hati-hati di jalan".'},
      {title:'Catatan Singkat', from:'Berdua', body:'Apa pun yang terjadi nanti, ingat satu hal: kita selalu di tim yang sama.'}
    ],
    moments:[
      {emoji:'💬', title:'Pertama Kenalan',  date:'2021-11-09', desc:'Obrolan pertama yang ternyata jadi awal dari segalanya.', img:''},
      {emoji:'👀', title:'Pertama Ketemu',   date:'2021-12-25', desc:'Tatap muka pertama yang penuh gugup dan senyum malu.',     img:''},
      {emoji:'🚶', title:'Pertama Jalan',    date:'2022-01-22', desc:'Kencan pertama yang sederhana tapi berkesan.',             img:''},
      {emoji:'💍', title:'Anniversary',      date:'2022-02-14', desc:'Hari jadi yang kami rayakan dengan penuh syukur.',         img:''},
      {emoji:'✈️',  title:'Liburan Pertama', date:'2022-07-30', desc:'Petualangan berdua yang membuat kami makin dekat.',        img:''}
    ],
    videos:[
      {title:'Our Story',       date:'2023', desc:'Rangkuman perjalanan kami dari awal sampai sekarang.', video:'', cover:''},
      {title:'Highlight Momen', date:'2022', desc:'Potongan-potongan kebahagiaan kecil sepanjang tahun.', video:'', cover:''},
      {title:'Anniversary',     date:'2023', desc:'Hadiah spesial di hari jadi kami yang ke-1.',          video:'', cover:''}
    ],
    playlist:[],  // [{title, artist, url}] — admin upload via Cloudinary
    settings:{ adminUser:'Admin', adminPass:'Ganteng' }
  };

  function deepMerge(base, over){
    if(Array.isArray(base)) return Array.isArray(over)?over:base;
    if(typeof base==='object'&&base){const o={...base};for(const k in over){o[k]=deepMerge(base[k],over[k]);}return o;}
    return over===undefined?base:over;
  }
  const PM = {
    get(){
      try{const raw=localStorage.getItem('pm-content');
        return raw?deepMerge(DEFAULTS,JSON.parse(raw)):structuredClone(DEFAULTS);}
      catch(e){return structuredClone(DEFAULTS);}
    },
    save(c){
      localStorage.setItem('pm-content',JSON.stringify(c));
      if(window.CLOUD && typeof window.CLOUD.pushCloud==='function') window.CLOUD.pushCloud(c);
    },
    reset(){localStorage.removeItem('pm-content');},
    DEFAULTS
  };
  window.PM = PM;

  /* Background cloud sync (silent — no in-page re-render):
     - cloud.js still updates localStorage in the background when fresh
       data arrives from RTDB, so the NEXT page navigation picks up the
       latest content via PM.get().
     - We intentionally do NOT auto-rebuild the current page DOM. That
       caused brief flicker / animation re-trigger and felt buggy.
     - If you want admin edits to appear instantly on a viewer device,
       just navigate (any link click) to refresh that page. */
  // window.addEventListener('pm-cloud-ready', ...) — intentionally removed.

  /* ---------------- in-app dialog + toast ---------------- */
  function ensureToastHost(){
    let h=document.getElementById('pm-toasts');
    if(!h){h=document.createElement('div');h.id='pm-toasts';document.body.appendChild(h);}
    return h;
  }
  PM.notify = function(msg, opts){
    opts = opts || {};
    const host = ensureToastHost();
    const t = document.createElement('div');
    t.className = 'pm-toast '+(opts.kind||'');
    const icon = opts.kind==='ok'?'✓':opts.kind==='err'?'!':'i';
    t.innerHTML = `<span class="ic">${icon}</span><span>${msg}</span>`;
    host.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('in'));
    setTimeout(()=>{
      t.classList.remove('in');
      setTimeout(()=>t.remove(), 400);
    }, opts.duration||3000);
  };
  function openDialog(opts){
    return new Promise(resolve=>{
      const wrap=document.createElement('div'); wrap.className='pm-dialog';
      wrap.innerHTML = `<div class="box">
        <div class="di">${opts.icon||'❤'}</div>
        <h3>${opts.title||'Konfirmasi'}</h3>
        <p>${opts.body||''}</p>
        <div class="row">
          <button class="btn" data-act="ok">${opts.okText||'OK'}</button>
          ${opts.cancelText?`<button class="btn ghost" data-act="cancel">${opts.cancelText}</button>`:''}
        </div>
      </div>`;
      document.body.appendChild(wrap);
      requestAnimationFrame(()=>wrap.classList.add('open'));
      function close(val){
        wrap.classList.remove('open');
        setTimeout(()=>{wrap.remove();resolve(val);},300);
      }
      wrap.querySelector('[data-act="ok"]').addEventListener('click',()=>close(true));
      const cancel=wrap.querySelector('[data-act="cancel"]');
      if(cancel) cancel.addEventListener('click',()=>close(false));
      wrap.addEventListener('click',e=>{if(e.target===wrap && opts.cancelText)close(false);});
      document.addEventListener('keydown',function esc(e){
        if(e.key==='Escape' && opts.cancelText){document.removeEventListener('keydown',esc);close(false);}
        if(e.key==='Enter'){document.removeEventListener('keydown',esc);close(true);}
      });
    });
  }
  PM.alert   = function(o){ return openDialog({okText:'OK', ...o}); };
  PM.confirm = function(o){ return openDialog({okText:'Ya', cancelText:'Batal', icon:'❓', ...o}); };

  /* ---------------- nav config ---------------- */
  const NAV = [
    {h:'index.html',            t:'Home',            k:'home'},
    {h:'our-story.html',        t:'Our Story',       k:'our-story'},
    {h:'gallery.html',          t:'Gallery',         k:'gallery'},
    {h:'love-notes.html',       t:'Love Notes',      k:'love-notes'},
    {h:'special-moments.html',  t:'Special Moments', k:'special-moments'},
    {h:'video-memories.html',   t:'Videos',          k:'videos'}
  ];
  const enc = s => encodeURI(s);

  /* ---------------- chrome injection ---------------- */
  function injectChrome(){
    const page = document.body.dataset.page || '';
    const showNav = document.body.dataset.nav !== 'off';
    const c = PM.get();
    const brand = `${c.couple.name1} <span class="hh">&amp;</span> ${c.couple.name2}`;

    const bg = document.createElement('div'); bg.className='bgwrap'; document.body.prepend(bg);
    const fx = document.createElement('canvas'); fx.id='fx'; bg.after(fx);

    if(showNav){
      const links = NAV.map(n=>`<a href="${enc(n.h)}" data-link class="${n.k===page?'active':''}">${n.t}</a>`).join('');
      const nav=document.createElement('nav'); nav.className='nav';
      nav.innerHTML=`
        <a class="brand" href="${enc('index.html')}" data-link>${brand}</a>
        <div class="links">${links}</div>
        <div class="tools">
          <div class="iconbtn" id="modeBtn" title="Mode terang / gelap"><span class="ic" id="modeIc">☀️</span></div>
          <div class="iconbtn" id="musicBtn" title="Buka player musik"><span class="eq"><i></i><i></i><i></i></span></div>
          <div class="burger" id="burger"><span></span><span></span><span></span></div>
        </div>`;
      document.body.appendChild(nav);
      const sheet=document.createElement('div'); sheet.className='msheet'; sheet.id='msheet';
      sheet.innerHTML=links; document.body.appendChild(sheet);
      const burger=nav.querySelector('#burger');
      burger.addEventListener('click',()=>sheet.classList.toggle('open'));
      sheet.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>sheet.classList.remove('open')));
    }

    const cur=document.createElement('div'); cur.className='curtain'; cur.id='curtain';
    cur.innerHTML=`
      <div class="cmsg">
        <div class="cwave"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="ctxt" id="curtainText">Mohon tunggu<span class="cdots"></span></div>
        <div class="csub" id="curtainSub">membuka kenangan…</div>
      </div>`;
    document.body.appendChild(cur);

    const au=document.createElement('audio'); au.id='bgm';
    document.body.appendChild(au);

    injectPlayer();
    wireMode(); wirePlayer(); wireTransitions(); initFX(fx);
    requestAnimationFrame(()=>{const w=document.querySelector('.pagewrap'); if(w) w.classList.add('in');});
  }

  /* ---------------- mode ---------------- */
  function wireMode(){
    const ic=document.getElementById('modeIc');
    function apply(m){root.setAttribute('data-mode',m); if(ic) ic.textContent=m==='dark'?'🌙':'☀️';}
    apply(localStorage.getItem('pm-mode')||'light');
    const btn=document.getElementById('modeBtn');
    if(btn) btn.addEventListener('click',()=>{
      const m=root.getAttribute('data-mode')==='dark'?'light':'dark';
      localStorage.setItem('pm-mode',m); apply(m);
    });
  }

  /* ---------------- URL detection + playback engines ---------------- */
  function detectUrl(url){
    if(!url) return {type:'none'};
    const u = String(url).trim();
    // YouTube (watch, embed, youtu.be, music.youtube)
    const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([\w-]{11})/);
    if(yt) return {type:'youtube', id:yt[1], url:u};
    // Spotify track
    const sp = u.match(/open\.spotify\.com\/(?:intl-\w+\/)?track\/([\w]+)/);
    if(sp) return {type:'spotify', id:sp[1], url:u};
    // Direct audio (mp3/m4a/wav/ogg) or Cloudinary url
    return {type:'audio', url:u};
  }
  let _ytReadyP = null;
  function loadYTAPI(){
    if(_ytReadyP) return _ytReadyP;
    return _ytReadyP = new Promise(resolve=>{
      if(window.YT && window.YT.Player){ resolve(); return; }
      const tag=document.createElement('script');
      tag.src='https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = ()=> resolve();
    });
  }

  /* ---------------- playlist player UI ---------------- */
  function injectPlayer(){
    const p=document.createElement('div'); p.className='mplayer'; p.id='mplayer';
    p.innerHTML=`
      <div class="mhead">
        <div class="now">
          <div class="t" id="mTitle">Tidak ada lagu</div>
          <div class="a" id="mArtist">Tambah lagu lewat Admin</div>
        </div>
        <div class="close" id="mClose">✕</div>
      </div>
      <div class="progress" id="mProgress"><div class="bar" id="mBar"></div></div>
      <div class="times"><span id="mCur">0:00</span><span id="mDur">0:00</span></div>
      <div class="controls">
        <div class="ctrl" id="mShuffle" title="Acak">🔀</div>
        <div class="ctrl" id="mPrev"    title="Sebelumnya">⏮</div>
        <div class="ctrl big" id="mPlay" title="Play / Pause">▶</div>
        <div class="ctrl" id="mNext"    title="Berikutnya">⏭</div>
        <div class="ctrl" id="mRepeat"  title="Ulang">🔁</div>
      </div>
      <div class="tracks" id="mTracks"><div class="empty">Belum ada lagu. Tambahkan dari Admin → Lagu.</div></div>
      <div id="mYtFrame" style="position:absolute;left:-99999px;width:1px;height:1px;opacity:0;pointer-events:none"></div>
    `;
    document.body.appendChild(p);
  }

  function fmtTime(s){
    s=Math.max(0,Math.floor(s||0));
    const m=Math.floor(s/60), r=s%60;
    return `${m}:${String(r).padStart(2,'0')}`;
  }

  function wirePlayer(){
    const au   = document.getElementById('bgm');
    const btn  = document.getElementById('musicBtn');
    const panel= document.getElementById('mplayer');
    const closeBtn=document.getElementById('mClose');
    const pBar = document.getElementById('mBar'), pBox=document.getElementById('mProgress');
    const curEl= document.getElementById('mCur'),  durEl=document.getElementById('mDur');
    const titleEl=document.getElementById('mTitle'), artistEl=document.getElementById('mArtist');
    const playBtn=document.getElementById('mPlay'), prevBtn=document.getElementById('mPrev'),
          nextBtn=document.getElementById('mNext'), shufBtn=document.getElementById('mShuffle'),
          repBtn=document.getElementById('mRepeat');
    const tracksEl=document.getElementById('mTracks');

    const state = {
      list: (PM.get().playlist||[]),
      idx: Math.min(parseInt(localStorage.getItem('pm-music-i')||'0',10)||0, Math.max(0,(PM.get().playlist||[]).length-1)),
      shuffle: localStorage.getItem('pm-music-shuffle')==='1',
      repeat:  localStorage.getItem('pm-music-repeat')||'all',
      playing: false,
      engine: 'none' // 'audio' | 'youtube' | 'spotify' | 'none'
    };

    /* Engine abstraction — routes play control to YouTube/audio per URL type */
    let ytPlayer = null;
    function setPlayBtn(on){ playBtn.textContent = on?'⏸':'▶'; state.playing=on; if(btn) btn.classList.toggle('playing', on); localStorage.setItem('pm-music', on?'1':'0'); }

    function tearDown(){
      try{ au.pause(); }catch(e){}
      if(ytPlayer){ try{ ytPlayer.stopVideo(); }catch(e){} }
    }

    async function loadTrack(i, andPlay){
      state.list = PM.get().playlist || [];
      if(!state.list.length){
        tearDown();
        au.removeAttribute('src'); au.load();
        titleEl.textContent='Tidak ada lagu';
        artistEl.textContent='Tambah lagu lewat Admin';
        setPlayBtn(false);
        renderTracks();
        return;
      }
      i = Math.max(0, Math.min(i, state.list.length-1));
      state.idx = i;
      const t = state.list[i];
      const u = detectUrl(t.url);
      titleEl.textContent = t.title || 'Tanpa judul';
      artistEl.textContent = (t.artist || '—') + ' · ' + (u.type==='youtube'?'YouTube':u.type==='spotify'?'Spotify':u.type==='audio'?'Audio':'?');
      localStorage.setItem('pm-music-i', String(i));
      renderTracks();

      tearDown();
      state.engine = u.type;

      if(u.type==='audio'){
        au.src = u.url;
        if(andPlay) au.play().catch(()=>{});
      } else if(u.type==='youtube'){
        await loadYTAPI();
        if(!ytPlayer){
          ytPlayer = new YT.Player('mYtFrame', {
            videoId: u.id,
            playerVars: { autoplay: andPlay?1:0, controls:0, modestbranding:1, playsinline:1 },
            events: {
              onReady: (e)=>{ if(andPlay){ try{e.target.playVideo();}catch(_){}} },
              onStateChange: (e)=>{
                const S = YT.PlayerState;
                if(e.data===S.PLAYING) setPlayBtn(true);
                else if(e.data===S.PAUSED) setPlayBtn(false);
                else if(e.data===S.ENDED) next();
              }
            }
          });
        } else {
          try{
            if(andPlay) ytPlayer.loadVideoById(u.id);
            else ytPlayer.cueVideoById(u.id);
          }catch(_){}
        }
      } else if(u.type==='spotify'){
        // Spotify Web Embed cannot be controlled programmatically without OAuth.
        // Fallback: open in new tab and show inline notice.
        if(andPlay){
          window.open(u.url, '_blank', 'noopener');
          PM.notify('Spotify dibuka di tab baru. Kembali ke sini untuk lagu berikutnya.');
        }
        setPlayBtn(false);
      } else {
        PM.notify('Link lagu tidak dikenali: '+(t.url||'(kosong)'), {kind:'err'});
        setPlayBtn(false);
      }
    }

    function next(){
      if(!state.list.length) return;
      if(state.repeat==='one'){ loadTrack(state.idx,true); return; }
      if(state.shuffle && state.list.length>1){
        let n;do{n=Math.floor(Math.random()*state.list.length);}while(n===state.idx);
        loadTrack(n,true); return;
      }
      const last = state.idx >= state.list.length-1;
      if(last && state.repeat==='off'){ setPlayBtn(false); return; }
      loadTrack((state.idx+1) % state.list.length, true);
    }
    function prev(){
      if(!state.list.length) return;
      const t = getCurrentTime();
      if(t>3){ seekTo(0); return; }
      loadTrack((state.idx-1+state.list.length) % state.list.length, true);
    }
    function playPause(){
      if(!state.list.length){ PM.notify('Belum ada lagu di playlist.', {kind:'err'}); return; }
      if(state.engine==='audio'){
        if(!au.src) loadTrack(state.idx,true);
        else if(au.paused) au.play().catch(()=>{}); else au.pause();
      } else if(state.engine==='youtube' && ytPlayer){
        const s = ytPlayer.getPlayerState && ytPlayer.getPlayerState();
        if(s===1) ytPlayer.pauseVideo(); else ytPlayer.playVideo();
      } else if(state.engine==='spotify'){
        const t = state.list[state.idx];
        if(t && t.url) window.open(t.url, '_blank', 'noopener');
      } else {
        loadTrack(state.idx, true);
      }
    }
    function seekTo(s){
      if(state.engine==='audio'){ au.currentTime=s; }
      else if(state.engine==='youtube' && ytPlayer && ytPlayer.seekTo){ ytPlayer.seekTo(s, true); }
    }
    function getCurrentTime(){
      if(state.engine==='audio') return au.currentTime;
      if(state.engine==='youtube' && ytPlayer && ytPlayer.getCurrentTime) return ytPlayer.getCurrentTime();
      return 0;
    }
    function getDuration(){
      if(state.engine==='audio') return au.duration || 0;
      if(state.engine==='youtube' && ytPlayer && ytPlayer.getDuration) return ytPlayer.getDuration() || 0;
      return 0;
    }

    function renderTracks(){
      if(!state.list.length){ tracksEl.innerHTML='<div class="empty">Belum ada lagu. Tambahkan dari Admin → Lagu.</div>'; return; }
      tracksEl.innerHTML = state.list.map((t,i)=>{
        const u = detectUrl(t.url);
        const badge = u.type==='youtube'?'▶ YT':u.type==='spotify'?'♪ SP':u.type==='audio'?'♪':'?';
        return `<div class="tk ${i===state.idx?'active':''}" data-i="${i}">
          <span class="n">${String(i+1).padStart(2,'0')}</span>
          <div class="meta">
            <div class="tt">${(t.title||'Tanpa judul')} <span style="font-family:'Caveat';font-size:12px;color:var(--muted)">${badge}</span></div>
            <div class="aa">${t.artist||'—'}</div>
          </div>
        </div>`;
      }).join('');
      tracksEl.querySelectorAll('.tk').forEach(el=>{
        el.addEventListener('click',()=>{ loadTrack(+el.dataset.i, true); });
      });
    }

    /* events */
    if(btn) btn.addEventListener('click',()=>panel.classList.toggle('open'));
    window.PMtogglePlayer = ()=>panel.classList.toggle('open');
    closeBtn.addEventListener('click',()=>panel.classList.remove('open'));
    playBtn.addEventListener('click', playPause);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    shufBtn.addEventListener('click',()=>{
      state.shuffle=!state.shuffle;
      localStorage.setItem('pm-music-shuffle', state.shuffle?'1':'0');
      shufBtn.classList.toggle('on', state.shuffle);
    });
    repBtn.addEventListener('click',()=>{
      state.repeat = state.repeat==='off'?'all':state.repeat==='all'?'one':'off';
      localStorage.setItem('pm-music-repeat', state.repeat);
      repBtn.classList.toggle('on', state.repeat!=='off');
      repBtn.textContent = state.repeat==='one'?'🔂':'🔁';
    });
    pBox.addEventListener('click',(e)=>{
      const dur = getDuration(); if(!dur) return;
      const rect=pBox.getBoundingClientRect();
      seekTo(((e.clientX-rect.left)/rect.width) * dur);
    });

    /* audio engine events */
    au.addEventListener('play', ()=>setPlayBtn(true));
    au.addEventListener('pause', ()=>setPlayBtn(false));
    au.addEventListener('ended', next);

    /* unified time tick (works for audio + YouTube) */
    setInterval(()=>{
      const c = getCurrentTime(), d = getDuration();
      curEl.textContent = fmtTime(c);
      durEl.textContent = fmtTime(d);
      pBar.style.width = (d ? (c/d*100) : 0) + '%';
      if(state.playing && state.engine==='audio') localStorage.setItem('pm-music-t', String(c));
    }, 500);

    /* restore state */
    if(state.shuffle) shufBtn.classList.add('on');
    if(state.repeat!=='off') repBtn.classList.add('on');
    if(state.repeat==='one') repBtn.textContent='🔂';
    if(state.list.length){
      loadTrack(state.idx, false);
      const wasT = parseFloat(localStorage.getItem('pm-music-t')||'0')||0;
      if(wasT) au.addEventListener('loadedmetadata', ()=>{au.currentTime=wasT;}, {once:true});
    } else {
      renderTracks();
    }

    window.PMplayer = { toggle: playPause };

    /* ---------- Autoplay orchestration ----------
       Browsers block audio autoplay until a user gesture. Strategy:
       1. If session was already approved (landing's "Buka Album" click)
          OR localStorage says music should be playing, try to play now.
       2. If the play attempt fails (no gesture yet), show a floating
          "tap to play music" prompt + attach one-time click listener
          to the document. First click anywhere → starts playback. */
    function shouldAutoplay(){
      return state.list.length > 0 && (
        sessionStorage.getItem('pm-autoplay-ok')==='1' ||
        localStorage.getItem('pm-music')==='1'
      );
    }
    function showTapPrompt(){
      if(document.getElementById('tap2play')) return;
      const t=document.createElement('div'); t.id='tap2play'; t.className='tap2play';
      t.innerHTML=`<span class="eq"><i></i><i></i><i></i></span><span>Tap untuk mulai musik</span>`;
      document.body.appendChild(t);
      requestAnimationFrame(()=>t.classList.add('show'));
    }
    function hideTapPrompt(){
      const t=document.getElementById('tap2play'); if(!t) return;
      t.classList.remove('show');
      setTimeout(()=>t.remove(), 400);
    }
    async function tryAutoplay(){
      if(!state.list.length) return false;
      try{
        await new Promise((res,rej)=>{
          const t = state.list[state.idx];
          const u = detectUrl(t.url);
          if(u.type==='audio'){
            au.src = u.url;
            au.play().then(res).catch(rej);
          } else if(u.type==='youtube'){
            loadYTAPI().then(()=>{
              if(!ytPlayer){
                ytPlayer = new YT.Player('mYtFrame', {
                  videoId: u.id,
                  playerVars: { autoplay:1, controls:0, modestbranding:1, playsinline:1 },
                  events: {
                    onReady: (e)=>{
                      try{ e.target.playVideo(); res(); }catch(_){ rej(_); }
                    },
                    onStateChange: (e)=>{
                      const S = YT.PlayerState;
                      if(e.data===S.PLAYING){ setPlayBtn(true); sessionStorage.setItem('pm-autoplay-ok','1'); }
                      else if(e.data===S.PAUSED) setPlayBtn(false);
                      else if(e.data===S.ENDED) next();
                    }
                  }
                });
              } else {
                try{ ytPlayer.loadVideoById(u.id); res(); }catch(_){ rej(_); }
              }
              state.engine='youtube';
            }).catch(rej);
          } else { rej(new Error('unsupported')); }
        });
        sessionStorage.setItem('pm-autoplay-ok','1');
        return true;
      } catch(e){
        return false;
      }
    }
    window.PMtryAutoplay = tryAutoplay;

    // Kick off autoplay attempt if conditions are right
    if(shouldAutoplay()){
      setTimeout(async ()=>{
        const ok = await tryAutoplay();
        if(!ok){
          // Browser blocked — wait for first user click anywhere
          showTapPrompt();
          const enable = ()=>{
            document.removeEventListener('click', enable, true);
            document.removeEventListener('touchstart', enable, true);
            hideTapPrompt();
            tryAutoplay();
          };
          document.addEventListener('click', enable, true);
          document.addEventListener('touchstart', enable, true);
        }
      }, 400);
    }

    /* Realtime playlist refresh (called when cloud sends updated content).
       - Updates track list display + state.list.
       - Keeps current playback if the playing track still exists.
       - Resets if playlist becomes empty or current index is out of range. */

    /* Realtime playlist refresh (called when cloud sends updated content).
       - Updates track list display + state.list.
       - Keeps current playback if the playing track still exists.
       - Resets if playlist becomes empty or current index is out of range. */
    window.PMplayerRefresh = function(){
      const newList = PM.get().playlist || [];
      const prevTrack = state.list[state.idx];
      state.list = newList;
      if(!newList.length){
        tearDown();
        state.idx = 0; state.engine = 'none';
        titleEl.textContent = 'Tidak ada lagu';
        artistEl.textContent = 'Tambah lagu lewat Admin';
        setPlayBtn(false);
        renderTracks();
        return;
      }
      // Try to keep playing the same track by matching url
      if(prevTrack && prevTrack.url){
        const stillThere = newList.findIndex(t => t.url === prevTrack.url);
        if(stillThere >= 0){
          state.idx = stillThere;
          localStorage.setItem('pm-music-i', String(stillThere));
          renderTracks();
          return;
        }
      }
      // Track gone — clamp index, stop playback
      state.idx = Math.min(state.idx, newList.length - 1);
      tearDown(); setPlayBtn(false);
      renderTracks();
    };
  }

  /* ---------------- page transitions (SPA pattern)
     Music + audio element + YT iframe live in <body>, OUTSIDE .pagewrap.
     We swap only .pagewrap content via fetch → audio never reloads,
     YouTube keeps playing through the whole navigation. */
  function wireTransitions(){
    const cur=document.getElementById('curtain');
    const phrases=[
      ['Mohon tunggu', 'membuka kenangan…'],
      ['Sebentar ya', 'memuat momen indah…'],
      ['Menyiapkan', 'cerita untuk kamu…'],
      ['Hampir sampai', 'bersabar sedikit ❤'],
      ['Memuat',       'hal-hal berharga…']
    ];
    let phraseI=0;

    function setCurtainText(){
      const [t,s]=phrases[phraseI++ % phrases.length];
      const tEl=document.getElementById('curtainText');
      const sEl=document.getElementById('curtainSub');
      if(tEl) tEl.innerHTML = t + '<span class="cdots"></span>';
      if(sEl) sEl.textContent = s;
    }

    function isLanding(href){
      const p=(href||'').replace(/[?#].*$/,'').replace(/^\.?\//,'').split('/').pop();
      return p==='' || p==='index.html';
    }

    async function spaNavigate(href){
      setCurtainText();
      cur.classList.add('show');
      try{
        // run fetch + curtain animation in parallel
        const [res] = await Promise.all([
          fetch(href, { credentials:'same-origin' }),
          new Promise(r=>setTimeout(r, 480))
        ]);
        if(!res.ok) throw new Error('fetch '+res.status);
        // Force UTF-8 decode (avoids charset mismatch that mangles emoji)
        const buf = await res.arrayBuffer();
        const html = new TextDecoder('utf-8').decode(buf);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newPagewrap = doc.querySelector('.pagewrap');
        const newTitle    = doc.querySelector('title') && doc.querySelector('title').textContent;
        const newPage     = doc.body.dataset.page || '';
        const newNavMode  = doc.body.dataset.nav  || '';
        // Inline scripts in body of new page (each page's per-page render code)
        const newScripts  = Array.from(doc.querySelectorAll('body > script:not([src])'));

        if(!newPagewrap){ throw new Error('no .pagewrap in '+href); }

        // Replace pagewrap in current DOM
        const currentPagewrap = document.querySelector('.pagewrap');
        if(currentPagewrap){
          currentPagewrap.replaceWith(newPagewrap);
        } else {
          document.body.insertBefore(newPagewrap, document.body.firstChild);
        }

        // Update title + data-page
        if(newTitle) document.title = newTitle;
        document.body.dataset.page = newPage;

        // Navbar visibility based on new page's data-nav
        const navEl = document.querySelector('nav.nav');
        const msheet = document.getElementById('msheet');
        if(navEl) navEl.style.display = (newNavMode==='off') ? 'none' : '';
        if(msheet) msheet.style.display = (newNavMode==='off') ? 'none' : '';

        // Update active nav link
        document.querySelectorAll('.nav .links a[data-link], .msheet a[data-link]').forEach(a=>{
          const h=a.getAttribute('href');
          a.classList.toggle('active', h===href);
        });

        // Clear previous page's render hook so stale callbacks don't fire
        window.PMrender = null;

        // Run new page's inline scripts in IIFE scope so const/let collisions are avoided
        newScripts.forEach(s=>{
          const code = '(function(){\n'+s.textContent+'\n})();';
          try { (0,eval)(code); } catch(e){ console.warn('[SPA] inline script error', e); }
        });

        // History
        history.pushState({path:href}, '', href);

        // Reset scroll + animate pagewrap in
        window.scrollTo(0,0);
        requestAnimationFrame(()=>{
          const w=document.querySelector('.pagewrap');
          if(w) w.classList.add('in');
        });
      } catch(e){
        console.warn('[SPA] fallback to full nav:', e);
        window.location.href = href; return;
      } finally {
        // Always close the curtain
        setTimeout(()=>cur.classList.remove('show'), 80);
      }
    }

    document.addEventListener('click',e=>{
      const a=e.target.closest('a[data-link]');
      if(!a) return;
      const href=a.getAttribute('href');
      if(!href || href.startsWith('#') || a.target==='_blank') return;
      e.preventDefault();
      // Use full reload only when entering/leaving the landing page
      // (it has data-nav="off" + full-bleed loader that doesn't SPA-swap cleanly)
      if(isLanding(href) || document.body.dataset.page==='home'){
        setCurtainText();
        cur.classList.add('show');
        setTimeout(()=>{window.location.href=href;},560);
        return;
      }
      spaNavigate(href);
    });

    window.addEventListener('pageshow',e=>{if(e.persisted)cur.classList.remove('show');});

    window.addEventListener('popstate',()=>{
      const here = location.pathname.split('/').pop() || 'index.html';
      if(isLanding(here) || document.body.dataset.page==='home'){
        window.location.href = here;
      } else {
        spaNavigate(here);
      }
    });
  }

  /* ---------------- scroll reveal ---------------- */
  function initReveal(){
    const els=[...document.querySelectorAll('.reveal')];
    const io=new IntersectionObserver((ents)=>{
      ents.forEach(en=>{if(en.isIntersecting){en.target.classList.add('seen');io.unobserve(en.target);}});
    },{threshold:.12,rootMargin:'0px 0px -8% 0px'});
    els.forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.top < (innerHeight*0.95)) el.classList.add('seen');
      else io.observe(el);
    });
    setTimeout(()=>document.querySelectorAll('.reveal:not(.seen)').forEach(el=>{
      if(el.getBoundingClientRect().top < innerHeight) el.classList.add('seen');
    }),1400);
  }
  window.PMreveal = initReveal;

  /* ---------------- background FX ---------------- */
  function initFX(cv){
    const cx=cv.getContext('2d');
    let W,H,DPR,hearts=[],stars=[],shoot=null;
    function resize(){DPR=Math.min(devicePixelRatio||1,2);W=cv.width=innerWidth*DPR;H=cv.height=innerHeight*DPR;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';build();}
    function build(){
      hearts=[];stars=[];
      const hc=Math.max(10,Math.round(innerWidth/90));
      for(let i=0;i<hc;i++){let p=mkHeart();p.y=Math.random()*H;hearts.push(p);}
      for(let i=0;i<150;i++)stars.push({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*1.4+.4)*DPR,
        ph:Math.random()*6.28,sp:Math.random()*.05+.01,c:Math.random()>.85?'#FF8FA3':'#FFE9A8'});
    }
    function mkHeart(){return{x:Math.random()*W,y:H+Math.random()*H,s:(Math.random()*1.3+.7)*DPR,
      sp:(Math.random()*.45+.2)*DPR,rot:(Math.random()-.5)*.6,sw:Math.random()*6.28,
      a:Math.random()*.4+.32,col:Math.random()>.5?'#D9381E':'#FF9F1C'};}
    function heart(x,y,s,rot,a,col){cx.save();cx.translate(x,y);cx.rotate(rot);cx.scale(s,s);cx.globalAlpha=a;
      cx.beginPath();cx.moveTo(0,4);cx.bezierCurveTo(-7,-4,-12,3,0,11);cx.bezierCurveTo(12,3,7,-4,0,4);cx.closePath();
      cx.fillStyle=col;cx.fill();cx.globalAlpha=Math.min(a+.2,1);cx.lineWidth=1.4;cx.strokeStyle='#1a1a1a';cx.stroke();cx.restore();}
    function loop(){
      cx.clearRect(0,0,W,H);
      const dark=root.getAttribute('data-mode')==='dark';
      if(dark){
        for(const s of stars){s.ph+=s.sp;const a=.25+Math.abs(Math.sin(s.ph))*.6;
          cx.globalAlpha=a;cx.fillStyle=s.c;cx.beginPath();cx.arc(s.x,s.y,s.r,0,7);cx.fill();
          if(s.r>1.1*DPR){cx.globalAlpha=a*.5;cx.fillRect(s.x-s.r*3,s.y-.5,s.r*6,1);cx.fillRect(s.x-.5,s.y-s.r*3,1,s.r*6);}}
        cx.globalAlpha=1;
        if(!shoot&&Math.random()<0.005){shoot={x:Math.random()*W*.6,y:Math.random()*H*.35,len:0,sp:(Math.random()*6+8)*DPR};}
        if(shoot){const g=cx.createLinearGradient(shoot.x,shoot.y,shoot.x-shoot.len,shoot.y-shoot.len*.5);
          g.addColorStop(0,'rgba(255,240,200,.95)');g.addColorStop(1,'rgba(255,240,200,0)');
          cx.strokeStyle=g;cx.lineWidth=2*DPR;cx.lineCap='round';cx.beginPath();cx.moveTo(shoot.x,shoot.y);
          cx.lineTo(shoot.x-shoot.len,shoot.y-shoot.len*.5);cx.stroke();
          shoot.x+=shoot.sp;shoot.y+=shoot.sp*.5;shoot.len=Math.min(shoot.len+shoot.sp,130*DPR);
          if(shoot.x>W+60)shoot=null;}
      }else{
        for(const p of hearts){p.y-=p.sp;p.sw+=0.015;p.x+=Math.sin(p.sw)*.5*DPR;p.rot+=0.004;
          if(p.y<-20)Object.assign(p,mkHeart());heart(p.x,p.y,p.s,p.rot,p.a,p.col);}
      }
      requestAnimationFrame(loop);
    }
    resize();addEventListener('resize',resize);loop();
  }

  /* ---------------- helpers exposed ---------------- */
  PM.daysSince = function(dateStr){
    const d=new Date(dateStr); const now=new Date();
    return Math.max(0,Math.floor((now-d)/(1000*60*60*24)));
  };
  PM.breakdown = function(dateStr){
    const start=new Date(dateStr), now=new Date();
    let y=now.getFullYear()-start.getFullYear();
    let m=now.getMonth()-start.getMonth();
    let d=now.getDate()-start.getDate();
    if(d<0){m--; d+=new Date(now.getFullYear(),now.getMonth(),0).getDate();}
    if(m<0){y--; m+=12;}
    return {y,m,d, total:PM.daysSince(dateStr)};
  };
  PM.fmtDate = function(s){
    const M=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const d=new Date(s); if(isNaN(d)) return s;
    return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
  };

  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',injectChrome);
  else injectChrome();
})();
