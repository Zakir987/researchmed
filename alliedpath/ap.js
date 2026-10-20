/* AlliedPath \u2014 shared script for every AlliedPath page.
   Content comes from content/alliedpath.json and content/ap-*.json, edited in Admin (admin.html?site=ap). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var slug = function (s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "item"; };
  var safeUrl = function (u) { u = String(u || "").trim(); return /^(javascript|data|vbscript):/i.test(u) ? "" : u; };
  var media = function (p) { p = String(p || "").trim(); if (!p) return ""; if (/^(https?:)?\/\//.test(p)) return p; return "../" + p.replace(/^\/+/, ""); };
  var PAGE = document.body.getAttribute("data-ap") || "home";
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cache = {};
  var load = function (n) { return cache[n] || (cache[n] = fetch("../content/" + n + ".json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })); };
  var list = function (j) { return (Array.isArray(j) ? j : (j && j.items) || []).filter(function (x) { return x && x.title && x.draft !== true; }); };
  var istToday = function () { return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); };
  var md = function (t) { // paragraphs, "- " bullet lists, **bold**
    var html = "", ul = false;
    String(t || "").replace(/\r/g, "").split("\n").forEach(function (ln) {
      var x = esc(ln.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (/^[-\u2022]\s+/.test(ln.trim())) { if (!ul) { html += "<ul>"; ul = true; } html += "<li>" + x.replace(/^[-\u2022]\s+/, "") + "</li>"; }
      else { if (ul) { html += "</ul>"; ul = false; } if (x) html += "<p>" + x + "</p>"; }
    });
    return html + (ul ? "</ul>" : "");
  };
  var lines = function (t) { return String(t || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean); };
  var inr = function (n) { n = Number(n); return n ? "\u20b9" + n.toLocaleString("en-IN") : ""; };
  var usd = function (n) { n = Number(n); return n ? "US$" + n.toLocaleString("en-US") : ""; };
  var feeText = function (p, b) {
    var a = inr((b && b.fee_inr) || (p && p.fee_inr)), u = usd((b && b.fee_usd) || (p && p.fee_usd));
    return a || u ? [a, u ? "(about " + u + " for students outside India)" : ""].filter(Boolean).join(" ") : "";
  };

  // ---------- time: batch times are entered in India time; show them in the visitor's time too ----------
  var VTZ = ""; try { VTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var inIndia = /Kolkata|Calcutta/.test(VTZ);
  function parseTime(t) {
    var m = String(t || "").match(/(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?m?/i); if (!m) return null;
    var h = +m[1], mi = +(m[2] || 0); if (m[3]) { var pm = /p/i.test(m[3]); if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    return h < 24 && mi < 60 ? [h, mi] : null;
  }
  function stamp(date, time) { var t = parseTime(time); if (!date || !t) return null; var p = function (n) { return String(n).padStart(2, "0"); }; var ms = Date.parse(date + "T" + p(t[0]) + ":" + p(t[1]) + ":00+05:30"); return isNaN(ms) ? null : ms; }
  function fmtDate(d, opts) { var x = new Date(d + "T12:00:00+05:30"); return isNaN(x) ? esc(d) : x.toLocaleDateString("en-IN", Object.assign({ day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }, opts || {})); }
  function timeLine(b) {
    var ms = stamp(b.start, b.time); if (!b.time) return "";
    var ist = ms ? new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : esc(b.time);
    var out = ist + " India time (IST)";
    if (ms && VTZ && !inIndia) {
      try {
        var loc = new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: VTZ });
        var dayDiff = new Date(ms).toLocaleDateString("en-CA", { timeZone: VTZ }) !== b.start ? " (" + new Date(ms).toLocaleDateString(undefined, { weekday: "short", timeZone: VTZ }) + ")" : "";
        out += ' <span class="tz">= ' + esc(loc) + dayDiff + " your time \u00b7 " + esc(VTZ.split("/").pop().replace(/_/g, " ")) + "</span>";
      } catch (e) {}
    }
    return out;
  }

  // ---------- header: menu, scrolled state, progress line, sliding indicator ----------
  (function header() {
    var top = $("#top"); if (!top) return;
    var mb = $(".menu-btn"), nav = $("#nav"), ind = $(".ind", nav), prog = $(".prog");
    var setMenu = function (o) { nav.classList.toggle("open", o); mb.setAttribute("aria-expanded", o); mb.setAttribute("aria-label", o ? "Close menu" : "Open menu"); };
    mb.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !e.target.closest(".bar")) setMenu(false); });
    var links = $$("a:not(.m-cta):not(.ext)", nav);
    var hashLinks = links.filter(function (a) { return /^#/.test(a.getAttribute("href")); });
    var moveInd = function (a) {
      if (!ind) return;
      if (!a || getComputedStyle(ind).display === "none") { ind.style.opacity = 0; return; }
      ind.style.width = a.offsetWidth + "px"; ind.style.transform = "translateX(" + a.offsetLeft + "px)"; ind.style.opacity = 1;
    };
    var current = links.filter(function (a) { return a.classList.contains("on"); })[0] || null;
    links.forEach(function (a) { a.addEventListener("mouseenter", function () { moveInd(a); }); });
    nav.addEventListener("mouseleave", function () { moveInd(current); });
    var onScroll = function () {
      var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
      top.classList.toggle("scrolled", y > 40 || !document.querySelector(".hero"));
      if (prog) prog.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
      if (!hashLinks.length) return;
      var mark = y + innerHeight * 0.35, cur = null;
      hashLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t && t.offsetTop <= mark) cur = a; });
      if (cur !== current) { hashLinks.forEach(function (a) { a.classList.toggle("on", a === cur); }); current = cur; moveInd(cur); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { moveInd(current); });
    onScroll(); setTimeout(function () { moveInd(current); }, 300);
  })();

  // ---------- reveal on scroll ----------
  var io = null;
  function reveal(root) {
    var els = $$(".rv, .journey", root || document).filter(function (el) { return !el.classList.contains("in"); });
    $$(".grid", root || document).forEach(function (g) { $$(":scope > .rv", g).forEach(function (el, i) { el.style.setProperty("--d", (i % 6) * 0.07 + "s"); }); });
    if (REDUCE || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    io = io || new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }
  if (REDUCE) $$(".traveller").forEach(function (c) { c.remove(); });

  // ---------- shared enquiry form (register / demo / seat / doubt) ----------
  var WANTS = { interest: "Register interest", demo: "Book a free demo class", seat: "Reserve a seat in a batch", doubt: "Ask a doubt" };
  function formHTML(programs, batches) {
    var progOpts = programs.map(function (p) { return "<option>" + esc(p.title) + "</option>"; }).join("") + "<option>Other allied health program</option>";
    var batchOpts = batches.map(function (b) { return '<option value="' + esc(b.title) + '">' + esc(b.title) + (b.start ? " \u00b7 starts " + fmtDate(b.start, { year: undefined }) : "") + "</option>"; }).join("");
    return '<form class="form rv rv-r" id="ap-form" novalidate>' +
      '<fieldset class="want"><legend>What would you like?</legend><div class="seg">' +
      Object.keys(WANTS).map(function (k, i) { return '<label><input type="radio" name="want" value="' + k + '"' + (i ? "" : " checked") + "> " + WANTS[k] + "</label>"; }).join("") + "</div></fieldset>" +
      '<div class="seg" role="radiogroup" aria-label="I am">' +
      '<label><input type="radio" name="role" value="Student" checked> Student</label><label><input type="radio" name="role" value="Working professional"> Working professional</label><label><input type="radio" name="role" value="Faculty"> Faculty / want to teach</label></div>' +
      '<div class="row"><label>Full name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label></div>' +
      '<div class="row"><label>WhatsApp (with country code)<input name="phone" type="tel" autocomplete="tel" placeholder="+91 \u2026"></label><label>Country<input name="country" autocomplete="country-name" placeholder="e.g. India, UAE, Nepal"></label></div>' +
      '<div class="row"><label>Program / stream<select name="program">' + progOpts + '</select></label><label>Year / experience<input name="level" placeholder="e.g. B.Sc. 2nd year / 5 years in OT"></label></div>' +
      '<label class="if-seat" hidden>Batch<select name="batch">' + (batchOpts || "<option value=\"Next available batch\">Next available batch</option>") + "</select></label>" +
      '<label class="if-demo" hidden>Preferred day and time for the demo (your time)<input name="slot" placeholder="e.g. Saturday evening"></label>' +
      '<label><span class="msg-l">Anything else? (optional)</span><textarea name="message" rows="3"></textarea></label>' +
      '<input type="text" name="_honey" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">' +
      '<label class="check"><input type="checkbox" name="consent" required><span>I agree that AlliedPath / ResearchMed Connect may contact me by email or WhatsApp about AlliedPath. See the <a href="policies.html#privacy">privacy note</a>.</span></label>' +
      '<button class="btn btn-main" type="submit">Send</button><div class="status" id="ap-status" role="status" hidden></div></form>';
  }
  function wireForm(settings) {
    var f = $("#ap-form"); if (!f) return;
    var st = $("#ap-status"), btn = $("button[type=submit]", f);
    var sync = function () {
      var w = (f.querySelector("input[name=want]:checked") || {}).value || "interest";
      $(".if-seat", f).hidden = w !== "seat"; $(".if-demo", f).hidden = w !== "demo";
      var msg = $("textarea[name=message]", f); msg.required = w === "doubt";
      $(".msg-l", f).textContent = w === "doubt" ? "Your question *" : "Anything else? (optional)";
      btn.textContent = { interest: "Register my interest", demo: "Book my free demo", seat: "Reserve my seat", doubt: "Send my question" }[w];
    };
    f.addEventListener("change", sync); sync();
    window.apChoose = function (want, extra) {
      var r = f.querySelector('input[name=want][value="' + want + '"]'); if (r) r.checked = true;
      extra = extra || {};
      if (extra.batch) { var bs = $("select[name=batch]", f); if (bs) bs.value = extra.batch; }
      if (extra.program) { var ps = $("select[name=program]", f); if (ps) [].slice.call(ps.options).forEach(function (o) { if (o.text === extra.program) ps.value = o.text; }); }
      if (extra.role) { var rr = f.querySelector('input[name=role][value="' + extra.role + '"]'); if (rr) rr.checked = true; }
      sync();
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-want],[data-role]"); if (!a) return;
      window.apChoose(a.getAttribute("data-want") || "interest", { batch: a.getAttribute("data-batch"), program: a.getAttribute("data-program"), role: a.getAttribute("data-role") });
    });
    var qs = new URLSearchParams(location.search);
    if (qs.get("want") || qs.get("role")) window.apChoose(qs.get("want") || "interest", { batch: qs.get("batch"), program: qs.get("program"), role: qs.get("role") });
    // shared join links (e.g. /alliedpath/join/) land straight on the form
    if ((qs.get("want") || qs.get("role") || location.hash === "#join") && $("#join")) setTimeout(function () { $("#join").scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" }); var n = f.querySelector("input[name=name]"); if (n) n.focus({ preventScroll: true }); }, 400);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var fd = new FormData(f); if (fd.get("_honey")) return;
      var d = {}; fd.forEach(function (v, k) { d[k] = v; });
      var w = d.want || "interest", first = String(d.name || "").trim().split(/\s+/)[0] || "there";
      var ref = "AP-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      var payload = {
        "Reference": ref, "Request": WANTS[w], "I am": d.role, "Name": d.name, "WhatsApp": d.phone || "-", "Country": d.country || "-",
        "Program": d.program, "Year / experience": d.level || "-",
        "Batch": w === "seat" ? d.batch : "-", "Preferred demo time": w === "demo" ? (d.slot || "-") + (VTZ ? " (" + VTZ + ")" : "") : "-",
        "Message / question": d.message || "-", "Consent to contact": "Yes", "Sent from": location.href,
        email: d.email,
        _subject: "AlliedPath " + WANTS[w].toLowerCase() + " " + ref + ": " + d.name + " \u00b7 " + d.program,
        _template: "table", _captcha: "false",
        _autoresponse: "Dear " + first + ",\n\nThank you for contacting AlliedPath (reference " + ref + ").\n\nWe received your request: " + WANTS[w] + (w === "seat" ? " (" + d.batch + ")" : "") + ".\nWe will contact you personally" + (w === "demo" ? " to fix a time for your free demo class." : w === "doubt" ? " with an answer to your question." : " with the details and next steps.") + "\n\nPlease note: AlliedPath provides teaching and mentoring only and does not issue certificates.\n\nWarm regards,\nAlliedPath by ResearchMed Connect\nhttps://researchmed.in/alliedpath/"
      };
      btn.disabled = true; var label = btn.textContent; btn.textContent = "Sending\u2026"; st.hidden = true;
      fetch("https://formsubmit.co/ajax/" + ((settings && settings.email) || "info@researchmed.in"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) !== "true") throw new Error("send failed"); }); })
        .then(function () {
          document.dispatchEvent(new CustomEvent("rmc:lead", { detail: { kind: "AlliedPath: " + WANTS[w], info: d.role + " \u00b7 " + d.program + (w === "seat" ? " \u00b7 " + d.batch : "") + (d.country ? " \u00b7 " + d.country : ""), name: first } }));
          $$("input,select,textarea,button", f).forEach(function (el) { el.disabled = true; });
          st.className = "status ok";
          st.innerHTML = "<strong>Thank you, " + esc(first) + "!</strong> " + ({ interest: "You're on the list", demo: "Your free demo request has reached us", seat: "Your seat request has reached us", doubt: "Your question has reached us" }[w]) + " (reference " + ref + "). We'll contact you personally soon, and a confirmation email is on its way.";
          st.hidden = false; btn.textContent = "Sent \u2713";
        })
        .catch(function () {
          var wa = String((settings && settings.whatsapp) || "").replace(/\D/g, "");
          st.className = "status err";
          st.innerHTML = "<strong>Sorry, that didn't go through.</strong> Please message us" + (wa ? ' on <a href="https://wa.me/' + wa + '?text=' + encodeURIComponent("Hello, I'm interested in AlliedPath") + '">WhatsApp</a> or' : "") + ' at <a href="mailto:' + esc((settings && settings.email) || "info@researchmed.in") + '?subject=AlliedPath">' + esc((settings && settings.email) || "info@researchmed.in") + "</a>.";
          st.hidden = false; btn.disabled = false; btn.textContent = label;
        });
    });
  }

  // ---------- renderers ----------
  var statusClass = function (s) { return /full|closed/i.test(s || "") ? "full" : /fast|few/i.test(s || "") ? "fast" : "open"; };
  function upcoming(batches) { var t = istToday(); return batches.filter(function (b) { return !b.start || b.start >= t || /ongoing/i.test(b.status || ""); }).sort(function (a, b) { return String(a.start || "9").localeCompare(String(b.start || "9")); }); }
  function batchCard(b, programs) {
    var p = programs.filter(function (x) { return x.title === b.program; })[0];
    var seats = Number(b.seats) || 0, left = b.seats_left === "" || b.seats_left == null ? null : Number(b.seats_left);
    var pct = seats && left != null ? Math.max(0, Math.min(100, Math.round(((seats - left) / seats) * 100))) : null;
    var fee = feeText(p, b), full = statusClass(b.status) === "full";
    return '<article class="batch rv">' +
      '<div class="b-top"><span class="b-st ' + statusClass(b.status) + '">' + esc(b.status || "Enrolling") + "</span>" + (b.mode ? '<span class="b-mode">' + esc(b.mode) + "</span>" : "") + "</div>" +
      "<h3>" + esc(b.title) + "</h3>" +
      (b.program ? '<p class="b-prog">' + (p ? '<a href="program.html?p=' + esc(p.slug || slug(p.title)) + '">' + esc(b.program) + "</a>" : esc(b.program)) + "</p>" : "") +
      '<ul class="b-facts">' +
      (b.start ? "<li><b>Starts</b><span>" + fmtDate(b.start, { weekday: "short" }) + "</span></li>" : "<li><b>Starts</b><span>Date to be announced</span></li>") +
      (b.days ? "<li><b>Days</b><span>" + esc(b.days) + "</span></li>" : "") +
      (b.time ? "<li><b>Time</b><span>" + timeLine(b) + "</span></li>" : "") +
      (b.duration ? "<li><b>Duration</b><span>" + esc(b.duration) + "</span></li>" : "") +
      (b.faculty ? "<li><b>Faculty</b><span>" + esc(b.faculty) + "</span></li>" : "") +
      "<li><b>Fee</b><span>" + (fee || "Shared with you when you reserve") + "</span></li></ul>" +
      (pct != null ? '<div class="seats"><div class="bar-s"><i style="--w:' + pct + '%"></i></div><span>' + (left > 0 ? left + " of " + seats + " seats left" : "Batch full") + "</span></div>" : "") +
      '<div class="b-cta">' + (full ? '<a class="btn btn-ghost" href="#join" data-want="interest" data-program="' + esc(b.program || "") + '">Join the waitlist</a>'
        : '<a class="btn btn-main" href="' + (b.link ? esc(safeUrl(b.link)) + '" target="_blank" rel="noopener' : "#join") + '" data-want="seat" data-batch="' + esc(b.title) + '" data-program="' + esc(b.program || "") + '">Reserve my seat <span class="arr" aria-hidden="true">\u2192</span></a>') +
      '<a class="btn btn-ghost" href="#join" data-want="demo" data-program="' + esc(b.program || "") + '">Free demo first</a></div></article>';
  }
  function facultyCard(x, i) {
    var init = String(x.title).replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
    var subs = String(x.subjects || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    var li = function (t) { return "<li>" + esc(t) + "</li>"; };
    return '<article class="badge rv" style="--k:' + i + '" data-fi="' + i + '" tabindex="0" role="button" aria-haspopup="dialog" aria-label="Open the profile of ' + esc(x.title) + '"><div class="sw">' +
      '<span class="strap" aria-hidden="true"></span><span class="clip" aria-hidden="true"></span>' +
      '<div class="bd">' +
        '<div class="face fr">' +
          '<div class="bh"><span class="bl">AlliedPath</span><span>Faculty</span></div>' +
          '<div class="pic">' + (x.photo ? '<img src="' + esc(media(x.photo)) + '" alt="" loading="lazy">' : '<span class="ini" aria-hidden="true">' + esc(init) + "</span>") + "</div>" +
          "<h3>" + esc(x.title) + "</h3>" + (x.designation ? '<p class="b-d">' + esc(x.designation) + "</p>" : "") + (x.qualification || x.institution ? '<p class="b-q">' + esc([x.qualification, x.institution].filter(Boolean).join(" · ")) + "</p>" : "") +
          (subs.length ? '<ul class="b-t">' + subs.slice(0, 3).map(li).join("") + "</ul>" : "") +
          '<div class="bf"><span class="bc" aria-hidden="true"></span><span class="bid">AP-F' + ("00" + (i + 1)).slice(-3) + '</span><span class="flip">View profile <span aria-hidden="true">↗</span></span></div>' +
          '<i class="holo" aria-hidden="true"></i>' +
        "</div>" +
      "</div></div></article>";
  }
  // faculty profile popup (opens when a faculty ID card is tapped)
  function spotCard(x, i) {
    var hl = String(x.highlights || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    var subs = String(x.subjects || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    var short = String(x.title).replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "");
    var pre = (String(x.title).match(/^(dr|mr|mrs|ms|prof)\.?\s+/i) || [""])[0];
    var ic = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
    return '<article class="fspot rv" style="--k:' + i + '">' +
      '<div class="sp-media"><i class="sp-ring" aria-hidden="true"></i><div class="sp-arch">' +
        (x.photo ? '<img src="' + esc(media(x.photo)) + '" alt="' + esc(x.title) + '" loading="lazy">' : "") +
        '<i class="sp-shine" aria-hidden="true"></i></div>' +
        '<span class="sp-seal" aria-hidden="true"><b>✓</b>Faculty</span>' +
        '<span class="sp-tag" aria-hidden="true"><i></i>AlliedPath faculty</span></div>' +
      '<div class="sp-body">' +
        '<span class="sp-k"><i aria-hidden="true"></i>Faculty profile</span>' +
        '<h3 class="sp-name">' + (pre ? '<span class="sp-pre">' + esc(pre.trim()) + "</span> " : "") + esc(short) + "</h3>" +
        (x.designation ? '<p class="sp-role">' + esc(x.designation) + "</p>" : "") +
        (x.qualification ? '<p class="sp-q">' + esc(x.qualification) + "</p>" : "") +
        (x.institution ? '<p class="sp-inst"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10l9-6 9 6M5 10v9h14v-9M9 19v-5h6v5"/></svg>' + esc(x.institution) + "</p>" : "") +
        (hl.length ? '<ul class="sp-hl">' + hl.map(function (t, n) { return '<li style="--n:' + n + '">' + ic + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" : "") +
        (subs.length ? '<div class="sp-subs"><span>Teaches</span>' + subs.map(function (t) { return "<em>" + esc(t) + "</em>"; }).join("") + "</div>" : "") +
        '<div class="sp-cta"><a class="btn btn-main" href="#join" data-want="demo">Book a free demo class <span class="arr" aria-hidden="true">→</span></a>' +
        (x.linkedin ? '<a class="btn btn-ghost" href="' + esc(safeUrl(x.linkedin)) + '" target="_blank" rel="noopener">LinkedIn ↗</a>' : "") + "</div>" +
      "</div></article>";
  }
  function profilePopup(FE, faculty) {
    if (FE.getAttribute("data-pop")) return; FE.setAttribute("data-pop", "1");
    var dlg = document.createElement("dialog"); dlg.className = "fp-dlg"; dlg.setAttribute("aria-label", "Faculty profile");
    document.body.appendChild(dlg);
    var last = null, closing = false;
    function close() {
      if (!dlg.open || closing) return; closing = true;
      dlg.classList.add("out"); document.documentElement.classList.remove("fp-open");
      setTimeout(function () { dlg.classList.remove("out", "on"); dlg.close(); closing = false; if (last) last.focus({ preventScroll: true }); }, REDUCE ? 0 : 260);
    }
    function open(card) {
      var x = faculty[Number(card.getAttribute("data-fi"))]; if (!x) return;
      last = card;
      var r = card.getBoundingClientRect();
      dlg.style.setProperty("--ox", (r.left + r.width / 2) + "px"); dlg.style.setProperty("--oy", (r.top + r.height / 3) + "px");
      dlg.innerHTML = '<button type="button" class="fp-x" aria-label="Close">×</button>' + spotCard(x, 0).replace('class="fspot rv"', 'class="fspot"');
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      document.documentElement.classList.add("fp-open");
      dlg.scrollTop = 0;
      requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add("on"); var c = dlg.querySelector(".fspot"); if (c) c.classList.add("in"); }); });
      var x0 = dlg.querySelector(".fp-x"); if (x0) x0.focus({ preventScroll: true });
    }
    FE.addEventListener("click", function (e) {
      var card = e.target.closest(".badge[data-fi]"); if (!card) return;
      e.preventDefault(); open(card);
    });
    FE.addEventListener("keydown", function (e) {
      var card = e.target.closest && e.target.closest(".badge[data-fi]");
      if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(card); }
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest(".fp-x")) { close(); return; }
      var a = e.target.closest("a[href^='#']"); if (a) { close(); }
    });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
  }
  function joinBadge(n) {
    return '<a class="badge badge-join rv" style="--k:' + n + '" href="faculty.html"><div class="sw">' +
      '<span class="strap" aria-hidden="true"></span><span class="clip" aria-hidden="true"></span>' +
      '<div class="bd"><div class="face fr">' +
        '<div class="bh"><span class="bl">AlliedPath</span><span>Faculty</span></div>' +
        '<div class="pic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></div>' +
        '<h3>Your name here</h3><p class="b-d">This could be you</p>' +
        '<p class="b-q">Allied health educator or experienced clinician? We are building our faculty team now.</p>' +
        '<div class="bf"><span class="bc" aria-hidden="true"></span><span class="bid">AP-F???</span><span class="flip">Apply to teach \u2192</span></div>' +
      "</div></div></div></a>";
  }
  var ytId = function (u) { var m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ""; };
  function resourceCard(x) {
    var yt = ytId(x.youtube || x.link), href = x.file ? media(x.file) : safeUrl(x.link || x.youtube || "");
    var icon = { "Notes (PDF)": "\ud83d\udcc4", "Video": "\u25b6", "Article": "\ud83d\udcf0", "Quiz": "\u2714", "Other": "\u2605" }[x.type] || "\u2605";
    return '<article class="res rv">' + (yt ? '<div class="res-v"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '" title="' + esc(x.title) + '" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' : '<div class="res-i" aria-hidden="true">' + icon + "</div>") +
      '<div class="res-b"><span class="res-t">' + esc(x.type || "Resource") + (x.program ? " \u00b7 " + esc(x.program) : "") + "</span><h3>" + esc(x.title) + "</h3>" + (x.description ? "<p>" + esc(x.description) + "</p>" : "") +
      (href && !yt ? '<a class="res-a" href="' + esc(href) + '" target="_blank" rel="noopener">' + (x.file ? "Download" : "Open") + " \u2197</a>" : "") + "</div></article>";
  }
  function reviewCard(x) {
    var r = Math.max(0, Math.min(5, Number(x.rating) || 0));
    return '<figure class="rev rv">' + (r ? '<div class="stars" aria-label="' + r + ' out of 5">' + "\u2605\u2605\u2605\u2605\u2605".slice(0, r) + '<span>' + "\u2605\u2605\u2605\u2605\u2605".slice(r) + "</span></div>" : "") +
      "<blockquote>\u201c" + esc(x.quote) + "\u201d</blockquote><figcaption><b>" + esc(x.title) + "</b>" + [x.program, x.country].filter(Boolean).map(esc).map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</figcaption></figure>";
  }
  function faqHTML(faqs) { return faqs.map(function (q) { return "<details class=\"rv\"><summary>" + esc(q.title) + "</summary>" + md(q.answer) + "</details>"; }).join(""); }

  // ---------- quiz ----------
  function quiz(el, qs) {
    if (!el || !qs.length) { if (el) el.closest("section").hidden = true; return; }
    var i = 0, score = 0, answered = false;
    var draw = function () {
      if (i >= qs.length) {
        el.innerHTML = '<div class="qz-end"><b>' + score + " / " + qs.length + "</b><p>" + (score === qs.length ? "Excellent! Full marks." : score >= qs.length * 0.6 ? "Good work. A few more to polish." : "Good start. Our faculty can help you with the rest.") + '</p><div class="btn-row"><button class="btn btn-ghost" type="button" data-q="again">Try again</button><a class="btn btn-main" href="index.html?want=doubt#join">Ask a doubt</a></div></div>';
        return;
      }
      var q = qs[i], opts = lines(q.options);
      answered = false;
      el.innerHTML = '<div class="qz-h"><span>Question ' + (i + 1) + " of " + qs.length + '</span><span class="qz-bar"><i style="width:' + Math.round((i / qs.length) * 100) + '%"></i></span></div>' +
        "<h3>" + esc(q.title) + '</h3><div class="qz-o">' + opts.map(function (o, k) { return '<button type="button" data-k="' + k + '">' + esc(o) + "</button>"; }).join("") + '</div><div class="qz-x" hidden></div>';
    };
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.getAttribute("data-q") === "again") { i = 0; score = 0; draw(); return; }
      if (b.getAttribute("data-q") === "next") { i++; draw(); return; }
      if (answered || !b.hasAttribute("data-k")) return;
      answered = true;
      var q = qs[i], right = Math.max(0, (Number(q.answer) || 1) - 1), k = +b.getAttribute("data-k");
      if (k === right) score++;
      $$(".qz-o button", el).forEach(function (x, n) { x.disabled = true; if (n === right) x.classList.add("ok"); else if (n === k) x.classList.add("no"); });
      var xp = $(".qz-x", el); xp.hidden = false;
      xp.innerHTML = "<p><b>" + (k === right ? "Correct!" : "Not quite.") + "</b> " + esc(q.explanation || "") + '</p><button class="btn btn-main" type="button" data-q="next">' + (i + 1 < qs.length ? "Next question \u2192" : "See my score") + "</button>";
    });
    draw();
  }

  // ---------- page boot ----------
  // programs: the planned list stays folded into one bar; it opens on hover, keyboard focus or a tap
  function foldPrograms() {
    [].forEach.call(document.querySelectorAll(".pl-fold"), function (f) {
      if (f.getAttribute("data-fold")) return; f.setAttribute("data-fold", "1");
      var b = f.querySelector(".pl-head"), h = f.querySelector(".pl-hint");
      var touch = window.matchMedia && !matchMedia("(hover: hover)").matches;
      if (h) h.textContent = touch ? "Tap to see all of them" : "Hover to see all of them";
      var set = function (on) { f.classList.toggle("open", on); b.setAttribute("aria-expanded", on ? "true" : "false"); };
      b.addEventListener("click", function () { set(!f.classList.contains("open")); });
      f.addEventListener("mouseenter", function () { if (!touch) b.setAttribute("aria-expanded", "true"); });
      f.addEventListener("mouseleave", function () { if (!touch && !f.classList.contains("open")) b.setAttribute("aria-expanded", "false"); });
    });
  }
  Promise.all(["alliedpath", "ap-programs", "ap-batches", "ap-faculty", "ap-resources", "ap-quiz", "ap-faqs", "ap-reviews"].map(load)).then(function (r) {
    var S = r[0] || {}, programs = list(r[1]), batches = list(r[2]), faculty = list(r[3]).sort(function (a, b) { return (Number(a.order) || 99) - (Number(b.order) || 99); }),
      resources = list(r[4]), qz = list(r[5]), faqs = list(r[6]), reviews = list(r[7]).filter(function (x) { return x.quote && x.consent !== false; });
    programs.forEach(function (p) { p.slug = p.slug || slug(p.title); });
    var open = programs.filter(function (p) { return !/planned/i.test(p.status || ""); }), planned = programs.filter(function (p) { return /planned/i.test(p.status || ""); });
    var up = upcoming(batches);
    // contact bits everywhere
    var wa = String(S.whatsapp || "").replace(/\D/g, "");
    $$("[data-ap-wa]").forEach(function (a) { if (wa) { a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hello, I'm interested in AlliedPath"); a.textContent = S.whatsapp; } });
    $$("[data-ap-community]").forEach(function (a) { if (S.community_link) { a.href = safeUrl(S.community_link); a.hidden = false; } else a.hidden = true; });

    if (PAGE === "home") {
      // batches
      var BE = $("#ap-batches");
      if (BE) BE.innerHTML = up.length ? up.map(function (b) { return batchCard(b, programs); }).join("")
        : '<div class="empty rv"><strong>The first batches are being planned now</strong><p>Register your interest and you will be the first to hear the dates. Or book a free demo class and meet a faculty member before you decide.</p><div class="btn-row"><a class="btn btn-main" href="#join" data-want="interest">Tell me first</a><a class="btn btn-ghost" href="#join" data-want="demo">Book a free demo</a></div></div>';
      // programs
      var PE = $("#ap-programs");
      if (PE && programs.length) {
        PE.innerHTML = open.map(function (p) {
          return '<a class="prog-feature rv" href="program.html?p=' + esc(p.slug) + '"><div class="pf-l"><span class="tag">' + esc(p.status || "Enrolling") + "</span><h3>" + esc(p.title) + "</h3>" + (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
            (lines(p.modules).length ? "<ul>" + lines(p.modules).slice(0, 4).map(function (m) { return "<li>" + esc(m.split(":")[0]) + "</li>"; }).join("") + (lines(p.modules).length > 4 ? "<li>+ " + (lines(p.modules).length - 4) + " more modules</li>" : "") + "</ul>" : "") +
            '<span class="pf-go">See the full program <span class="arr" aria-hidden="true">\u2192</span></span></div><div class="pf-r"><b>NCAHP</b><span>Teaching follows the National Commission for Allied and Healthcare Professions curriculum for the program.</span>' +
            [p.duration ? "<em>" + esc(p.duration) + "</em>" : "", p.mode ? "<em>" + esc(p.mode) + "</em>" : "", feeText(p) ? "<em>" + esc(feeText(p)) + "</em>" : ""].join("") + "</div></a>";
        }).join("") + (planned.length ? '<div class="planned pl-fold rv"><button type="button" class="pl-head" aria-expanded="false"><span class="pl-n">+' + planned.length + '</span><span class="pl-t"><b>More allied health programs coming</b><small class="pl-hint"></small></span><span class="pl-chips" aria-hidden="true">' + planned.slice(0, 4).map(function (p) { return "<i>" + esc(String(p.title).replace(/ (Technology|Sciences|Therapy Technology)$/, "")) + "</i>"; }).join("") + '</span><span class="pl-arr" aria-hidden="true"></span></button><div class="pl-wrap"><div class="pl-in"><p>Open one to see its full syllabus, or tell us which one you need:</p><div class="pl-grid">' + planned.map(function (p) { return '<a class="pl-card" href="program.html?p=' + esc(p.slug) + '"><span class="tag">Planned</span><b>' + esc(p.title) + "</b>" + (p.summary ? "<span>" + esc(p.summary) + "</span>" : "") + (lines(p.modules).length ? "<em>" + lines(p.modules).length + " modules \u00b7 view syllabus \u2192</em>" : "<em>Register interest \u2192</em>") + "</a>"; }).join("") + "</div></div></div></div>" : "");
        foldPrograms();
      }
      // faculty
      var FE = $("#ap-faculty");
      if (FE) FE.innerHTML = faculty.map(facultyCard).join("") + joinBadge(faculty.length);
      if (FE) profilePopup(FE, faculty);
      // resources teaser
      var RE = $("#ap-res");
      if (RE) RE.innerHTML = resources.slice(0, 3).map(resourceCard).join("") || "";
      var QZ = $("#ap-quiz-teaser"); if (QZ) QZ.hidden = !qz.length;
      // reviews
      var RV = $("#ap-reviews"); if (RV) { if (reviews.length) RV.querySelector(".revs").innerHTML = reviews.map(reviewCard).join(""); else RV.hidden = true; }
      // faqs + notes
      var FQ = $("#ap-faq-list"); if (FQ && faqs.length) FQ.innerHTML = faqHTML(faqs);
      var IN = $("#ap-intl"); if (IN && S.intl_note) IN.innerHTML = md(S.intl_note);
      var FS = $("#form-slot"); if (FS) FS.innerHTML = formHTML(programs, up);
      wireForm(S);
      // structured data for courses
      if (open.length) {
        var ld = document.createElement("script"); ld.type = "application/ld+json";
        ld.textContent = JSON.stringify(open.map(function (p) { return { "@context": "https://schema.org", "@type": "Course", name: p.title, description: p.summary || p.title, url: "https://researchmed.in/alliedpath/program.html?p=" + p.slug, provider: { "@type": "Organization", name: "AlliedPath by ResearchMed Connect", sameAs: "https://researchmed.in/alliedpath/" } }; }));
        document.head.appendChild(ld);
      }
    }

    if (PAGE === "program") {
      var key = new URLSearchParams(location.search).get("p");
      var p = programs.filter(function (x) { return x.slug === key; })[0] || open[0];
      var main = $("#program");
      if (!p) { main.innerHTML = '<div class="wrap" style="padding:160px 0 80px"><h1>Program not found</h1><p><a href="index.html#programs">See all AlliedPath programs</a></p></div>'; return; }
      document.title = p.title + " | AlliedPath";
      var mods = lines(p.modules), outs = lines(p.outcomes), pb = up.filter(function (b) { return b.program === p.title; }), fee = feeText(p);
      main.innerHTML =
        '<section class="hero p-hero on-dark"><span class="orb o1" aria-hidden="true"></span><span class="orb o2" aria-hidden="true"></span><span class="grain" aria-hidden="true"></span><div class="wrap p-wrap">' +
        '<div><a class="back h-in" href="index.html#programs">\u2190 All programs</a><span class="eyebrow h-in" style="animation-delay:.1s">' + esc(p.status || "Enrolling") + " \u00b7 NCAHP-aligned</span>" +
        '<h1 class="h-in" style="animation-delay:.2s">' + esc(p.title) + "</h1>" + (p.summary ? '<p class="lead h-in" style="animation-delay:.35s">' + esc(p.summary) + "</p>" : "") +
        (/planned/i.test(p.status || "") ? '<p class="p-note h-in" style="animation-delay:.4s"><b>Planned program.</b> The syllabus below is what we will teach. Register your interest and you will be the first to hear when the first batch opens.</p>' : "") +
        '<div class="ctas h-in" style="animation-delay:.5s"><a class="btn btn-main" href="#join" data-want="' + (pb.length ? "seat" : "interest") + '" data-program="' + esc(p.title) + '">' + (pb.length ? "Reserve a seat" : "Register interest") + ' <span class="arr" aria-hidden="true">\u2192</span></a><a class="btn btn-ghost" href="#join" data-want="demo" data-program="' + esc(p.title) + '">Book a free demo</a></div></div>' +
        '<dl class="p-facts h-in" style="animation-delay:.45s">' + [["Who it's for", p.audience], ["Duration", p.duration], ["Format", p.mode], ["Fee", fee || "Shared when you reserve"]].filter(function (x) { return x[1]; }).map(function (x) { return "<div><dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("") + "</dl></div></section>" +
        (p.overview ? '<section><div class="wrap narrow rv"><span class="eyebrow">Overview</span><div class="prose">' + md(p.overview) + "</div></div></section>" : "") +
        (mods.length ? '<section class="programs" id="modules"><div class="wrap"><div class="sec-head rv"><span class="eyebrow">Syllabus</span><h2>What you will learn</h2><p class="lead">' + mods.length + " modules, following the NCAHP curriculum for the program.</p></div><ol class=\"mods\">" +
          mods.map(function (m, n) { var t = m.split(":"); return '<li class="rv"><details' + (n ? "" : " open") + "><summary><b>" + String(n + 1).padStart(2, "0") + "</b>" + esc(t[0]) + "</summary>" + (t.length > 1 ? '<p>' + esc(t.slice(1).join(":").trim()) + "</p>" : "") + "</details></li>"; }).join("") + "</ol></div></section>" : "") +
        (outs.length ? '<section><div class="wrap"><div class="sec-head rv"><span class="eyebrow">Outcomes</span><h2>By the end you will be able to</h2></div><ul class="outs grid">' + outs.map(function (o) { return '<li class="rv">' + esc(o) + "</li>"; }).join("") + "</ul></div></section>" : "") +
        '<section class="programs" id="batches"><div class="wrap"><div class="sec-head rv"><span class="eyebrow">Batches</span><h2>Upcoming batches</h2></div><div class="batches grid">' +
        (pb.length ? pb.map(function (b) { return batchCard(b, programs); }).join("") : '<div class="empty rv"><strong>Dates for the next batch are coming soon</strong><p>Register your interest and we will tell you first.</p></div>') + "</div>" +
        ((p.pay_in || p.pay_intl) ? '<div class="pay rv"><div><h3>Pay online</h3><p>Reserve your seat first, then pay securely online. ' + (S.fee_note ? esc(S.fee_note) : "") + '</p></div><div class="btn-row">' + (p.pay_in ? '<a class="btn btn-main" href="' + esc(safeUrl(p.pay_in)) + '" target="_blank" rel="noopener">Pay in \u20b9 (India)</a>' : "") + (p.pay_intl ? '<a class="btn btn-ghost" href="' + esc(safeUrl(p.pay_intl)) + '" target="_blank" rel="noopener">Pay from outside India</a>' : "") + '</div><p class="fine">By paying you agree to the <a href="policies.html">terms and refund policy</a>.</p></div>' : "") +
        (p.brochure ? '<p class="rv" style="margin-top:18px"><a class="btn btn-ghost" href="' + esc(media(p.brochure)) + '" target="_blank" rel="noopener">Download the brochure (PDF)</a></p>' : "") + "</div></section>" +
        '<section class="join on-dark" id="join"><div class="wrap join-grid"><div><span class="eyebrow" style="color:var(--mint)">Join</span><h2 style="margin-top:12px">Reserve a seat, book a free demo or ask a question</h2><p class="lead" style="margin-top:14px">We reply personally, usually within a day.</p></div><div id="form-slot"></div></div></section>';
      $("#form-slot").innerHTML = formHTML(programs, up);
      wireForm(S); window.apChoose(pb.length ? "seat" : "interest", { program: p.title });
      var ld2 = document.createElement("script"); ld2.type = "application/ld+json";
      ld2.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: p.title, description: p.summary || p.title, url: location.href.split("#")[0], provider: { "@type": "Organization", name: "AlliedPath by ResearchMed Connect", sameAs: "https://researchmed.in/alliedpath/" } });
      document.head.appendChild(ld2);
    }

    if (PAGE === "resources") {
      var types = []; resources.forEach(function (x) { if (x.type && types.indexOf(x.type) < 0) types.push(x.type); });
      var FL = $("#res-filter"), GL = $("#res-list");
      var drawRes = function (t) { GL.innerHTML = resources.filter(function (x) { return !t || x.type === t; }).map(resourceCard).join("") || '<div class="empty"><strong>New resources are on the way</strong><p>Check back soon.</p></div>'; reveal(GL); };
      if (FL) { FL.innerHTML = ['<button type="button" class="on" data-t="">All</button>'].concat(types.map(function (t) { return '<button type="button" data-t="' + esc(t) + '">' + esc(t) + "</button>"; })).join(""); FL.hidden = types.length < 2;
        FL.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; $$("button", FL).forEach(function (x) { x.classList.toggle("on", x === b); }); drawRes(b.getAttribute("data-t")); }); }
      drawRes("");
      quiz($("#quiz"), qz);
    }

    if (PAGE === "policies") {
      $("#terms").innerHTML = md(S.terms); $("#refund").innerHTML = md(S.refund); $("#privacy-note").innerHTML = md(S.privacy_note);
    }
    reveal();
  });

  // ---------- visitor count + alerts (same settings as ResearchMed) ----------
  if (!/^(localhost|127\.)/.test(location.hostname)) load("settings").then(function (s) {
    var code = String(s.goatcounter || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.goatcounter\.com.*$/, "");
    if (/^[a-z0-9-]+$/.test(code)) { var gc = document.createElement("script"); gc.async = true; gc.src = "https://gc.zgo.at/count.js"; gc.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count"); document.body.appendChild(gc); }
    if (s.visitor_alert_url && s.visitor_alerts !== false) { window.RMC_ALERT = String(s.visitor_alert_url).trim(); var va = document.createElement("script"); va.src = "../assets/js/alerts.js?v=20261010b"; va.defer = true; document.body.appendChild(va); }
  });
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- "Register interest" asks: student or faculty? ----------
  (function () {
    var css = ".who{position:fixed;inset:0;z-index:150;display:grid;place-items:center;padding:16px;background:rgba(6,20,22,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s}" +
      ".who.on{opacity:1}.who[hidden]{display:none}" +
      ".who-box{position:relative;width:min(640px,100%);background:#FAF7F0;border-radius:26px;padding:30px 26px 22px;box-shadow:0 40px 80px -30px rgba(0,0,0,.7);transform:translateY(14px) scale(.98);transition:transform .3s cubic-bezier(.2,.8,.2,1)}" +
      ".who.on .who-box{transform:none}" +
      ".who h2{font-size:clamp(1.5rem,3.4vw,2rem);margin:0 0 6px}.who p.sub{margin:0 0 20px;color:var(--muted)}" +
      ".who-opts{display:grid;grid-template-columns:1fr 1fr;gap:14px}" +
      ".who-opts a{display:grid;gap:8px;padding:20px 18px;border-radius:20px;border:1.5px solid var(--line);background:#fff;text-decoration:none;color:var(--text);transition:transform .2s,border-color .2s,box-shadow .2s}" +
      ".who-opts a:hover,.who-opts a:focus-visible{transform:translateY(-3px);border-color:var(--emerald);box-shadow:0 18px 36px -22px rgba(15,42,46,.5)}" +
      ".who-opts .ic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:#E6F5F0;color:var(--emerald)}" +
      ".who-opts a.who-f .ic{background:#FBEFD9;color:var(--saffron-ink)}.who-opts .ic svg{width:26px;height:26px}" +
      ".who-opts b{font:650 1.15rem var(--serif);color:var(--ink)}.who-opts span{font-size:.88rem;color:var(--muted);line-height:1.45}.who-opts em{font-style:normal;font-weight:700;font-size:.9rem;color:var(--emerald)}.who-opts a.who-f em{color:var(--saffron-ink)}" +
      ".who-x{position:absolute;right:14px;top:12px;width:38px;height:38px;border-radius:50%;border:0;background:transparent;font-size:1.5rem;line-height:1;color:var(--muted);cursor:pointer}.who-x:hover{background:#EFEAE0}" +
      ".who-alt{margin:16px 0 0;font-size:.88rem;color:var(--muted);text-align:center}.who-alt a{color:var(--emerald);font-weight:600}" +
      "@media (max-width:560px){.who-opts{grid-template-columns:1fr}.who-box{padding:26px 18px 18px}}";
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    var onHome = !!$("#join");
    var m = document.createElement("div"); m.className = "who"; m.hidden = true;
    m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "who-h");
    m.innerHTML = '<div class="who-box"><button class="who-x" type="button" aria-label="Close">\u00d7</button>' +
      '<h2 id="who-h">Register your interest</h2><p class="sub">Tell us who you are and we\u2019ll open the right form.</p>' +
      '<div class="who-opts">' +
      '<a class="who-s" href="student.html"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 12 2l10 4.5L12 11 2 6.5Z"/><path d="M6 8.5V14c0 1.7 2.7 3 6 3s6-1.3 6-3V8.5"/></svg></span><b>I\u2019m a student</b><span>Classes, doubt clearing, research, interview and placement guidance.</span><em>Student registration \u2192</em></a>' +
      '<a class="who-f" href="faculty.html"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 11l2 2 4-4"/></svg></span><b>I\u2019m faculty</b><span>Allied health educator or clinician who wants to teach or mentor.</span><em>Faculty application \u2192</em></a>' +
      "</div>" +
      '<p class="who-alt">Just want a free demo or to ask a doubt? <a href="' + (onHome ? "#join" : "index.html#join") + '" data-alt>Use the quick form</a></p></div>';
    document.body.appendChild(m);
    var last = null;
    var close = function () { m.classList.remove("on"); setTimeout(function () { m.hidden = true; }, 220); document.removeEventListener("keydown", esc2); if (last) last.focus({ preventScroll: true }); };
    var esc2 = function (e) { if (e.key === "Escape") close(); };
    var open = function (from) { last = from; m.hidden = false; requestAnimationFrame(function () { m.classList.add("on"); }); document.addEventListener("keydown", esc2); setTimeout(function () { var a = m.querySelector(".who-opts a"); if (a) a.focus({ preventScroll: true }); }, 60); };
    m.addEventListener("click", function (e) {
      if (e.target === m || e.target.closest(".who-x")) { close(); return; }
      var alt = e.target.closest("[data-alt]");
      if (alt && onHome) { e.preventDefault(); close(); $("#join").scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" }); }
    });
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]"); if (!a || m.contains(a)) return;
      var h = a.getAttribute("href") || "", w = a.getAttribute("data-want");
      if (!/(^|index\.html)#join$/.test(h)) return;
      if (w && w !== "interest") return;                       // demo, seat and doubt links keep using the quick form
      if (w === "interest" && a.getAttribute("data-program")) return; // "tell me about this program" keeps the quick form
      if (!/register/i.test(a.textContent)) return;
      e.preventDefault(); e.stopPropagation(); open(a);
    }, true);
  })();
})();
