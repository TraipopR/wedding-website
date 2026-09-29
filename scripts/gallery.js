
/* =====================================================================
   PHOTO GALLERY CONFIG  —  แก้รายชื่อรูปที่นี่ที่เดียว
   ใส่ไฟล์รูปไว้ในโฟลเดอร์ PHOTO_BASE_PATH แล้วเพิ่มชื่อไฟล์ลงในรายการ
   (ไฟล์ที่ไม่พบจะถูกข้ามอัตโนมัติ)
   ===================================================================== */
const PHOTO_BASE_PATH = 'assets/images/';
const PHOTO_IMAGES = [
  '03-couple.jpg',
  '05-couple.jpg',
  '02-couple.jpg',
  '07-couple.jpg',
  '08-couple.jpg',
  '01-couple.jpg',
  '04-couple.jpg',
  '09-couple.jpg',
  '11-couple.jpg',
  '12-couple.jpg',
  '13-couple.jpg',
  '14-couple.jpg',
  '15-couple.jpg',
  '10-couple.jpg',
  '06-couple.jpg',
];
const PHOTO_FADE_INTERVAL = 4500;   // ms ระหว่างการเปลี่ยนรูป (fade)
const PHOTO_MAX_ZOOM = 5;           // ซูมสูงสุด (เท่า)

