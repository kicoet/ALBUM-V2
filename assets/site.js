/* ===========================================================
   Padzli & Miskah â€” Shared Site Script
   Content store Â· chrome injection Â· transitions Â· FX
   =========================================================== */
(function(){
  const root = document.documentElement;

  /* ---------------- content store ---------------- */
  const DEFAULTS = {
    couple:{ name1:'Padzli', name2:'Miskah',
      since:'2022-02-14',
      tagline:'Dua orang, satu cerita â€” yang ingin kami tulis sampai selamanya.' },
    counter:[
      {label:'Pertama Kenal', date:'2021-11-09'},
      {label:'Jadian',        date:'2022-02-14'},
      {label:'Pertama Bertemu',date:'2021-12-25'}
    ],
    timeline:[
      {date:'2021-11-09', title:'Awal Mula Sapa', story:'Berawal dari obrolan kecil yang ternyata nyambung sampai lupa waktu. Siapa sangka, dari situ semuanya dimulai.'},
      {date:'2021-12-25', title:'Pertama Bertemu', story:'Akhirnya bertatap muka langsung. Gugup, salah tingkah, tapi senyumnya bikin semua rasa canggung hilang.'},
      {date:'2022-02-14', title:'Resmi Berdua', story:'Hari yang tidak akan pernah kami lupa. Sebuah â€œiyaâ€ yang mengubah segalanya menjadi lebih berwarna.'},
      {date:'2022-07-30', title:'Liburan Pertama', story:'Perjalanan pertama bareng â€” tersesat, ketawa, dan janji untuk pergi ke lebih banyak tempat bersama.'},
      {date:'2023-02-14', title:'Setahun Bersama', story:'Satu tahun penuh suka-duka. Bukan tanpa pertengkaran, tapi selalu memilih untuk tetap bersama.'}
    ],
    gallery:[
      {cap:'Senja favorit kami', tall:false},
      {cap:'Ketawa nggak jelas', tall:true},
      {cap:'Kopi sore berdua', tall:false},
      {cap:'Jalan-jalan pertama', tall:true},
      {cap:'Momen random', tall:false},
      {cap:'Pelukan hangat', tall:false},
      {cap:'Petualangan kecil', tall:true},
      {cap:'Hari biasa yang spesial', tall:false},
      {cap:'Selalu begini', tall:false}
    ],
    notes:[
      {title:'Untuk Kamu yang Selalu Ada', from:'Padzli', body:'Terima kasih sudah jadi rumah paling nyaman buat aku pulang. Di hari baik maupun buruk, kamu selalu pilih untuk tinggal. Aku janji akan terus belajar mencintaimu dengan cara yang kamu butuhkan.'},
      {title:'Hal-hal Kecil yang Aku Suka', from:'Miskah', body:'Aku suka caramu ketawa, caramu ngambek lucu, dan caramu bilang â€œhati-hati di jalanâ€. Hal-hal kecil itu yang bikin aku jatuh cinta lagi dan lagi setiap hari.'},
      {title:'Catatan Singkat', from:'Berdua', body:'Apa pun yang terjadi nanti, ingat satu hal: kita selalu di tim yang sama. Selamanya, kamu dan aku.'}
    ],
    moments:[
      {emoji:'ðŸ’¬', title:'Pertama Kenalan', date:'2021-11-09', desc:'Obrolan pertama yang ternyata jadi awal dari segalanya.'},
      {emoji:'ðŸ‘€', title:'Pertama Ketemu', date:'2021-12-25', desc:'Tatap muka pertama yang penuh gugup dan senyum malu.'},
      {emoji:'ðŸš¶', title:'Pertama Jalan', date:'2022-01-22', desc:'Kencan pertama yang sederhana tapi berkesan selamanya.'},
      {emoji:'ðŸ’', title:'Anniversary', date:'2022-02-14', desc:'Hari jadi yang selalu kami rayakan dengan penuh syukur.'},
      {emoji:'âœˆï¸', title:'Liburan Pertama', date:'2022-07-30', desc:'Petualangan berdua yang membuat kami makin dekat.'}
    ],
    videos:[
      {title:'Our Story', date:'2023', desc:'Rangkuman perjalanan kami dari awal sampai sekarang.'},
      {title:'Highlight Momen', date:'2022', desc:'Potongan-potongan kebahagiaan kecil sepanjang tahun.'},
      {title:'Anniversary Video', date:'2023', desc:'Hadiah spesial di hari jadi kami yang ke-1.'}
    ],
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
      // push to Firebase (cloud.js exposes window.CLOUD when loaded)
      if (window.CLOUD && typeof window.CLOUD.pushCloud === 'function') {
        window.CLOUD.pushCloud(c);
      }
    },
    reset(){localStorage.removeItem('pm-content');},
    DEFAULTS
  };
  window.PM = PM;

  /* ---------------- cloud-sync: re-render listener ----------------
     When cloud.js receives updated content from another device, we
     reload the page so all derived UI is rebuilt with fresh data.
     Skipped on the admin page (user is actively editing). */
  window.addEventListener('pm-cloud-ready', () => {
    if (document.body.dataset.page === 'admin') return;
    if (document.hidden) return;
    location.reload();
  });

  /* ---------------- nav config ---------------- */
  const NAV = [
    {h:'index.html', t:'Home',            k:'home'},
    {h:'our-story.html',    t:'Our Story',       k:'our-story'},
    {h:'gallery.html',      t:'Gallery',         k:'gallery'},
    {h:'love-notes.html',   t:'Love Notes',      k:'love-notes'},
    {h:'special-moments.html',t:'Special Moments',k:'special-moments'},
    {h:'video-memories.html',t:'Videos',         k:'videos'}
  ];
  const enc = s => encodeURI(s);

  /* ---------------- chrome injection ---------------- */
  function injectChrome(){
    const page = document.body.dataset.page || '';
    const showNav = document.body.dataset.nav !== 'off';
    const c = PM.get();
    const brand = `${c.couple.name1} <span class="hh">&amp;</span> ${c.couple.name2}`;

    // bg + canvas
    const bg = document.createElement('div'); bg.className='bgwrap'; document.body.prepend(bg);
    const fx = document.createElement('canvas'); fx.id='fx'; bg.after(fx);

    if(showNav){
      const links = NAV.map(n=>`<a href="${enc(n.h)}" data-link class="${n.k===page?'active':''}">${n.t}</a>`).join('');
      const mlinks= NAV.map(n=>`<a href="${enc(n.h)}" data-link class="${n.k===page?'active':''}">${n.t}</a>`).join('');
      const nav=document.createElement('nav'); nav.className='nav';
      nav.innerHTML=`
        <a class="brand" href="${enc('index.html')}" data-link>${brand}</a>
        <div class="links">${links}</div>
        <div class="tools">
          <div class="iconbtn" id="modeBtn" title="Mode terang / gelap"><span class="ic" id="modeIc">â˜€ï¸</span></div>
          <div class="iconbtn" id="musicBtn" title="Putar musik"><span class="eq"><i></i><i></i><i></i></span></div>
          <div class="burger" id="burger"><span></span><span></span><span></span></div>
        </div>`;
      document.body.appendChild(nav);
      const sheet=document.createElement('div'); sheet.className='msheet'; sheet.id='msheet';
      sheet.innerHTML=mlinks; document.body.appendChild(sheet);
      const burger=nav.querySelector('#burger');
      burger.addEventListener('click',()=>sheet.classList.toggle('open'));
      sheet.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>sheet.classList.remove('open')));
    }

    // curtain
    const cur=document.createElement('div'); cur.className='curtain'; cur.id='curtain';
    cur.innerHTML='<div class="cmsg">â¤</div>'; document.body.appendChild(cur);

    // audio
    const au=document.createElement('audio'); au.id='bgm'; au.loop=true; au.dataset.src='music/song.mp3';
    document.body.appendChild(au);

    wireMode(); if(showNav) wireMusic(); wireTransitions(); initFX(fx);
    requestAnimationFrame(()=>{const w=document.querySelector('.pagewrap'); if(w) w.classList.add('in');});
  }

  /* ---------------- mode ---------------- */
  function wireMode(){
    const ic=document.getElementById('modeIc');
    function apply(m){root.setAttribute('data-mode',m); if(ic) ic.textContent=m==='dark'?'ðŸŒ™':'â˜€ï¸';}
    apply(localStorage.getItem('pm-mode')||'light');
    const btn=document.getElementById('modeBtn');
    if(btn) btn.addEventListener('click',()=>{
      const m=root.getAttribute('data-mode')==='dark'?'light':'dark';
      localStorage.setItem('pm-mode',m); apply(m);
    });
  }

  /* ---------------- music (persists across pages) ---------------- */
  function wireMusic(){
    const btn=document.getElementById('musicBtn'), au=document.getElementById('bgm');
    if(!btn) return;
    function setSrc(){if(!au.src)au.src=au.dataset.src;}
    if(localStorage.getItem('pm-music')==='1'){
      btn.classList.add('playing'); setSrc();
      au.currentTime=parseFloat(localStorage.getItem('pm-music-t')||'0')||0;
      au.play().catch(()=>{});
    }
    btn.addEventListener('click',()=>{
      if(btn.classList.contains('playing')){btn.classList.remove('playing');au.pause();localStorage.setItem('pm-music','0');}
      else{btn.classList.add('playing');setSrc();au.play().catch(()=>{});localStorage.setItem('pm-music','1');}
    });
    setInterval(()=>{if(!au.paused)localStorage.setItem('pm-music-t',au.currentTime);},1000);
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
      // reveal anything already in/near the viewport immediately (robust even if observer is throttled)
      const r=el.getBoundingClientRect();
      if(r.top < (innerHeight*0.95)) el.classList.add('seen');
      else io.observe(el);
    });
    // final safety net: never leave content invisible
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
