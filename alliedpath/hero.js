/* AlliedPath hero: ECG intro, surgical-light spotlight, journey monitor, scroll journey */
(function () {
  "use strict";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement, hero = document.querySelector(".hx");
  if (!hero) return;
  var go = function () { root.classList.add("hx-go"); };

  // split the headline into words so they can rise in one by one
  var h1 = hero.querySelector("h1"), wi = 0;
  (function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          var s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", wi++); s.textContent = t; frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== "BR") split(n);
    });
  })(h1);

  // ---------- intro: one heartbeat opens the theatre (once per visit) ----------
  var seen = false;
  try { seen = sessionStorage.getItem("ap-intro") === "1"; sessionStorage.setItem("ap-intro", "1"); } catch (e) {}
  if (REDUCE || seen || window.scrollY > 50) { go(); }
  else {
    var ov = document.createElement("div");
    ov.className = "hx-intro"; ov.setAttribute("aria-hidden", "true");
    ov.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength="1" d="M0 50 L38 50 L40.5 46 L43 50 L48 50 L49.5 56 L52 6 L54.5 64 L56 50 L60 50 L62.5 45 L65 50 L100 50"/></svg><i class="flash"></i><small>AlliedPath</small>';
    document.body.appendChild(ov);
    var done = false;
    var open = function () {
      if (done) return; done = true; go(); ov.classList.add("open");
      setTimeout(function () { ov.remove(); }, 1100);
    };
    ov.addEventListener("click", open);
    setTimeout(open, 1050);
  }

  // ---------- surgical light follows the pointer (wanders on touch) ----------
  var lit = hero.querySelector(".ph.lit"), lamp = hero.querySelector(".lamp"), phs = hero.querySelectorAll(".ph");
  var tx = 0.7, ty = 0.36, cx = tx, cy = ty, user = 0, t0 = performance.now();
  var setL = function () {
    var w = hero.clientWidth, h = hero.clientHeight, x = cx * w + "px", y = cy * h + "px";
    [lit, lamp].forEach(function (el) { if (el) { el.style.setProperty("--mx", x); el.style.setProperty("--my", y); } });
  };
  var sizeL = function () {
    var r = Math.max(180, Math.min(340, hero.clientWidth * 0.24));
    if (lit) lit.style.setProperty("--lr", r + "px"); if (lamp) lamp.style.setProperty("--lw", r * 1.9 + "px");
  };
  sizeL(); setL(); window.addEventListener("resize", function () { sizeL(); setL(); });
  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var b = hero.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; ty = (e.clientY - b.top) / b.height; user = performance.now();
  });
  var heroOn = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(hero);
  if (!REDUCE) (function loop(now) {
    if (heroOn && !document.hidden) {
      if (now - user > 2500) { var k = (now - t0) / 1000; tx = 0.66 + Math.sin(k * 0.45) * 0.2; ty = 0.36 + Math.sin(k * 0.71) * 0.14; }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; setL();
      var y = window.scrollY; if (y < innerHeight * 1.2) Array.prototype.forEach.call(phs, function (p) { p.style.transform = "translate3d(0," + y * 0.22 + "px,0)"; });
    }
    requestAnimationFrame(loop);
  })(performance.now());

  // ---------- journey monitor: a heartbeat travels Learn -> Get placed ----------
  var mon = hero.querySelector(".mon");
  if (mon) (function () {
    var svg = mon.querySelector("svg"), live = mon.querySelector(".live"), base = mon.querySelector(".base"), head = mon.querySelector(".head"), bpm = mon.querySelector(".bpm");
    var sts = Array.prototype.slice.call(mon.querySelectorAll(".st"));
    var XS = [60, 280, 500, 720, 940], Y = 45;
    // flat line between stations with one ECG complex in the middle of each gap
    var d = "M" + XS[0] + " " + Y;
    for (var i = 0; i < XS.length - 1; i++) {
      var m = (XS[i] + XS[i + 1]) / 2;
      d += " L" + (m - 34) + " " + Y + " l7 -6 l7 6 l6 0 l4 7 l6 -40 l6 46 l4 -13 l8 0 l8 -7 l8 7 L" + XS[i + 1] + " " + Y;
    }
    live.setAttribute("d", d); base.setAttribute("d", d);
    sts.forEach(function (s, i) { s.style.left = XS[i] / 10 + "%"; });
    var L = live.getTotalLength();
    live.style.strokeDasharray = L; live.style.strokeDashoffset = L;
    var place = function (len) {
      var p = live.getPointAtLength(len);
      head.style.left = p.x / 10 + "%"; head.style.top = (p.y / 90) * svg.getBoundingClientRect().height + "px";
      return p;
    };
    var confetti = function (st) {
      var cols = ["#E8A33D", "#34C3A0", "#FFF4D6", "#F07B5A", "#8FD3FF"];
      for (var i = 0; i < 28; i++) {
        var c = document.createElement("i"); c.className = "cf";
        var a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 90;
        c.style.background = cols[i % cols.length];
        c.style.setProperty("--dx", Math.cos(a) * r - 20 + "px"); c.style.setProperty("--dy", Math.sin(a) * r * 0.8 - 40 + "px");
        c.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg"); c.style.animationDelay = Math.random() * 0.12 + "s";
        st.appendChild(c); setTimeout(function (el) { el.remove(); }.bind(null, c), 1800);
      }
    };
    if (REDUCE) { live.style.strokeDashoffset = 0; sts.forEach(function (s) { s.classList.add("on"); }); sts[4].classList.add("won"); return; }
    var DUR = 6200, start = null, phase = "run", hold = 0, beat = 0, monOn = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { monOn = es[0].isIntersecting; }).observe(mon);
    var reset = function () {
      mon.classList.remove("fade", "won"); sts.forEach(function (s) { s.classList.remove("on", "won"); });
      live.style.transition = "none"; live.style.strokeDashoffset = L; start = null; phase = "run";
    };
    var last = performance.now();
    (function tick(now) {
      var dt = now - last; last = now;
      if (!root.classList.contains("hx-go") || !monOn || document.hidden) { requestAnimationFrame(tick); return; }
      if (phase === "run") {
        if (start === null) start = now - 0;
        var t = Math.min(1, (now - start) / DUR), e = t, len = L * e;
        live.style.strokeDashoffset = L - len;
        var p = place(len); head.classList.add("on");
        sts.forEach(function (s, i) { if (p.x >= XS[i] - 4 && !s.classList.contains("on")) s.classList.add("on"); });
        if (p.y < Y - 20 && now - beat > 400) { beat = now; if (bpm) bpm.textContent = (72 + Math.round(Math.random() * 6)) + " bpm"; }
        if (t >= 1) { phase = "hold"; hold = now; sts[4].classList.add("won"); mon.classList.add("won"); confetti(sts[4]); head.classList.remove("on"); }
      } else if (phase === "hold" && now - hold > 3200) { phase = "fade"; hold = now; mon.classList.add("fade"); }
      else if (phase === "fade" && now - hold > 700) { reset(); }
      requestAnimationFrame(tick);
    })(performance.now());
  })();

  // ---------- scroll journey (sticky on wide screens) ----------
  var sj = document.querySelector(".sj");
  if (sj) (function () {
    var steps = Array.prototype.slice.call(sj.querySelectorAll(".sj-steps > li")), n = steps.length;
    var pr = sj.querySelector(".dial .pr"), tks = sj.querySelectorAll(".dial .tk"), num = sj.querySelector(".dial .n"), ico = sj.querySelector(".dial .ico");
    var word = sj.querySelector(".sj-word"), dots = sj.querySelector(".sj-dots");
    var GLOW = ["#0E7C66", "#1F6F9A", "#7A5BC4", "#C2662F", "#E8A33D"];
    var WORDS = steps.map(function (s) { return s.getAttribute("data-w") || ""; });
    var ICONS = steps.map(function (s) { var t = s.querySelector("template"); return t ? t.innerHTML : ""; });
    var CIRC = 553, cur = -1, liveMode = false;
    if (dots) { dots.innerHTML = steps.map(function (s, i) { return '<button type="button" aria-label="Step ' + (i + 1) + ': ' + s.querySelector("h3").textContent + '"></button>'; }).join("");
      Array.prototype.forEach.call(dots.children, function (b, i) { b.addEventListener("click", function () {
        var top = sj.getBoundingClientRect().top + window.scrollY, span = sj.offsetHeight - innerHeight;
        window.scrollTo({ top: top + span * (i + 0.5) / n, behavior: REDUCE ? "auto" : "smooth" }); }); }); }
    var setStep = function (k) {
      if (k === cur) return; cur = k;
      steps.forEach(function (s, i) { s.classList.toggle("on", i === k); s.classList.toggle("past", i < k); });
      Array.prototype.forEach.call(tks, function (t, i) { t.classList.toggle("on", i <= k); });
      if (dots) Array.prototype.forEach.call(dots.children, function (b, i) { b.classList.toggle("on", i === k); });
      sj.style.setProperty("--glow", GLOW[k % GLOW.length]);
      if (num) { num.textContent = "0" + (k + 1); num.classList.remove("swap"); void num.offsetWidth; num.classList.add("swap"); }
      if (ico) { ico.innerHTML = ICONS[k]; ico.classList.remove("swap"); void ico.offsetWidth; ico.classList.add("swap"); }
      if (word) word.textContent = WORDS[k];
    };
    var onScroll = function () {
      if (!liveMode) return;
      var b = sj.getBoundingClientRect(), span = sj.offsetHeight - innerHeight;
      var p = Math.max(0, Math.min(1, -b.top / span));
      setStep(Math.min(n - 1, Math.floor(p * n * 0.999)));
      if (pr) pr.style.strokeDashoffset = CIRC * (1 - p);
      if (word) word.style.transform = "translateX(" + (8 - p * 40) + "vw)";
    };
    var mq = window.matchMedia("(min-width: 861px) and (min-height: 600px)");
    var mode = function () {
      liveMode = !REDUCE && mq.matches;
      sj.classList.toggle("live", liveMode);
      if (!liveMode) { steps.forEach(function (s) { s.classList.remove("on", "past"); }); cur = -1; if (word) { word.textContent = ""; } }
      else { cur = -1; onScroll(); }
    };
    if (mq.addEventListener) mq.addEventListener("change", mode); else if (mq.addListener) mq.addListener(mode);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    mode();
  })();
})();
