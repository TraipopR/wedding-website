
/* =====================================================================
   CONGRATS — champagne-gold wedding confetti (canvas, no dependencies)
   - one temporary <canvas>, removed automatically when the last particle ends
   - burst from the button + a gentle shower across the viewport
   - sprites are pre-rendered once, so each frame is only drawImage calls
   ===================================================================== */
(function(){
  var btn = document.getElementById('congratsBtn');
  if(!btn) return;
  var thanks = document.getElementById('congratsThanks');
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ---- wedding palette: ivory · champagne · soft gold · beige · blush ----
  var GOLD      = ['#D9AE4E','#C9A24D','#E3BE6B','#B8862F'];
  var CHAMPAGNE = ['#EAD3A6','#F0DDB6','#E2C892'];
  var BEIGE     = ['#DCC6A0','#D2BA92'];
  var BLUSH     = ['#EFC5BA','#E8B4A8','#F2D0C6'];
  var IVORY     = ['#FFF7E3','#FFFFFF','#FBF0D5'];
  var SPARKLE   = ['#E9C56A','#F4D98A','#FFF0BF'];
  var PAPER_COLORS = GOLD.concat(GOLD, CHAMPAGNE, CHAMPAGNE, IVORY, IVORY, BEIGE, BLUSH);
  var PETAL_COLORS = BLUSH.concat(BLUSH, IVORY, CHAMPAGNE);
  var DOT_COLORS   = GOLD.concat(CHAMPAGNE, IVORY);

  function pick(a){ return a[(Math.random() * a.length) | 0]; }
  function rand(a, b){ return a + Math.random() * (b - a); }

  // ---- pre-rendered sprites (shadow/glow baked in) ----
  var sprites = {};
  function lighten(hex, amt){
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  var BOX = { paper:[18,13], petal:[20,15], dot:[12,12], star:[30,30] };
  function sprite(kind, color){
    var key = kind + color;
    if(sprites[key]) return sprites[key];
    var W = BOX[kind][0], H = BOX[kind][1];
    var c = document.createElement('canvas');
    c.width = Math.ceil(W * DPR); c.height = Math.ceil(H * DPR);
    var x = c.getContext('2d');
    x.scale(DPR, DPR); x.translate(W / 2, H / 2);
    x.shadowColor = 'rgba(120,84,28,.30)'; x.shadowBlur = 2.2 * DPR; x.shadowOffsetY = .8 * DPR;
    x.strokeStyle = 'rgba(170,128,50,.35)'; x.lineWidth = .6;
    var grad;
    if(kind === 'paper'){
      grad = x.createLinearGradient(-6, -3.5, 6, 3.5); grad.addColorStop(0, color); grad.addColorStop(1, lighten(color, .4));
      x.fillStyle = grad; x.beginPath(); x.rect(-6, -3.5, 12, 7); x.fill(); x.stroke();
    } else if(kind === 'petal'){
      grad = x.createLinearGradient(-7, 0, 7, 0); grad.addColorStop(0, color); grad.addColorStop(1, lighten(color, .45));
      x.fillStyle = grad; x.beginPath();
      x.moveTo(-7, 0); x.bezierCurveTo(-6, -6, 4, -7, 7, -1); x.bezierCurveTo(6, 5, -2, 6, -7, 0);
      x.fill(); x.stroke();
      x.shadowColor = 'transparent'; x.strokeStyle = 'rgba(255,255,255,.45)';
      x.beginPath(); x.moveTo(-5.5, 0); x.lineTo(3, -.6); x.stroke();
    } else if(kind === 'dot'){
      x.fillStyle = color; x.beginPath(); x.arc(0, 0, 2.6, 0, 6.2832); x.fill(); x.stroke();
    } else {
      x.shadowColor = 'rgba(233,190,90,.95)'; x.shadowBlur = 5 * DPR; x.shadowOffsetY = 0; x.lineWidth = 0;
      x.fillStyle = color; x.beginPath();
      x.moveTo(0, -9); x.quadraticCurveTo(1, -1, 9, 0); x.quadraticCurveTo(1, 1, 0, 9);
      x.quadraticCurveTo(-1, 1, -9, 0); x.quadraticCurveTo(-1, -1, 0, -9); x.fill();
    }
    return (sprites[key] = { c:c, w:W, h:H });
  }

  // ---- particle system ----
  var canvas = null, ctx = null, raf = 0, last = 0, vw = 0, vh = 0;
  var particles = [], flashes = [];

  function resize(){
    if(!canvas) return;
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = Math.round(vw * DPR); canvas.height = Math.round(vh * DPR);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
  }
  function ensureCanvas(){
    if(canvas) return;
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:90;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function teardown(){
    cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('resize', resize);
    if(canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = ctx = null; particles.length = 0; flashes.length = 0;
  }

  function pickKind(){
    var r = Math.random();
    return r < .38 ? 'paper' : r < .64 ? 'petal' : r < .80 ? 'dot' : 'star';
  }
  function make(kind, o){
    var color = kind === 'paper' ? pick(PAPER_COLORS) : kind === 'petal' ? pick(PETAL_COLORS)
              : kind === 'dot' ? pick(DOT_COLORS) : pick(SPARKLE);
    var size = kind === 'star' ? rand(.7, 1.3) : kind === 'petal' ? rand(1.15, 1.85) : rand(1.0, 1.7);
    return {
      sp: sprite(kind, color), kind: kind, size: size,
      x: o.x, y: o.y, vx: o.vx, vy: o.vy, k: o.k, term: o.term, drift: rand(-22, 22),
      rot: rand(0, 6.283), spin: kind === 'petal' ? rand(-3.5, 3.5) : kind === 'star' ? rand(-1.5, 1.5) : rand(-7, 7),
      flip: rand(0, 6.283), flipSpd: rand(3, 8),
      swayPh: rand(0, 6.283), swayF: rand(1.5, 3.5), swayA: rand(10, 36),
      tw: rand(0, 6.283),
      age: 0, delay: o.delay, life: o.life
    };
  }

  // burst: fans upward + some sideways/downward, decelerating with air drag
  function spawnBurst(ox, oy, n){
    for(var i = 0; i < n; i++){
      var up = Math.random() < .78;
      var a = up ? -Math.PI * rand(.04, .96) : rand(0, 6.283);
      var u = .3 + .7 * Math.pow(Math.random(), .8);
      var ca = Math.cos(a), sa = Math.sin(a);
      var limY = sa < 0 ? Math.min(oy * .92, vh * .8) : (vh - oy) * .5;
      var dx = ca * u * vw * .55, dy = sa * u * limY;
      var k = rand(2.2, 3.2);
      make_push(make(pickKind(), {
        x: ox + ca * 10, y: oy + sa * 10, vx: k * dx, vy: k * dy, k: k,
        term: rand(90, 170), delay: rand(0, .08), life: rand(3.0, 3.9)
      }));
    }
  }
  // shower: gentle fall from above so the whole screen is covered
  function spawnShower(n){
    for(var i = 0; i < n; i++){
      var life = rand(2.7, 3.3);
      var term = Math.max(150, Math.min(300, vh * rand(.8, 1.1) / life));
      make_push(make(pickKind(), {
        x: rand(0, vw), y: -rand(10, 70), vx: rand(-20, 20), vy: rand(60, 120), k: 1.6,
        term: term, delay: rand(.25, 1.0), life: life
      }));
    }
  }
  function make_push(p){ particles.push(p); }

  function step(dt){
    var i = particles.length;
    while(i--){
      var p = particles[i];
      if(p.delay > 0){ p.delay -= dt; continue; }
      p.age += dt;
      if(p.age >= p.life || p.y > vh + 40 || p.x < -120 || p.x > vw + 120){
        particles[i] = particles[particles.length - 1]; particles.pop(); continue;
      }
      var e = Math.exp(-p.k * dt);                       // frame-rate independent drag
      p.vx = p.drift + (p.vx - p.drift) * e;
      p.vy = p.term  + (p.vy - p.term)  * e;
      p.x += (p.vx + Math.sin(p.swayPh + p.age * p.swayF) * p.swayA) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt; p.flip += p.flipSpd * dt;
    }
    for(var f = flashes.length - 1; f >= 0; f--){
      flashes[f].age += dt;
      if(flashes[f].age >= flashes[f].life) flashes.splice(f, 1);
    }
  }

  function render(){
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // soft golden flash + ring at the "popper"
    for(var f = 0; f < flashes.length; f++){
      var fl = flashes[f], t = fl.age / fl.life, r = 30 + t * 170, a = (1 - t) * (1 - t) * .55;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var g = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, r);
      g.addColorStop(0, 'rgba(255,244,205,' + a + ')');
      g.addColorStop(.45, 'rgba(243,181,49,' + (a * .45) + ')');
      g.addColorStop(1, 'rgba(243,181,49,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fl.x, fl.y, r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(233,190,90,' + (a * 1.2) + ')'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(fl.x, fl.y, r * .85, 0, 6.2832); ctx.stroke();
    }

    for(var i = 0; i < particles.length; i++){
      var p = particles[i];
      if(p.delay > 0) continue;
      var life = p.age / p.life;
      var fo = life > .68 ? 1 - (life - .68) / .32 : 1;
      var alpha = Math.min(1, p.age / .12) * fo * fo * (3 - 2 * fo);
      var sy = 1, sc = p.size;
      if(p.kind === 'paper' || p.kind === 'petal') sy = Math.max(.14, Math.abs(Math.cos(p.flip)));
      else if(p.kind === 'star'){
        var tw = Math.sin(p.tw + p.age * 9);
        alpha *= .65 + .35 * tw; sc *= .85 + .15 * tw;
      }
      var c = Math.cos(p.rot), s = Math.sin(p.rot);
      ctx.globalAlpha = alpha;
      ctx.setTransform(DPR * c, DPR * s, -DPR * s * sy, DPR * c * sy, DPR * p.x, DPR * p.y);
      ctx.drawImage(p.sp.c, -p.sp.w * sc / 2, -p.sp.h * sc / 2, p.sp.w * sc, p.sp.h * sc);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now){
    var dt = Math.min(.033, (now - last) / 1000); last = now;
    step(dt); render();
    if(particles.length || flashes.length) raf = requestAnimationFrame(frame);
    else teardown();                                     // all done -> remove canvas & listeners
  }

  // ---- reduced motion: no movement, just a calm text acknowledgement ----
  var thanksTimer = null;
  function showThanks(){
    if(!thanks) return;
    thanks.textContent = 'ขอบคุณที่ร่วมยินดีกับเรา 💛';
    clearTimeout(thanksTimer);
    thanksTimer = setTimeout(function(){ thanks.textContent = ''; }, 4500);
  }

  btn.addEventListener('click', function(){
    if(mq && mq.matches){ showThanks(); return; }
    var r = btn.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    ensureCanvas();
    var small = vw < 600;
    var nb = small ? 80 : 115, ns = small ? 36 : 56;
    if(particles.length > 400){ nb = Math.round(nb * .4); ns = 0; }   // cap on rapid re-clicks
    spawnBurst(ox, oy, nb);
    spawnShower(ns);
    flashes.push({ x:ox, y:oy, age:0, life:.6 });
    if(!raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  });
})();