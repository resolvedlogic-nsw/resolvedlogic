/* ============================================================
   Resolved Logic: hero animation (home page only)
   Tangle, resolve, hold, twist into rope, unwind into parallel
   strings that pluck under the cursor. Echoes the logo mark.
   ============================================================ */
  (function(){
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var canvas = document.getElementById('tangleCanvas');
    var ctx = canvas.getContext('2d');
    var heroEl = document.getElementById('hero');
    var stateTag = document.getElementById('stateTag');
    var complexityWord = document.getElementById('complexityWord');
    var cardEls = Array.prototype.slice.call(document.querySelectorAll('.strand-card'));

    var N = 30;
    var MAX_ANGLE_DEG = 15;
    var SAMPLES = 44;
    var LEFT_X = 0.02;                  // left edge every phase's geometry reaches toward
    var CP = { x: 1.08, y: .50 };       // fan convergence point
    var RAY_LEN = CP.x - LEFT_X;        // fan reaches LEFT_X, not just the middle of the hero —
                                         // on mobile there's no headline beside it to justify a gap
    var ROPE_START = { x: LEFT_X, y: .50 };
    var ROPE_END   = { x: 1.02, y: .50 };
    /* Strands run flush to the left edge (x=0) on both layouts — on
       desktop that's under the headline/veil anyway, and on mobile a
       CSS fade on .hero-stage's left edge covers the same distance so
       the strings taper off naturally instead of ending in a hard cut. */
    var PAR_X0 = 0, PAR_X1 = .96;       // parallel "string" span (horizontal)
    var PAR_Y0 = .31, PAR_Y1 = .69;     // parallel "string" band (vertical)
    var RMAX = 0.046;                   // rope radius
    var HELIX_TURNS = 1.6;
    var ROT_SPEED = (2*Math.PI)/2.2;    // rad/s while twisted

    var PLUCK_FREQ = 7;                 // Hz
    var PLUCK_DECAY = 3.2;              // 1/s
    var PLUCK_AMP = 0.030;              // fraction of H
    var PLUCK_LIFE = 1.6;               // s
    var PLUCK_COOLDOWN = 150;           // ms
    /* Hit zone is a fraction of the gap between adjacent strings, not
       a fixed pixel value — a fixed px threshold would make
       neighbouring strings' hit zones overlap. 0.42 of the gap keeps
       adjacent zones from ever touching. */
    var STRING_GAP = (PAR_Y1-PAR_Y0)/(N-1);
    var HIT_FRAC = STRING_GAP * 0.42;

    var T_RESOLVE = 4200;
    var T_HOLD    = T_RESOLVE + 1400;
    var T_TWIST   = T_HOLD + 3500;
    var T_ROPE    = T_TWIST + 1500;
    var T_UNWIND  = T_ROPE + 3500;

    var COLORS = { ink:'25,29,38', orange:'232,101,10' };

    function mulberry32(seed){
      return function(){
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    function buildThreads(){
      var rand = mulberry32(1337);
      var list = [];
      for(var i=0; i<N; i++){
        var chaotic = [];
        for(var k=0; k<4; k++){
          chaotic.push({ x: 0.05 + rand()*0.85, y: 0.06 + rand()*0.88 });
        }
        var angleDeg = -MAX_ANGLE_DEG + i*(2*MAX_ANGLE_DEG)/(N-1);
        var angleRad = angleDeg * Math.PI/180;
        var isOrange = (i % 3 === 0);
        list.push({
          chaotic: chaotic,
          fanOrigin: { x: CP.x - RAY_LEN*Math.cos(angleRad), y: CP.y - RAY_LEN*Math.sin(angleRad) },
          parallelY: PAR_Y0 + i*STRING_GAP,
          rotPhase: i * (2*Math.PI/N),
          color: isOrange ? 'orange' : 'ink',
          alpha: 0.16 + ((i*5) % 6)*0.045,
          width: isOrange ? (1.9 + (i%2)*0.3) : (1.2 + (i%4)*0.13),
          pluckActive: false, pluckStart: 0, lastPluckTs: -9999
        });
      }
      return list;
    }
    var THREADS = buildThreads();

    function lerpN(a,b,t){ return a+(b-a)*t; }
    function lerpPt(a,b,t){ return { x: lerpN(a.x,b.x,t), y: lerpN(a.y,b.y,t) }; }
    function easeInOutCubic(t){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
    function cubicAt(p0,p1,p2,p3,u){
      var mt = 1-u;
      return {
        x: mt*mt*mt*p0.x + 3*mt*mt*u*p1.x + 3*mt*u*u*p2.x + u*u*u*p3.x,
        y: mt*mt*mt*p0.y + 3*mt*mt*u*p1.y + 3*mt*u*u*p2.y + u*u*u*p3.y
      };
    }
    function fanPoint(th,u){ return lerpPt(th.fanOrigin, CP, u); }
    function ropePoint(u){ return lerpPt(ROPE_START, ROPE_END, u); }
    function parallelPoint(th,u){ return { x: lerpN(PAR_X0, PAR_X1, u), y: th.parallelY }; }

    function sizeCanvas(){
      var rect = heroEl.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      W = rect.width; H = rect.height;
    }
    var W=0, H=0;
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    function computeBase(th, u, st){
      var base, r, ang;
      switch(st.phase){
        case 'resolve':
          base = lerpPt(cubicAt(th.chaotic[0],th.chaotic[1],th.chaotic[2],th.chaotic[3],u), fanPoint(th,u), easeInOutCubic(st.resolveT));
          break;
        case 'hold':
          base = fanPoint(th,u);
          /* The ripple varies along the strand's length (the u*3 term), so
             snapping it straight to full amplitude the instant hold starts
             bends an arrow-straight line into a wave in a single frame —
             reads as a jump cut. Ramping the amplitude in over ~0.9s keeps
             the strand razor-straight at the exact moment it resolves, and
             it's fully ramped in (envelope 1) well before hold ends. */
          base = { x: base.x, y: base.y + Math.sin(st.wobbleT*0.9 + th.rotPhase + u*3) * (0.005 * Math.min(st.wobbleT/0.9, 1)) };
          break;
        case 'twist':
          /* Envelope is (1 - easeInOutCubic(baseT)): exactly 1 at baseT=0,
             matching hold's fully-ramped-in wobble at the instant twist
             begins, then fading to 0 as the rope's own helix motion (r)
             takes over — so the handoff has no snap in either direction. */
          base = lerpPt(fanPoint(th,u), ropePoint(u), easeInOutCubic(st.baseT));
          base = { x: base.x, y: base.y + Math.sin(st.wobbleT*0.9 + th.rotPhase + u*3) * (0.005 * (1 - easeInOutCubic(st.baseT))) };
          r = RMAX * easeInOutCubic(st.baseT);
          ang = st.rotAngle + th.rotPhase + u*HELIX_TURNS*2*Math.PI;
          base = { x: base.x + r*0.28*Math.cos(ang), y: base.y + r*Math.sin(ang) };
          break;
        case 'ropehold':
          base = ropePoint(u);
          ang = st.rotAngle + th.rotPhase + u*HELIX_TURNS*2*Math.PI;
          base = { x: base.x + RMAX*0.28*Math.cos(ang), y: base.y + RMAX*Math.sin(ang) };
          break;
        case 'unwind':
          base = lerpPt(ropePoint(u), parallelPoint(th,u), easeInOutCubic(st.baseT));
          r = RMAX * (1 - easeInOutCubic(st.baseT));
          ang = st.rotAngle + th.rotPhase + u*HELIX_TURNS*2*Math.PI;
          base = { x: base.x + r*0.28*Math.cos(ang), y: base.y + r*Math.sin(ang) };
          break;
        default: // parallel
          base = parallelPoint(th,u);
          if(th.pluckActive){
            var age = (st.now - th.pluckStart)/1000;
            if(age > PLUCK_LIFE){ th.pluckActive = false; }
            else {
              var env = Math.sin(Math.PI*u);
              var amp = PLUCK_AMP * Math.exp(-PLUCK_DECAY*age) * Math.cos(2*Math.PI*PLUCK_FREQ*age);
              base = { x: base.x, y: base.y + env*amp };
            }
          }
      }
      return { x: base.x*W, y: base.y*H };
    }

    function draw(st){
      ctx.clearRect(0,0,W,H);
      for(var ti=0; ti<THREADS.length; ti++){
        var th = THREADS[ti];
        ctx.beginPath();
        for(var s=0; s<=SAMPLES; s++){
          var P = computeBase(th, s/SAMPLES, st);
          if(s===0) ctx.moveTo(P.x,P.y); else ctx.lineTo(P.x,P.y);
        }
        ctx.strokeStyle = 'rgba(' + COLORS[th.color] + ',' + th.alpha + ')';
        ctx.lineWidth = th.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        if(st.phase === 'resolve' && st.resolveT < 0.94){
          var P0 = computeBase(th, 0, st);
          var nodeAlpha = (1-st.resolveT) * 0.30;
          ctx.beginPath();
          ctx.arc(P0.x, P0.y, 2.4, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(' + COLORS[th.color] + ',' + nodeAlpha + ')';
          ctx.fill();
        }
      }
    }

    var startTs = null, rotStartTs = null, raf = null, lastLabel = null, currentPhase = 'resolve';

    var STATE_LABELS = {
      resolve:'STATE: TANGLED', hold:'STATE: RESOLVED', twist:'STATE: TWISTING',
      ropehold:'STATE: ROPE', unwind:'STATE: UNWINDING', parallel:'STATE: LISTENING'
    };
    function setLabel(phase, resolveT){
      var label = (phase==='resolve' && resolveT>=1) ? STATE_LABELS.hold : STATE_LABELS[phase];
      if(label !== lastLabel){ lastLabel = label; stateTag.textContent = label; }
    }

    /* Product/benefit cards — auto-cycle once the strands have
       settled. Independent of the cursor by design. */
    var CARD_HOLD_MS = 4200, CARD_GAP_MS = 600, CARD_TRANSITION_MS = 600;
    var contentStarted = false, contentTimer = null;

    function cycleCards(idx){
      var el = cardEls[idx];
      el.classList.add('visible');
      contentTimer = setTimeout(function(){
        el.classList.remove('visible');
        contentTimer = setTimeout(function(){
          cycleCards((idx+1) % cardEls.length);
        }, CARD_GAP_MS + CARD_TRANSITION_MS);
      }, CARD_HOLD_MS);
    }
    function startContentCycle(){
      if(contentStarted || !cardEls.length) return;
      contentStarted = true;
      cycleCards(0);
    }

    function frame(ts){
      if(startTs === null) startTs = ts;
      var elapsed = ts - startTs;
      var st = { now: ts };

      /* Continuous from the moment the fan resolves, never reset per-phase —
         lets the idle wobble hand off from 'hold' into 'twist' at the exact
         same value on both sides instead of snapping to a different formula. */
      st.wobbleT = Math.max(0, elapsed - T_RESOLVE) / 1000;

      if(elapsed < T_RESOLVE){
        st.phase = 'resolve'; st.resolveT = Math.min(elapsed/T_RESOLVE, 1);
      } else if(elapsed < T_HOLD){
        st.phase = 'hold';
      } else {
        if(rotStartTs === null) rotStartTs = ts;
        st.rotAngle = ROT_SPEED * ((ts-rotStartTs)/1000);
        if(elapsed < T_TWIST){ st.phase='twist'; st.baseT = (elapsed-T_HOLD)/(T_TWIST-T_HOLD); }
        else if(elapsed < T_ROPE){ st.phase='ropehold'; }
        else if(elapsed < T_UNWIND){ st.phase='unwind'; st.baseT = (elapsed-T_ROPE)/(T_UNWIND-T_ROPE); }
        else { st.phase='parallel'; }
      }

      currentPhase = st.phase;
      setLabel(st.phase, st.resolveT);
      draw(st);
      if(st.phase === 'parallel') startContentCycle();
      raf = requestAnimationFrame(frame);
    }

    function startHeroAnimation(){
      sizeCanvas();
      if(reduceMotion){
        setLabel('hold', 1);
        draw({ phase:'hold', idleT:0 });
        currentPhase = 'hold';
        startContentCycle();
        return;
      }
      complexityWord.classList.add('animate');
      raf = requestAnimationFrame(frame);
    }

    /* ── Guitar-string hover pluck (parallel phase only) ── */
    if(!reduceMotion){
      var mouseFrac = null;
      heroEl.addEventListener('mousemove', function(e){
        if(currentPhase !== 'parallel') return;
        var rect = canvas.getBoundingClientRect();
        mouseFrac = { x: (e.clientX-rect.left)/rect.width, y: (e.clientY-rect.top)/rect.height };
        if(mouseFrac.x < PAR_X0 || mouseFrac.x > PAR_X1) return;
        var bestIdx = -1, bestDist = HIT_FRAC;
        for(var i=0; i<THREADS.length; i++){
          var d = Math.abs(mouseFrac.y - THREADS[i].parallelY);
          if(d < bestDist){ bestDist = d; bestIdx = i; }
        }
        if(bestIdx >= 0){
          var th = THREADS[bestIdx];
          var now = performance.now();
          if(now - th.lastPluckTs > PLUCK_COOLDOWN){
            th.pluckActive = true; th.pluckStart = now; th.lastPluckTs = now;
          }
        }
      });
      heroEl.addEventListener('mouseleave', function(){ mouseFrac = null; });
    }

    startHeroAnimation();
  })();
