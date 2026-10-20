/* AlliedPath program animations: a living icon for each program (heart beats, lungs breathe, tubes bubble...),
   cards that power on, tilt and follow a spotlight, a module counter, and a syllabus rail that fills as you scroll. */
(function () {
  "use strict";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var P = 'pathLength="1"';
  // each icon: base drawing (draws itself in) + a "live" layer that keeps moving
  var ICONS = {
    cardiac: '<path class="d beat" ' + P + ' d="M32 52C12 39 8 28 13 19c5-8 15-7 19 1 4-8 14-9 19-1 5 9 1 20-19 33Z"/><path class="d dim" ' + P + ' d="M6 33h14l4-8 5 16 5-20 4 12h20"/><path class="trace" ' + P + ' d="M6 33h14l4-8 5 16 5-20 4 12h20"/>',
    respiratory: '<g class="breathe"><path class="d" ' + P + ' d="M26 22c-8 0-16 10-16 22 0 8 6 12 12 10 4-1 6-6 6-12V26c0-2-1-4-2-4Z"/><path class="d" ' + P + ' d="M38 22c8 0 16 10 16 22 0 8-6 12-12 10-4-1-6-6-6-12V26c0-2 1-4 2-4Z"/></g><path class="d" ' + P + ' d="M32 8v22m0 0c-4 2-6 4-8 8m8-8c4 2 6 4 8 8"/>',
    critical: '<rect class="d" ' + P + ' x="7" y="11" width="50" height="35" rx="5"/><path class="d" ' + P + ' d="M26 52h12M32 46v6"/><path class="d dim" ' + P + ' d="M11 38h6l2-16h10l2 16h6l2-16h10l2 16h2"/><path class="trace" ' + P + ' d="M11 38h6l2-16h10l2 16h6l2-16h10l2 16h2"/>',
    dialysis: '<path class="d" ' + P + ' d="M32 7C24 19 17 27 17 36a15 15 0 0 0 30 0C47 27 40 19 32 7Z"/><g class="spin"><path class="d" ' + P + ' d="M25 37a7 7 0 0 1 11-6m3 6a7 7 0 0 1-11 6"/><path class="d" ' + P + ' d="M36 27v4h-4M28 47v-4h4"/></g>',
    lab: '<path class="d" ' + P + ' d="M23 8h18M27 8v34a5 5 0 0 0 10 0V8"/><path class="d" ' + P + ' d="M27 28h10"/><circle class="bub" cx="31" cy="38" r="1.8"/><circle class="bub b2" cx="34" cy="40" r="1.3"/><circle class="bub b3" cx="30" cy="41" r="1.1"/><path class="d" ' + P + ' d="M44 50h12M50 44v12"/>',
    radiology: '<rect class="d" ' + P + ' x="10" y="8" width="44" height="48" rx="6"/><path class="d" ' + P + ' d="M32 15v35M32 21c-7 0-12 2-14 5m14-5c7 0 12 2 14 5M32 29c-7 0-12 2-14 5m14-5c7 0 12 2 14 5M32 37c-6 0-10 2-12 4m12-4c6 0 10 2 12 4"/><rect class="scan" x="12" y="12" width="40" height="3" rx="1.5"/>',
    emergency: '<circle class="ring" cx="32" cy="32" r="22"/><circle class="ring r2" cx="32" cy="32" r="22"/><path class="d" ' + P + ' d="M26 14h12v12h12v12H38v12H26V38H14V26h12Z"/>',
    aott: '<path class="d" ' + P + ' d="M19 31c0-8 6-13 13-13s13 5 13 13l-4 14H23Z"/><path class="d" ' + P + ' d="M26 31h12M28 38h8"/><path class="d dim" ' + P + ' d="M32 18V8h20v12"/><path class="flow" d="M32 18V8h20v12"/><ellipse class="d bag" ' + P + ' cx="52" cy="28" rx="5" ry="8"/>',
    other: '<path class="d" ' + P + ' d="M4 24 32 12l28 12-28 12Z"/><path class="d" ' + P + ' d="M14 29v11c0 4 8 8 18 8s18-4 18-8V29"/>'
  };
  var kind = function (t) {
    t = String(t || "").toLowerCase();
    return /cardiac|heart/.test(t) ? "cardiac" : /respir|pulmon/.test(t) ? "respiratory" : /critical|icu/.test(t) ? "critical" : /dialys|renal/.test(t) ? "dialysis" :
      /lab|patholog/.test(t) ? "lab" : /radiolog|imaging|x-ray/.test(t) ? "radiology" : /emergenc|trauma/.test(t) ? "emergency" : /anaesth|anesth|operation theatre|aott/.test(t) ? "aott" : "other";
  };
  var svg = function (k, cls) { return '<span class="pfx ' + (cls || "") + ' k-' + k + '" aria-hidden="true"><svg viewBox="0 0 64 64">' + ICONS[k] + "</svg></span>"; };

  // power on when scrolled into view
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting) return; var el = e.target; setTimeout(function () { el.classList.add("pon"); countUp(el); }, (Number(el.getAttribute("data-k")) || 0) * 110); io.unobserve(el); });
  }, { threshold: 0.25 }) : null;
  var arm = function (el, k) { el.setAttribute("data-k", k); if (io && !REDUCE) io.observe(el); else { el.classList.add("pon"); } };
  function countUp(el) {
    var em = el.querySelector("em"); if (!em || REDUCE) return;
    var m = em.textContent.match(/^(\d+)/); if (!m) return;
    var n = +m[1], rest = em.textContent.slice(m[1].length), t0 = null;
    (function step(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 900); em.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + rest; if (p < 1) requestAnimationFrame(step); })(performance.now());
  }

  function enhance() {
    // home: planned cards + featured card
    [].forEach.call(document.querySelectorAll(".pl-card:not(.fx)"), function (c, i) {
      c.classList.add("fx"); var b = c.querySelector("b");
      c.insertAdjacentHTML("afterbegin", svg(kind(b && b.textContent), "sm") + '<i class="spot" aria-hidden="true"></i><i class="sweep" aria-hidden="true"></i>');
      arm(c, i);
    });
    [].forEach.call(document.querySelectorAll(".prog-feature:not(.fx)"), function (c) {
      c.classList.add("fx"); var h = c.querySelector("h3"), r = c.querySelector(".pf-r");
      if (r) r.insertAdjacentHTML("afterbegin", svg(kind(h && h.textContent), "lg"));
      c.insertAdjacentHTML("beforeend", '<i class="spot" aria-hidden="true"></i><i class="sweep" aria-hidden="true"></i>');
      arm(c, 0);
    });
    // program page: hero icon, syllabus rail, outcome ticks
    var facts = document.querySelector(".p-facts:not(.fx)");
    if (facts) {
      facts.classList.add("fx"); var h1 = document.querySelector(".p-hero h1");
      var col = document.createElement("div"); col.className = "pfx-col"; facts.parentNode.insertBefore(col, facts); col.appendChild(facts);
      facts.insertAdjacentHTML("beforebegin", '<div class="pfx-hero">' + svg(kind(h1 && h1.textContent), "xl") + '<i class="orbit" aria-hidden="true"></i><i class="orbit o2" aria-hidden="true"></i></div>');
      setTimeout(function () { var x = document.querySelector(".pfx-hero"); if (x) x.classList.add("pon"); }, 250);
    }
    var mods = document.querySelector("ol.mods:not(.fx)");
    if (mods) { mods.classList.add("fx"); mods.insertAdjacentHTML("afterbegin", '<i class="rail" aria-hidden="true"><i></i></i>'); rail(); }
    [].forEach.call(document.querySelectorAll(".outs li:not(.fx)"), function (li, i) { li.classList.add("fx"); arm(li, i); });
  }
  function rail() {
    var ol = document.querySelector("ol.mods.fx"); if (!ol) return;
    var fill = ol.querySelector(".rail i"), lis = [].slice.call(ol.querySelectorAll(":scope > li"));
    var mid = innerHeight * 0.6, r = ol.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    if (fill) fill.style.transform = "scaleY(" + p + ")";
    lis.forEach(function (li) { var b = li.getBoundingClientRect(); li.classList.toggle("lit", b.top + 24 < mid); });
  }
  window.addEventListener("scroll", rail, { passive: true }); window.addEventListener("resize", rail);

  // spotlight + 3D tilt on cards
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || REDUCE) return;
    var c = e.target.closest && e.target.closest(".pl-card.fx, .prog-feature.fx"); if (!c) return;
    var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty("--x", x * 100 + "%"); c.style.setProperty("--y", y * 100 + "%");
    var amt = c.classList.contains("prog-feature") ? 4 : 9;
    c.style.setProperty("--ry", (x - 0.5) * amt + "deg"); c.style.setProperty("--rx", (0.5 - y) * amt + "deg");
    c.classList.add("hov");
  });
  document.addEventListener("pointerout", function (e) {
    var c = e.target.closest && e.target.closest(".pl-card.fx, .prog-feature.fx"); if (!c || c.contains(e.relatedTarget)) return;
    c.classList.remove("hov"); c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
  });

  // content is drawn after the JSON loads, so watch for it
  enhance();
  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function () { enhance(); });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 15000);
  }
})();
