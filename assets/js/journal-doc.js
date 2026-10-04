/* IJAOTT For authors + Policies: reveal on scroll, active section in the menu, reading progress, submission checklist */
(function () {
  var root = document.documentElement;
  root.classList.add("jd-js");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rv = [].slice.call(document.querySelectorAll(".jd-rv"));
  if (!("IntersectionObserver" in window) || reduce) {
    rv.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    rv.forEach(function (el) { io.observe(el); });
  }

  var links = [].slice.call(document.querySelectorAll(".jd-toc ol a"));
  var secs = links.map(function (a) { return document.getElementById((a.getAttribute("href") || "").split("#")[1]); });
  var bar = document.querySelector(".jd-prog i");
  var main = document.querySelector(".jd-main");
  var current = -1;
  function setActive(i) {
    if (i === current) return;
    current = i;
    links.forEach(function (a, k) { if (k === i) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    var a = links[i], ol = a && a.parentNode && a.closest("ol");
    if (a && ol && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - 8, behavior: reduce ? "auto" : "smooth" });
  }
  function onScroll() {
    var y = window.innerHeight * 0.35, idx = 0;
    secs.forEach(function (s, k) { if (s && s.getBoundingClientRect().top <= y) idx = k; });
    setActive(idx);
    if (bar && main) {
      var r = main.getBoundingClientRect(), total = r.height - window.innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.2) / (total > 0 ? total : 1)));
      bar.style.width = (p * 100).toFixed(1) + "%";
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  var list = document.querySelector(".jd-checklist");
  if (list) {
    var boxes = [].slice.call(list.querySelectorAll("input[type=checkbox]"));
    var fill = document.querySelector(".jd-checkbar i"), count = document.querySelector(".jd-checkcount"), ready = document.querySelector(".jd-ready"), msg = ready && ready.querySelector("p");
    var upd = function () {
      var n = boxes.filter(function (b) { return b.checked; }).length, all = n === boxes.length;
      if (fill) fill.style.width = (n / boxes.length * 100) + "%";
      if (count) count.textContent = n + " / " + boxes.length + " ready";
      if (ready) ready.classList.toggle("done", all);
      if (msg) msg.textContent = all ? "🎉 All set! Your manuscript is ready to submit." : "Tick each item as you check your manuscript.";
    };
    boxes.forEach(function (b) { b.addEventListener("change", upd); });
    upd();
  }
})();
