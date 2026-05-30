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

  /* Note: cloud.js updates localStorage in background. We intentionally
     do NOT auto-reload — it caused FOUC + reload loop on fresh visit.
     Each page picks up new data on next navigation via PM.get(). */

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
    cur.innerHTML='<div class="cmsg">❤</div>'; document.body.appendChild(cur);

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

  /* ---------------- playlist player ---------------- */
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
    const cur  = document.getElementById('mCur'),  dur=document.getElementById('mDur');
    const titleEl=document.getElementById('mTitle'), artistEl=document.getElementById('mArtist');
    const playBtn=document.getElementById('mPlay'), prevBtn=document.getElementById('mPrev'),
          nextBtn=document.getElementById('mNext'), shufBtn=document.getElementById('mShuffle'),
          repBtn=document.getElementById('mRepeat');
    const tracksEl=document.getElementById('mTracks');

    const state = {
      list: (PM.get().playlist||[]),
      idx: Math.min(parseInt(localStorage.getItem('pm-music-i')||'0',10)||0, Math.max(0,(PM.get().playlist||[]).length-1)),
      shuffle: localStorage.getItem('pm-music-shuffle')==='1',
      repeat:  localStorage.getItem('pm-music-repeat')||'all',  // off | all | one
      playing: false
    };

    function load(i, andPlay){
      state.list = PM.get().playlist || [];
      if(!state.list.length){
        au.removeAttribute('src'); au.load();
        titleEl.textContent='Tidak ada lagu';
        artistEl.textContent='Tambah lagu lewat Admin';
        playBtn.textContent='▶';
        renderTracks();
        return;
      }
      i = Math.max(0, Math.min(i, state.list.length-1));
      state.idx = i;
      const t = state.list[i];
      au.src = t.url;
      titleEl.textContent = t.title || 'Tanpa judul';
      artistEl.textContent = t.artist || '—';
      localStorage.setItem('pm-music-i', String(i));
      if(andPlay) au.play().then(()=>{}).catch(()=>{});
      renderTracks();
    }
    function next(){
      if(!state.list.length) return;
      if(state.repeat==='one'){ au.currentTime=0; au.play().catch(()=>{}); return; }
      if(state.shuffle){
        if(state.list.length===1){ au.currentTime=0; au.play().catch(()=>{}); return; }
        let n;do{n=Math.floor(Math.random()*state.list.length);}while(n===state.idx);
        load(n,true); return;
      }
      const last = state.idx >= state.list.length-1;
      if(last && state.repeat==='off'){ au.pause(); setPlayBtn(false); return; }
      load((state.idx+1) % state.list.length, true);
    }
    function prev(){
      if(!state.list.length) return;
      if(au.currentTime>3){ au.currentTime=0; return; }
      load((state.idx-1+state.list.length) % state.list.length, true);
    }
    function setPlayBtn(on){ playBtn.textContent = on?'⏸':'▶'; state.playing=on; if(btn) btn.classList.toggle('playing', on); }
    function renderTracks(){
      if(!state.list.length){ tracksEl.innerHTML='<div class="empty">Belum ada lagu. Tambahkan dari Admin → Lagu.</div>'; return; }
      tracksEl.innerHTML = state.list.map((t,i)=>`
        <div class="tk ${i===state.idx?'active':''}" data-i="${i}">
          <span class="n">${String(i+1).padStart(2,'0')}</span>
          <div class="meta">
            <div class="tt">${t.title||'Tanpa judul'}</div>
            <div class="aa">${t.artist||'—'}</div>
          </div>
        </div>`).join('');
      tracksEl.querySelectorAll('.tk').forEach(el=>{
        el.addEventListener('click',()=>{ load(+el.dataset.i, true); });
      });
    }

    /* events */
    if(btn) btn.addEventListener('click',()=>panel.classList.toggle('open'));
    // expose a global toggle for pages without a navbar (e.g. landing)
    window.PMtogglePlayer = ()=>panel.classList.toggle('open');
    closeBtn.addEventListener('click',()=>panel.classList.remove('open'));
    playBtn.addEventListener('click',()=>{
      if(!state.list.length){ PM.notify('Belum ada lagu di playlist.', {kind:'err'}); return; }
      if(!au.src) load(state.idx, true);
      else if(au.paused) au.play().catch(()=>{}); else au.pause();
    });
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
      if(!au.duration) return;
      const rect=pBox.getBoundingClientRect();
      au.currentTime = ((e.clientX-rect.left)/rect.width) * au.duration;
    });

    au.addEventListener('play', ()=>setPlayBtn(true));
    au.addEventListener('pause', ()=>setPlayBtn(false));
    au.addEventListener('ended', next);
    au.addEventListener('timeupdate', ()=>{
      cur.textContent = fmtTime(au.currentTime);
      dur.textContent = fmtTime(au.duration);
      pBar.style.width = (au.duration ? (au.currentTime/au.duration*100) : 0) + '%';
      if(!au.paused) localStorage.setItem('pm-music-t', String(au.currentTime));
    });

    /* restore state */
    if(state.shuffle) shufBtn.classList.add('on');
    if(state.repeat!=='off') repBtn.classList.add('on');
    if(state.repeat==='one') repBtn.textContent='🔂';
    if(state.list.length){
      load(state.idx, false);
      const wasT = parseFloat(localStorage.getItem('pm-music-t')||'0')||0;
      if(wasT) au.addEventListener('loadedmetadata', ()=>{au.currentTime=wasT;}, {once:true});
      if(localStorage.getItem('pm-music')==='1'){ au.play().catch(()=>{}); }
    } else {
      renderTracks();
    }

    /* expose for landing standalone button */
    window.PMplayer = { toggle: ()=>{
      if(!state.list.length){ PM.notify('Belum ada lagu di playlist.', {kind:'err'}); return; }
      if(au.paused){ if(!au.src) load(state.idx,true); else au.play().catch(()=>{}); localStorage.setItem('pm-music','1'); }
      else { au.pause(); localStorage.setItem('pm-music','0'); }
    }};
    /* save play state */
    au.addEventListener('play', ()=>localStorage.setItem('pm-music','1'));
    au.addEventListener('pause',()=>localStorage.setItem('pm-music','0'));
  }

  /* ---------------- page transitions ---------------- */
  function wireTransitions(){
    const cur=document.getElementById('curtain');
    document.addEventListener('click',e=>{
      const a=e.target.closest('a[data-link]');
      if(!a) return;
      const href=a.getAttribute('href');
      if(!href||href.startsWith('#')||a.target==='_blank') return;
      e.preventDefault();
      cur.classList.add('show');
      setTimeout(()=>{window.location.href=href;},560);
    });
    window.addEventListener('pageshow',e=>{if(e.persisted)cur.classList.remove('show');});
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