(function(){
  var frame = document.getElementById('couplePhoto');
  if(!frame) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ALT = 'รูปคู่รัก ตะวันและโอ๊ต';
  var photos = [];
  var fadeIndex = 0, fadeTimer = null, lbOpen = false;

  // ---------- preload list, skip files that fail ----------
  function probe(name){
    return new Promise(function(resolve){
      var img = new Image();
      var src = PHOTO_BASE_PATH + name;
      img.onload  = function(){ resolve(src); };
      img.onerror = function(){ resolve(null); };
      img.src = src;
    });
  }

  Promise.all(PHOTO_IMAGES.map(probe)).then(function(list){
    photos = list.filter(Boolean).map(function(src, i, arr){
      return { src: src, alt: ALT + (arr.length > 1 ? ' รูปที่ ' + (i+1) : '') };
    });
    if(!photos.length){
      frame.innerHTML = '<span class="placeholder-icon">📷</span><p>เพิ่มรูปคู่รักของคุณที่นี่</p>';
      return;
    }
    buildFade();
  });

  // ---------- fade slideshow ----------
  function buildFade(){
    frame.textContent = '';
    photos.forEach(function(p, i){
      var img = document.createElement('img');
      img.className = 'fade-slide' + (i === 0 ? ' active' : '');
      img.src = p.src; img.alt = p.alt; img.draggable = false; img.decoding = 'async';
      frame.appendChild(img);
    });
    frame.classList.add('is-clickable');
    frame.setAttribute('role', 'button');
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('aria-haspopup', 'dialog');
    frame.setAttribute('aria-label', 'เปิดแกลเลอรี่รูปภาพ (' + photos.length + ' รูป)');
    startFade();
  }

  function showFade(i){
    var els = frame.querySelectorAll('.fade-slide');
    if(els.length < 2) return;
    var next = ((i % els.length) + els.length) % els.length;
    if(next === fadeIndex) return;
    var old = els[fadeIndex];
    old.classList.remove('active');
    old.classList.add('leaving');            // stays opaque underneath while the new one fades in
    clearTimeout(old._t);
    old._t = setTimeout(function(){ old.classList.remove('leaving'); }, 1500);
    fadeIndex = next;
    els[fadeIndex].classList.remove('leaving');
    els[fadeIndex].classList.add('active');
  }
  function startFade(){
    stopFade();
    if(reduced || photos.length < 2 || lbOpen || document.hidden) return;
    fadeTimer = setInterval(function(){ showFade(fadeIndex + 1); }, PHOTO_FADE_INTERVAL);
  }
  function stopFade(){ clearInterval(fadeTimer); fadeTimer = null; }
  document.addEventListener('visibilitychange', function(){ document.hidden ? stopFade() : startFade(); });

  frame.addEventListener('click', function(){ if(photos.length) openLB(fadeIndex); });
  frame.addEventListener('keydown', function(e){
    if((e.key === 'Enter' || e.key === ' ') && photos.length){ e.preventDefault(); openLB(fadeIndex); }
  });

  // ---------- lightbox ----------
  function $(id){ return document.getElementById(id); }
  var lb = $('lightbox'), viewport = $('lbViewport'), track = $('lbTrack'),
      counter = $('lbCounter'), thumbsEl = $('lbThumbs'),
      prevBtn = $('lbPrev'), nextBtn = $('lbNext'),
      zinBtn = $('lbZoomIn'), zoutBtn = $('lbZoomOut'), closeBtn = $('lbClose');

  var built = false, index = 0, lastFocus = null;
  var slideEls = [], imgEls = [], thumbEls = [];
  var st = { s:1, x:0, y:0 };                  // zoom state of the current slide

  function build(){
    photos.forEach(function(p, i){
      var slide = document.createElement('div');
      slide.className = 'lb-slide';
      var img = new Image();
      img.src = p.src; img.alt = p.alt; img.draggable = false;
      slide.appendChild(img); track.appendChild(slide);
      slideEls.push(slide); imgEls.push(img);

      var th = document.createElement('button');
      th.type = 'button'; th.className = 'lb-thumb';
      th.setAttribute('aria-label', 'ไปที่รูปที่ ' + (i+1));
      var ti = new Image(); ti.src = p.src; ti.alt = ''; ti.draggable = false;
      th.appendChild(ti);
      th.addEventListener('click', function(){ goTo(i); });
      thumbsEl.appendChild(th); thumbEls.push(th);
    });
    if(photos.length < 2) lb.classList.add('single');
    built = true;
  }

  function vw(){ return viewport.clientWidth; }

  function setTrack(dx, animate){
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translate3d(' + (-index * vw() + (dx || 0)) + 'px,0,0)';
  }

  function apply(animate){
    var img = imgEls[index];
    img.style.transition = animate ? 'transform .28s ease' : 'none';
    img.style.transform = 'translate3d(' + st.x + 'px,' + st.y + 'px,0) scale(' + st.s + ')';
    img.classList.toggle('zoomed', st.s > 1.01);
    zoutBtn.disabled = st.s <= 1.01;
    zinBtn.disabled  = st.s >= PHOTO_MAX_ZOOM - 0.01;
  }

  function clampPan(){
    var img = imgEls[index], slide = slideEls[index];
    var mx = Math.max(0, (img.offsetWidth  * st.s - slide.clientWidth)  / 2);
    var my = Math.max(0, (img.offsetHeight * st.s - slide.clientHeight) / 2);
    st.x = Math.min(mx, Math.max(-mx, st.x));
    st.y = Math.min(my, Math.max(-my, st.y));
  }

  function zoomAt(cx, cy, ns, animate){
    ns = Math.min(PHOTO_MAX_ZOOM, Math.max(1, ns));
    var r = slideEls[index].getBoundingClientRect();
    var px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
    var k = ns / st.s;
    st.x = px - (px - st.x) * k;
    st.y = py - (py - st.y) * k;
    st.s = ns;
    if(ns === 1){ st.x = 0; st.y = 0; }
    clampPan(); apply(animate);
  }

  function zoomBy(f){
    var r = viewport.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, st.s * f, true);
  }

  function resetZoom(animate){ st.s = 1; st.x = 0; st.y = 0; apply(animate); }

  function updateUI(){
    counter.textContent = (index + 1) + ' / ' + photos.length;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === photos.length - 1;
    thumbEls.forEach(function(t, i){
      t.classList.toggle('active', i === index);
      if(i === index) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    var t = thumbEls[index];
    if(t && thumbsEl.scrollTo){
      thumbsEl.scrollTo({ left: t.offsetLeft - (thumbsEl.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    }
  }

  function goTo(i){
    i = Math.max(0, Math.min(photos.length - 1, i));
    if(i !== index){
      resetZoom(true);                         // old slide eases back while it slides away
      index = i;
      st = { s:1, x:0, y:0 };
      apply(false);
    }
    setTrack(0, true);                         // carousel slide (also snaps back at the ends)
    updateUI();
  }

  function openLB(i){
    if(!built) build();
    lbOpen = true; stopFade();
    lastFocus = document.activeElement;
    imgEls.forEach(function(im){ im.style.transition = 'none'; im.style.transform = ''; im.classList.remove('zoomed', 'grabbing'); });
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    index = Math.max(0, Math.min(photos.length - 1, i));
    st = { s:1, x:0, y:0 };
    setTrack(0, false); apply(false); updateUI();
    closeBtn.focus({ preventScroll: true });
  }

  function closeLB(){
    if(!lbOpen) return;
    lbOpen = false;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    showFade(index);                           // frame continues from the photo you were viewing
    startFade();
    (lastFocus && lastFocus.focus ? lastFocus : frame).focus({ preventScroll: true });
  }

  prevBtn.addEventListener('click', function(){ goTo(index - 1); });
  nextBtn.addEventListener('click', function(){ goTo(index + 1); });
  zinBtn.addEventListener('click',  function(){ zoomBy(1.6); });
  zoutBtn.addEventListener('click', function(){ zoomBy(1 / 1.6); });
  closeBtn.addEventListener('click', closeLB);

  // ---------- keyboard ----------
  document.addEventListener('keydown', function(e){
    if(!lbOpen) return;
    switch(e.key){
      case 'Escape':     e.preventDefault(); closeLB(); break;
      case 'ArrowLeft':  e.preventDefault(); goTo(index - 1); break;
      case 'ArrowRight': e.preventDefault(); goTo(index + 1); break;
      case '+': case '=': e.preventDefault(); zoomBy(1.6); break;
      case '-': case '_': e.preventDefault(); zoomBy(1 / 1.6); break;
      case '0':          e.preventDefault(); resetZoom(true); break;
      case 'Tab':
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function(b){ return !b.disabled; });
        if(!f.length) break;
        var first = f[0], last = f[f.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        else if(!lb.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
        break;
    }
  });

  // ---------- wheel / trackpad zoom ----------
  viewport.addEventListener('wheel', function(e){
    e.preventDefault();
    var f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    zoomAt(e.clientX, e.clientY, st.s * f, false);
  }, { passive: false });

  // ---------- pointer gestures: swipe · pan · pinch · double-tap ----------
  var ptrs = new Map(), g = null, lastTap = { t:0, x:0, y:0 };
  function pts(){ return Array.from(ptrs.values()); }
  function dist(a){ return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; }
  function mid(a){ return { x:(a[0].x + a[1].x) / 2, y:(a[0].y + a[1].y) / 2 }; }

  function startSingle(x, y, target, moved){
    g = { mode: st.s > 1.01 ? 'pan' : 'swipe', sx:x, sy:y, ox:st.x, oy:st.y,
          dx:0, moved:!!moved, t:Date.now(), target:target, locked:null };
    if(g.mode === 'pan') imgEls[index].classList.add('grabbing');
  }

  viewport.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    try{ viewport.setPointerCapture(e.pointerId); }catch(_){}
    ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(ptrs.size === 1){
      startSingle(e.clientX, e.clientY, e.target, false);
      track.style.transition = 'none';
    } else if(ptrs.size === 2){
      var a = pts();
      g = { mode:'pinch', d0:dist(a), s0:st.s, lastMid:mid(a), moved:true };
      setTrack(0, true);
    }
  });

  viewport.addEventListener('pointermove', function(e){
    if(!ptrs.has(e.pointerId) || !g) return;
    ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });

    if(g.mode === 'pinch'){
      if(ptrs.size < 2) return;
      var a = pts(), m = mid(a);
      st.x += m.x - g.lastMid.x; st.y += m.y - g.lastMid.y; g.lastMid = m;
      zoomAt(m.x, m.y, g.s0 * dist(a) / g.d0, false);
      return;
    }
    var dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if(Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;

    if(g.mode === 'pan'){
      st.x = g.ox + dx; st.y = g.oy + dy;
      clampPan(); apply(false);
    } else {
      if(g.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)){
        g.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if(g.locked === 'x'){
        var atEdge = (index === 0 && dx > 0) || (index === photos.length - 1 && dx < 0);
        g.dx = atEdge ? dx * 0.3 : dx;         // rubber-band at the ends
        setTrack(g.dx, false);
      }
    }
  });

  function endPointer(e){
    if(!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    imgEls[index].classList.remove('grabbing');
    if(!g) return;

    if(g.mode === 'pinch'){
      if(ptrs.size < 2){
        if(st.s < 1.05) resetZoom(true);
        if(ptrs.size === 1){ var p = pts()[0]; startSingle(p.x, p.y, null, true); }
        else g = null;
      }
      return;
    }

    var gg = g; g = null;
    if(e.type === 'pointercancel'){ if(gg.mode === 'swipe') setTrack(0, true); return; }

    if(gg.mode === 'swipe' && gg.locked === 'x'){
      var dt = Math.max(Date.now() - gg.t, 1), w = vw();
      var fast = Math.abs(gg.dx) / dt > 0.5 && Math.abs(gg.dx) > 30;
      if(gg.dx < -w * 0.18 || (fast && gg.dx < 0)) goTo(index + 1);
      else if(gg.dx > w * 0.18 || (fast && gg.dx > 0)) goTo(index - 1);
      else setTrack(0, true);
      return;
    }

    if(!gg.moved){
      // tap on the dark backdrop (not the photo) closes
      if(gg.target && gg.target.tagName !== 'IMG' && st.s <= 1.01){ closeLB(); return; }
      var now = Date.now();
      if(now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30){
        lastTap.t = 0;
        if(st.s > 1.01) resetZoom(true); else zoomAt(e.clientX, e.clientY, 2.5, true);
      } else {
        lastTap = { t:now, x:e.clientX, y:e.clientY };
      }
    } else if(gg.mode === 'swipe'){
      setTrack(0, true);
    }
  }
  viewport.addEventListener('pointerup', endPointer);
  viewport.addEventListener('pointercancel', endPointer);
  viewport.addEventListener('dragstart', function(e){ e.preventDefault(); });

  window.addEventListener('resize', function(){
    if(!lbOpen) return;
    setTrack(0, false); clampPan(); apply(false);
  });
})();
