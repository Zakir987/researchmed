/* ResearchMed Connect — visitor alerts (Admin > Numbers & contact > Visitor alerts).
   Sends an anonymous ping to the owner's Google Apps Script, which forwards it to WhatsApp / email.
   Nothing personal is sent: page, where the visitor came from, mobile/desktop, time zone, language
   and a random visitor id. Respects Do Not Track / Global Privacy Control. The owner's own
   devices are skipped (opening the Admin page marks the device; ?alerts=off / ?alerts=on toggles it). */
(function () {
  "use strict";
  var URL_ = window.RMC_ALERT;
  if (!URL_ || !/^https:\/\/script\.google(usercontent)?\.com\//.test(URL_)) return;
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  var q = new URLSearchParams(location.search).get("alerts");
  if (q === "off") ls("rmc-me", "1"); else if (q === "on") ls("rmc-me", null);
  if (ls("rmc-me") === "1") return;
  var ua = navigator.userAgent || "";
  if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|whatsapp/i.test(ua)) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  var isNew = false, vid = ls("rmc-vid");
  if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); ls("rmc-vid", vid); isNew = true; }
  var ref = "";
  try {
    ref = sessionStorage.getItem("rmc-ref") || "";
    if (!ref && document.referrer && document.referrer.indexOf(location.origin) !== 0) { ref = document.referrer.slice(0, 140); sessionStorage.setItem("rmc-ref", ref); }
  } catch (e) {}
  var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

  function send(type, extra) {
    var d = { t: type, v: vid, p: (location.pathname + location.search).slice(0, 90), ti: document.title.slice(0, 90), r: ref, m: /Mobi|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop", tz: tz, l: navigator.language || "", n: isNew };
    for (var k in extra) d[k] = extra[k];
    var body = JSON.stringify(d);
    try { if (navigator.sendBeacon && navigator.sendBeacon(URL_, body)) return; } catch (e) {}
    try { fetch(URL_, { method: "POST", mode: "no-cors", keepalive: true, body: body }); } catch (e) {}
  }
  // One ping per page opened (the script decides what deserves a message)
  setTimeout(function () { send("view", {}); }, 1200);

  // Hot actions
  var done = {};
  function lead(kind, info, name) {
    var key = kind + "|" + (info || "");
    if (done[key]) return; done[key] = 1;
    send("lead", { k: kind, i: String(info || "").replace(/\s+/g, " ").trim().slice(0, 100), nm: name || "" });
  }
  var heading = function (el) { var c = el && el.closest(".ev-card,.ev-strip,.wad,.wp,.book,.card,article,section"); var h = c && c.querySelector("h1,h2,h3"); return h ? h.textContent : document.title.replace(/\s*\|.*$/, ""); };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a,button") : null;
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/chat\.whatsapp\.com/.test(h)) lead("Opened your WhatsApp group link", heading(a));
    else if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//.test(h)) lead("WhatsApp chat started", heading(a));
    else if (/[?&]offer=/.test(h)) lead("Clicked the offer", decodeURIComponent((h.match(/offer=([^&#]+)/) || [])[1] || ""));
    else if (a.classList.contains("rb-fab")) lead("Opened the chat with Riya", document.title.replace(/\s*\|.*$/, ""));
    else if (a.closest(".ev-card,.ev-strip") && /btn-primary/.test(a.className)) lead("Event registration click", heading(a));
    else if (/^mailto:/.test(h)) lead("Clicked your email address", h.replace(/^mailto:/, "").split("?")[0]);
    else if (/^tel:/.test(h)) lead("Tapped to call you", "");
    else if (a.hasAttribute("data-book-call") || /[?&]call=1/.test(h)) lead("Wants a free 15-minute call", document.title.replace(/\s*\|.*$/, ""));
  }, true);
  // Sent from the enquiry / call form after it is delivered (first name and service only)
  document.addEventListener("rmc:lead", function (e) { var d = e.detail || {}; lead(d.kind || "Enquiry sent", d.info, d.name); });
})();
