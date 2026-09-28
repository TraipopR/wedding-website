
(function(){
  // ---- small reusable sunflower SVG markup ----
  function sunflowerSVG(){
    return '<svg viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg">'+
      '<line x1="30" y1="40" x2="30" y2="88" stroke="#5C7A37" stroke-width="3"/>'+
      '<path d="M30 55 C 18 55, 12 68, 20 74" stroke="#7E9A4E" stroke-width="3" fill="none"/>'+
      '<g transform="translate(30,26)">'+
        Array.from({length:10}).map(function(_,i){
          var angle = i*36;
          return '<ellipse cx="0" cy="-20" rx="6" ry="14" fill="#F3B531" transform="rotate('+angle+')"/>';
        }).join('')+
        '<circle r="11" fill="#8B5A2B"/>'+
      '</g>'+
    '</svg>';
  }

  var row = document.getElementById('sunflowerRow');
  for(var i=0;i<7;i++){ row.insertAdjacentHTML('beforeend', sunflowerSVG()); }

  var wreath = document.getElementById('wreathFlowers');
  var wreathHTML = '';
  var count = 8;
  for(var w=0; w<count; w++){
    var ang = (360/count)*w;
    var rad = ang * Math.PI/180;
    var x = 100 + Math.cos(rad)*92;
    var y = 100 + Math.sin(rad)*92;
    wreathHTML += '<g transform="translate('+x+','+y+') rotate('+ang+') scale(0.5)">'+
      '<g transform="translate(0,10)">'+
      Array.from({length:8}).map(function(_,i){
        var a2 = i*45;
        return '<ellipse cx="0" cy="-14" rx="5" ry="11" fill="#F3B531" transform="rotate('+a2+')"/>';
      }).join('')+
      '<circle r="8" fill="#8B5A2B"/>'+
      '</g></g>';
  }
  wreath.innerHTML = wreathHTML;

  var footerFlowers = document.getElementById('footerFlowers');
  for(var f=0; f<5; f++){ footerFlowers.insertAdjacentHTML('beforeend', sunflowerSVG()); }

  // ---- countdown ----
  var target = new Date('2026-10-04T08:19:00+07:00').getTime();
  function updateCountdown(){
    var now = Date.now();
    var diff = Math.max(0, target - now);
    var d = Math.floor(diff/86400000);
    var h = Math.floor((diff%86400000)/3600000);
    var m = Math.floor((diff%3600000)/60000);
    var s = Math.floor((diff%60000)/1000);
    var pad = function(n){ return String(n).padStart(2,'0'); };
    var elD = document.getElementById('cd-days');
    var elH = document.getElementById('cd-hours');
    var elM = document.getElementById('cd-mins');
    var elS = document.getElementById('cd-secs');
    if(elD){ elD.textContent = pad(d); elH.textContent = pad(h); elM.textContent = pad(m); elS.textContent = pad(s); }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ---- card flip ----
  var card = document.getElementById('weddingCard');
  function toggleCard(){
    var flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  }
  card.addEventListener('click', toggleCard);
  card.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggleCard(); }
  });

  // ---- falling petals (cute ambient animation, capped count) ----
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced){
    var layer = document.getElementById('petalsLayer');
    var colors = ['#F3B531','#F6C862','#E8A93A'];
    function spawnPetal(){
      if(layer.children.length > 16) return;
      var petal = document.createElement('div');
      petal.className = 'petal';
      var size = 8 + Math.random()*7;
      petal.style.width = size+'px';
      petal.style.height = (size*0.7)+'px';
      petal.style.left = (Math.random()*100)+'vw';
      petal.style.background = colors[Math.floor(Math.random()*colors.length)];
      petal.style.borderRadius = '60% 40% 60% 40%';
      var duration = 9 + Math.random()*7;
      petal.style.animationDuration = duration+'s';
      petal.style.setProperty('--drift', (Math.random()*80-40)+'px');
      petal.style.setProperty('--spin', (Math.random()*360)+'deg');
      layer.appendChild(petal);
      setTimeout(function(){ petal.remove(); }, duration*1000+200);
    }
    setInterval(spawnPetal, 1400);
    spawnPetal();
  }

  // ---- scroll reveal ----
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }
})();