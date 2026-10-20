/* AlliedPath site-wide motion: word-by-word section headings, magnetic buttons, spotlight + tilt cards,
   demo-band aurora and sparkles, founder ring and count-up stats, channel cards. */
(function () {
  "use strict";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  // 1) section headings rise in word by word
  $$(".sec-head h2, .demo-in h2, .founder h2, .join h2").forEach(function (h) {
    if (h.getAttribute("data-split")) return; h.setAttribute("data-split", "1");
    var i = 0;
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
            var o = document.createElement("span"); o.className = "wm";
            var w = document.createElement("span"); w.className = "wi"; w.style.setProperty("--i", i++); w.textContent = t;
            o.appendChild(w); f.appendChild(o);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(h);
    h.classList.add("wsplit");
  });
  var io = ("IntersectionObserver" in window && !REDUCE) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("shown"); io.unobserve(e.target); } });
  }, { threshold: 0.3, rootMargin: "0px 0px -40px 0px" }) : null;
  $$("h2.wsplit").forEach(function (h) { if (io) io.observe(h); else h.classList.add("shown"); });

  // 2) demo band: aurora, spinning FREE stamp, sparkles
  var demo = document.querySelector(".demo-band");
  if (demo && !demo.querySelector(".aur")) {
    demo.insertAdjacentHTML("afterbegin", '<span class="aur a1" aria-hidden="true"></span><span class="aur a2" aria-hidden="true"></span><span class="aur a3" aria-hidden="true"></span>');
    var inner = demo.querySelector(".demo-in");
    if (inner) inner.insertAdjacentHTML("beforeend", '<span class="free-stamp" aria-hidden="true"><svg viewBox="0 0 100 100"><defs><path id="fs-c" d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0"/></defs><text><textPath href="#fs-c" textLength="222" lengthAdjust="spacingAndGlyphs">FREE DEMO \u2022 NO PAYMENT \u2022 FREE DEMO \u2022 NO PAYMENT \u2022 </textPath></text></svg><b>FREE</b></span>');
    if (!REDUCE) for (var k = 0; k < 14; k++) {
      var sp = document.createElement("i"); sp.className = "spark"; sp.setAttribute("aria-hidden", "true");
      sp.style.left = Math.random() * 100 + "%"; sp.style.top = Math.random() * 100 + "%";
      sp.style.animationDelay = (Math.random() * 4).toFixed(2) + "s"; sp.style.animationDuration = (2.5 + Math.random() * 2.5).toFixed(2) + "s";
      demo.appendChild(sp);
    }
  }

  // 3) founder: glowing ring + count-up stats
  var fimg = document.querySelector(".founder img");
  if (fimg && !fimg.parentNode.classList.contains("f-ring")) {
    var ring = document.createElement("div"); ring.className = "f-ring";
    fimg.parentNode.insertBefore(ring, fimg); ring.appendChild(fimg);
    ring.insertAdjacentHTML("beforeend", '<i class="f-badge" aria-hidden="true">Ph.D.</i>');
  }
  var stats = document.querySelector(".f-stats");
  if (stats) {
    var run = function () {
      stats.classList.add("shown");
      $$("b[data-count]", stats).forEach(function (b) {
        var n = +b.getAttribute("data-count"), t0 = null; if (REDUCE) return;
        (function step(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 1400); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    };
    if ("IntersectionObserver" in window && !REDUCE) { var so = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); so.disconnect(); } }, { threshold: 0.4 }); so.observe(stats); } else run();
  }

  // 4) channel cards: start their little animations when seen
  $$(".ch").forEach(function (c, i) {
    if ("IntersectionObserver" in window && !REDUCE) { var co = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { setTimeout(function () { c.classList.add("live"); }, i * 180); co.disconnect(); } }, { threshold: 0.35 }); co.observe(c); }
    else c.classList.add("live");
  });
  // the WhatsApp card uses the community link from Admin when one is set
  fetch("../content/alliedpath.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (s) {
    var a = document.querySelector("[data-ap-channel]"); if (!a) return;
    if (s && s.community_link && /^https:\/\//.test(s.community_link)) a.href = s.community_link;
    else if (s && s.whatsapp) { var wa = String(s.whatsapp).replace(/\D/g, ""); if (wa) a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hello, please add me to AlliedPath updates"); }
  }).catch(function () {});

  // safety net: anything on screen that the browser never reported as visible is shown anyway
  var kickT = null, kick = function () { clearTimeout(kickT); kickT = setTimeout(function () {
    $$("h2.wsplit:not(.shown), .f-stats:not(.shown), .ch:not(.live)").forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { if (el.classList.contains("ch")) el.classList.add("live"); else if (el.classList.contains("f-stats") && typeof run === "function") run(); else el.classList.add("shown"); }
    }); }, 1500); };
  window.addEventListener("scroll", kick, { passive: true }); kick();

  if (REDUCE || !FINE) return;

  // 5) magnetic primary buttons
  document.addEventListener("pointermove", function (e) {
    var b = e.target.closest && e.target.closest(".btn-main"); if (!b) return;
    var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    b.style.setProperty("--mx", (x * 0.18).toFixed(1) + "px"); b.style.setProperty("--my", (y * 0.3).toFixed(1) + "px");
    b.style.setProperty("--sx", ((e.clientX - r.left) / r.width * 100).toFixed(0) + "%"); b.classList.add("mag");
  });
  document.addEventListener("pointerout", function (e) {
    var b = e.target.closest && e.target.closest(".btn-main"); if (!b || b.contains(e.relatedTarget)) return;
    b.classList.remove("mag"); b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px");
  });

  // 6) spotlight + tilt on content cards (batches, resources, panels, channel cards, outcomes)
  var SEL = ".batch, .res, .panel, .ch, .quiz-teaser, .note";
  document.addEventListener("pointermove", function (e) {
    var c = e.target.closest && e.target.closest(SEL); if (!c) return;
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); c.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    var amt = c.classList.contains("panel") || c.classList.contains("note") ? 3 : 7;
    c.style.setProperty("--trx", ((0.5 - y) * amt).toFixed(2) + "deg"); c.style.setProperty("--try", ((x - 0.5) * amt).toFixed(2) + "deg");
    c.classList.add("glow");
  });
  document.addEventListener("pointerout", function (e) {
    var c = e.target.closest && e.target.closest(SEL); if (!c || c.contains(e.relatedTarget)) return;
    c.classList.remove("glow"); c.style.setProperty("--trx", "0deg"); c.style.setProperty("--try", "0deg");
  });
})();
