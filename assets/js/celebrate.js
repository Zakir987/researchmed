/* ResearchMed Connect: celebrations (birthdays, anniversaries, awards…) managed in Admin > Celebrations.
   Each entry has a start and end date (IST). While active it shows a ribbon, a one-time celebration card
   with a gentle confetti burst, and a badge on the person's contributor card. Nothing shows outside the dates. */
(function () {
  "use strict";
  if (window.__rmcCelebrate) return; window.__rmcCelebrate = true;
  const page = document.body.dataset.page || "";
  if (page === "admin") return;

  const GROUP_DEFAULT = "https://chat.whatsapp.com/JacGKiNxqda5ZrIUpyTFft";
  const OCC = {
    "Birthday": { e: "🎂", h: "Happy Birthday", badge: "Birthday today" },
    "Work anniversary": { e: "🎉", h: "Happy Work Anniversary", badge: "Anniversary today" },
    "Wedding anniversary": { e: "💐", h: "Happy Anniversary", badge: "Anniversary today" },
    "Award / achievement": { e: "🏆", h: "Congratulations", badge: "Congratulations" },
    "Welcome": { e: "👋", h: "Welcome", badge: "Welcome" },
    "Other": { e: "🎉", h: "Celebrating", badge: "Celebrating today" },
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const todayIST = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const onPage = (w) => (w === "All pages" ? true : w === "Home page only" ? page === "home" : page === "home" || page === "about");
  const safeLink = (u) => { u = String(u || "").trim(); return /^https:\/\//.test(u) ? u : ""; };

  fetch("content/celebrations.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => {
    const all = ((j && j.items) || []).filter((x) => x && x.title && x.draft !== true && x.start && x.end && String(x.start) <= todayIST && todayIST <= String(x.end));
    const list = all.filter((x) => onPage(x.pages || "Home and About pages"));
    if (!list.length) return;
    run(list);
  });

  function run(list) {
    const css = `
  .bd-rib{position:relative;z-index:5;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 14px;padding:10px 16px;background:linear-gradient(90deg,#0B1F3A,#12294A);color:#fff;font:600 .95rem/1.4 inherit;text-align:center;border-bottom:2px solid #C9A227}
  .bd-rib b{color:#F3D77A}
  .bd-rib button{border:1px solid rgba(243,215,122,.7);background:transparent;color:#F3D77A;border-radius:8px;padding:6px 14px;font:600 .88rem inherit;cursor:pointer;min-height:36px}
  .bd-rib button:hover{background:rgba(243,215,122,.12)}
  .bd-dlg{border:0;padding:0;background:transparent;max-width:min(560px,calc(100% - 28px));width:100%;overflow:visible}
  .bd-dlg::backdrop{background:rgba(6,14,28,.62);backdrop-filter:blur(3px)}
  .bd-card{position:relative;overflow:hidden;border-radius:18px;background:#fff;color:#17202A;text-align:center;padding:30px 26px 24px;box-shadow:0 30px 70px rgba(0,0,0,.35);border-top:5px solid #C9A227}
  .bd-card::before{content:"";position:absolute;inset:0 0 auto 0;height:150px;background:linear-gradient(180deg,#F8F1DC,rgba(248,241,220,0));z-index:0}
  .bd-card > *{position:relative;z-index:1}
  .bd-x{position:absolute;top:10px;right:10px;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:rgba(11,31,58,.06);color:#0B1F3A;font-size:1.3rem;cursor:pointer}
  .bd-x:hover{background:rgba(11,31,58,.12)}
  .bd-tag{display:inline-flex;align-items:center;gap:6px;margin:0 0 14px;padding:4px 12px;border-radius:999px;background:#0B1F3A;color:#F3D77A;font:700 .74rem/1.4 inherit;letter-spacing:.1em;text-transform:uppercase}
  .bd-ph{width:128px;height:128px;margin:0 auto 14px;border-radius:50%;padding:4px;background:conic-gradient(#C9A227,#F3D77A,#087F8C,#C9A227);box-shadow:0 10px 26px rgba(201,162,39,.35)}
  .bd-ph img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #fff;background:#eef2f6}
  .bd-ph span{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;border:3px solid #fff;background:#0B1F3A;color:#F3D77A;font:700 2.4rem Georgia,serif}
  .bd-h{margin:0;font:700 clamp(1.45rem,1.1rem + 1.4vw,1.95rem)/1.2 Georgia,"Times New Roman",serif;color:#0B1F3A}
  .bd-h span{display:block;font-size:.62em;color:#7A5F0C;letter-spacing:.02em;margin-bottom:4px}
  .bd-role{margin:8px 0 0;color:#0B1F3A;font-weight:600;font-size:.95rem}
  .bd-inst{margin:2px 0 0;color:#5B6777;font-size:.9rem}
  .bd-msg{margin:16px auto 0;max-width:46ch;font-size:1rem;line-height:1.6;color:#17202A;white-space:pre-line}
  .bd-sign{margin:12px 0 0;font:italic 600 .98rem Georgia,serif;color:#0B1F3A}
  .bd-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:20px}
  .bd-acts a,.bd-acts button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 20px;border-radius:10px;font:600 .95rem inherit;text-decoration:none;cursor:pointer}
  .bd-go{background:#087F8C;color:#fff;border:1px solid #087F8C}
  .bd-go:hover{background:#066A75;color:#fff}
  .bd-later{background:transparent;color:#0B1F3A;border:1px solid #0B1F3A}
  .bd-cv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000}
  .bd-badge{display:inline-flex;align-items:center;gap:5px;margin:0 auto 8px;padding:3px 10px;border-radius:999px;background:#C9A227;color:#1d1604;font:700 .74rem/1.5 inherit;letter-spacing:.02em}
  .cf-card.bd-on{box-shadow:0 0 0 3px #C9A227,0 18px 40px rgba(201,162,39,.35)!important}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .bd-card{background:#10223B;color:#E4EAF2}:root:not([data-theme="light"]) .bd-card::before{background:linear-gradient(180deg,rgba(201,162,39,.18),transparent)}:root:not([data-theme="light"]) .bd-h,:root:not([data-theme="light"]) .bd-role,:root:not([data-theme="light"]) .bd-sign{color:#F1F5FA}:root:not([data-theme="light"]) .bd-msg{color:#E4EAF2}:root:not([data-theme="light"]) .bd-inst{color:#A2B0C2}:root:not([data-theme="light"]) .bd-later{color:#F1F5FA;border-color:#F1F5FA}:root:not([data-theme="light"]) .bd-x{color:#fff;background:rgba(255,255,255,.08)}:root:not([data-theme="light"]) .bd-h span{color:#E2C35A}}
  :root[data-theme="dark"] .bd-card{background:#10223B;color:#E4EAF2}:root[data-theme="dark"] .bd-card::before{background:linear-gradient(180deg,rgba(201,162,39,.18),transparent)}:root[data-theme="dark"] .bd-h,:root[data-theme="dark"] .bd-role,:root[data-theme="dark"] .bd-sign{color:#F1F5FA}:root[data-theme="dark"] .bd-msg{color:#E4EAF2}:root[data-theme="dark"] .bd-inst{color:#A2B0C2}:root[data-theme="dark"] .bd-later{color:#F1F5FA;border-color:#F1F5FA}:root[data-theme="dark"] .bd-x{color:#fff;background:rgba(255,255,255,.08)}:root[data-theme="dark"] .bd-h span{color:#E2C35A}
  @media print{.bd-rib,.bd-dlg,.bd-cv{display:none}}`;
    const st = document.createElement("style"); st.textContent = css; document.head.append(st);
    const groupUrl = () => { const g = String(window.RMC_GROUP || "").trim(); return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(g) ? g : GROUP_DEFAULT; };
    const main = document.querySelector("main") || document.body;
    const dialogs = [];

    list.slice(0, 3).reverse().forEach((x) => {
      const o = OCC[x.occasion] || OCC.Birthday;
      const heading = String(x.heading || "").trim() || o.h;
      const photo = String(x.photo || "").replace(/^\//, "");
      const initials = String(x.title).replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      const link = safeLink(x.link) || groupUrl();

      // Ribbon
      const rib = document.createElement("div");
      rib.className = "bd-rib"; rib.setAttribute("role", "note");
      rib.innerHTML = `<span>${o.e} ${esc(heading)}, <b>${esc(x.title)}</b>!${x.ribbon ? ` ${esc(x.ribbon)}` : ""}</span><button type="button">See the celebration</button>`;
      main.prepend(rib);

      // Card
      const dlg = document.createElement("dialog");
      const hid = "bd-h-" + Math.random().toString(36).slice(2, 7);
      dlg.className = "bd-dlg"; dlg.setAttribute("aria-labelledby", hid);
      dlg.innerHTML = `<div class="bd-card">
          <button type="button" class="bd-x" aria-label="Close">×</button>
          <p class="bd-tag">${o.e} ${x.occasion === "Award / achievement" ? "Celebrating an achievement" : "Celebrating today"}</p>
          <div class="bd-ph">${photo ? `<img src="${esc(photo)}" alt="${esc(x.title)}" width="128" height="128" decoding="async">` : `<span aria-hidden="true">${esc(initials)}</span>`}</div>
          <h2 class="bd-h" id="${hid}"><span>${esc(heading)}</span>${esc(x.title)}</h2>
          ${x.role ? `<p class="bd-role">${esc(x.role)}</p>` : ""}
          ${x.institution ? `<p class="bd-inst">${esc(x.institution)}</p>` : ""}
          ${x.message ? `<p class="bd-msg">${esc(x.message)}</p>` : ""}
          <p class="bd-sign">${esc(x.signature || "With warm wishes, the ResearchMed Connect family")}</p>
          <div class="bd-acts"><a class="bd-go" href="${esc(link)}" target="_blank" rel="noopener">${o.e} ${esc(x.button || "Send your wishes")}</a><button type="button" class="bd-later">Close</button></div>
        </div>`;
      document.body.append(dlg);
      const confettiOn = x.confetti !== false;
      const open = () => { if (dlg.open) return; try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); } if (confettiOn) confetti(); setTimeout(() => dlg.querySelector(".bd-go").focus(), 60); };
      const close = () => { dlg.close ? dlg.close() : dlg.removeAttribute("open"); };
      rib.querySelector("button").addEventListener("click", open);
      dlg.querySelector(".bd-x").addEventListener("click", close);
      dlg.querySelector(".bd-later").addEventListener("click", close);
      dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
      const key = "celSeen:" + x.title + ":" + x.start;
      dlg.addEventListener("close", () => { try { sessionStorage.setItem(key, "1"); } catch (e) {} });
      let seen = false; try { seen = sessionStorage.getItem(key) === "1"; } catch (e) {}
      if (x.popup !== false && page === "home" && !seen) dialogs.push(open);
      markCard(x.title, o.e + " " + (x.badge || o.badge));
    });

    // Open the cards one by one on the home page, after any other pop-up has been closed
    let tries = 0;
    const next = () => {
      if (!dialogs.length) return;
      if (document.querySelector("dialog[open]") && ++tries < 300) return setTimeout(next, 1000);
      dialogs.shift()(); setTimeout(next, 1200);
    };
    setTimeout(next, 1600);
  }

  // Badge + bring the person's contributor card to the front of the carousel
  function markCard(name, text) {
    const n = String(name).toLowerCase().replace(/^(dr|mr|mrs|ms|prof)\.?\s*/, "").replace(/[^a-z]/g, "");
    let k = 0;
    const tick = () => {
      const cards = [...document.querySelectorAll(".cf-card")].filter((c) => { const t = ((c.querySelector("h3") || {}).textContent || "").toLowerCase().replace(/^(dr|mr|mrs|ms|prof)\.?\s*/, "").replace(/[^a-z]/g, ""); return n && t === n; });
      cards.forEach((c) => {
        if (c.classList.contains("bd-on")) return;
        c.classList.add("bd-on");
        const info = c.querySelector(".cf-info"); if (info) { const b = document.createElement("span"); b.className = "bd-badge"; b.textContent = text; info.prepend(b); }
        if (!c.classList.contains("on")) c.click();
      });
      if (!cards.length && ++k < 40) setTimeout(tick, 500);
    };
    tick();
  }

  // One gentle confetti burst (skipped for reduced motion)
  function confetti() {
    if (reduce) return;
    const cv = document.createElement("canvas"); cv.className = "bd-cv"; cv.setAttribute("aria-hidden", "true");
    document.body.append(cv);
    const ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const C = ["#C9A227", "#F3D77A", "#087F8C", "#4FC0CB", "#0B1F3A", "#E8735A", "#ffffff"];
    const parts = Array.from({ length: 140 }, (_, i) => {
      const left = i % 2 === 0, a = Math.PI / 2.6 + (Math.random() - .5) * .6, sp = 9 + Math.random() * 8;
      return { x: left ? 0 : W, y: H * .75, vx: (left ? 1 : -1) * Math.cos(a - .2) * sp * .9, vy: -Math.sin(a + .5) * sp, r: 4 + Math.random() * 5, c: C[i % C.length], rot: Math.random() * 6, vr: (Math.random() - .5) * .3, t: Math.random() < .3 ? "c" : "r" };
    });
    const t0 = performance.now();
    (function step(t) {
      const el = t - t0; ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += 0.22; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - el / 4200); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.t === "c") { ctx.beginPath(); ctx.arc(0, 0, p.r * .55, 0, 6.283); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (el < 4200) requestAnimationFrame(step); else cv.remove();
    })(t0);
  }
})();
