/* ResearchMed Connect — shared layout + content rendering.
   All content lives in /content/*.json and is edited through Pages CMS (see README). */
(function () {
  "use strict";

  // ---------- Small helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
  const PAGE = document.body.dataset.page || "";

  /** Resolve a media path saved by the CMS ("/media/x.jpg", "media/x.jpg" or a full URL). */
  function media(p) {
    if (!p) return "";
    p = String(p).trim();
    if (/^(https?:)?\/\//i.test(p) || p.startsWith("data:")) return p;
    return p.replace(/^\/+/, "");
  }
  /** Only allow http(s)/relative links in hrefs. */
  function safeUrl(u) {
    if (!u) return "";
    u = String(u).trim();
    if (/^(javascript|data|vbscript):/i.test(u)) return "";
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}\//i.test(u) || /^(www\.)?(linkedin|youtube|youtu|scholar\.google|orcid|researchgate|facebook|instagram|x|twitter)\.[a-z.]+(\/|$)/i.test(u)) return "https://" + u;
    return u;
  }
  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(String(d).length <= 10 ? d + "T00:00:00" : d);
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  const byDate = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
  const featuredFirst = (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byDate(a, b);

  /** Tiny, safe markdown: headings, lists, bold/italic, links, paragraphs. Input is escaped first. */
  function md(src) {
    if (!src) return "";
    const lines = esc(src).replace(/\r/g, "").split("\n");
    let html = "", list = null, para = [];
    const inline = (t) => t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[a-z0-9./#?=&_-]+)\)/gi, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const flushP = () => { if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
    const flushL = () => { if (list) { html += `<${list.t}>` + list.items.map((i) => "<li>" + inline(i) + "</li>").join("") + `</${list.t}>`; list = null; } };
    for (const raw of lines) {
      const l = raw.trim();
      let m;
      if (!l) { flushP(); flushL(); continue; }
      if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flushP(); flushL(); const n = Math.min(Math.max(m[1].length, 2), 4); html += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
      if ((m = l.match(/^[-*•]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(m[1]); continue; }
      if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(m[1]); continue; }
      flushL(); para.push(l);
    }
    flushP(); flushL();
    return html;
  }
  const plain = (s, n = 180) => { s = String(s || "").replace(/(^|\n)\s*[-•]\s+/g, "$1").replace(/[#*_\[\]()>]/g, "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

  // ---------- Video helpers ----------
  function youtubeId(url) {
    if (!url) return null;
    const m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function driveId(url) {
    const m = String(url || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]{10,})/);
    return m ? m[1] : null;
  }
  function vimeoId(url) {
    const m = String(url || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  }
  function videoThumb(v) {
    if (v.thumbnail) return media(v.thumbnail);
    const y = youtubeId(v.video_url);
    return y ? `https://i.ytimg.com/vi/${y}/hqdefault.jpg` : "";
  }
  function videoPlayer(v) {
    const y = youtubeId(v.video_url), d = driveId(v.video_url), vm = vimeoId(v.video_url);
    if (v.video_file) return `<div class="player"><video controls preload="metadata" playsinline ${v.thumbnail ? `poster="${esc(media(v.thumbnail))}"` : ""} src="${esc(media(v.video_file))}"></video></div>`;
    if (y) return `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${y}" title="${esc(v.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    if (vm) return `<div class="player"><iframe src="https://player.vimeo.com/video/${vm}" title="${esc(v.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    if (d) return `<div class="player"><iframe src="https://drive.google.com/file/d/${d}/preview" title="${esc(v.title)}" allow="autoplay" allowfullscreen loading="lazy"></iframe></div>`;
    if (v.video_url) return `<p><a class="btn btn-primary" href="${esc(safeUrl(v.video_url))}" target="_blank" rel="noopener">Watch video ↗</a></p>`;
    return `<div class="player"><div class="poster" style="color:var(--muted)">${ICON.film}</div></div>`;
  }

  // ---------- Icons ----------
  const ICON = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3v5a4 4 0 0 0 8 0V3"/><path d="M9 12v2a5 5 0 0 0 10 0v-2"/><circle cx="19" cy="10" r="2"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    wa: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  };

  // ---------- Layout (header + footer shared by every page) ----------
  const INDEXES = ["Scopus", "Embase", "PubMed", "Web of Science"];
  function navItems(s, n) {
    return [
      ["index.html", "Home", "home", true],
      ["highlights.html", "Publications", "highlights", n.highlights > 0],
      ["books.html", "Books", "books", true],
      ["papers.html", "Collaborate", "papers", true],
      ["journal/", "Journal", "journal", true],
      ["videos.html", "Videos", "videos", s.show_videos === true && n.videos > 0],
      ["notes.html", "Notes", "notes", n.notes > 0],
      ["gallery.html", "Gallery", "gallery", n.gallery > 0],
      ["services.html", "Services", "services", true],
      ["about.html", "About", "about", true],
      ["faqs.html", "FAQs", "faqs", true],
      ["updates.html", "Updates", "updates", n.updates > 0],
    ].filter((x) => x[3]);
  }

  function renderLayout(settings, counts) {
    const s = settings || {};
    const NAV = navItems(s, counts || {});
    if (s.logo) { const ic = document.querySelector('link[rel="icon"]'); if (ic) { ic.href = media(s.logo); ic.removeAttribute("type"); } }
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html" aria-label="${esc(s.site_name || "ResearchMed Connect")} home">
          <span class="brand-mark"${s.logo ? ' style="background:#fff;border:1px solid var(--line);overflow:hidden"' : ""}>${s.logo ? `<img src="${esc(media(s.logo))}" alt="" style="width:100%;height:100%;object-fit:contain">` : ICON.logo}</span>
          <span><span class="brand-name">${esc(s.site_name || "ResearchMed Connect")}</span><span class="brand-tag">${esc(s.tagline || "Research. Learn. Publish. Grow.")}</span></span>
        </a>
        <nav class="nav" id="site-nav" aria-label="Main">
          ${NAV.filter(([, , k]) => k !== "updates" || PAGE === "updates").map(([h, t, k]) => `<a href="${h}" ${k === PAGE ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
          <a class="nav-cta" href="contact.html" ${PAGE === "contact" ? 'aria-current="page"' : ""}>Enquire now</a>
        </nav>
        <button class="theme-toggle" type="button" aria-label="Toggle dark mode">${ICON.moon}</button>
        <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">${ICON.menu}</button>
      </div>`;
    document.body.prepend(header);
    const skip = document.createElement("a");
    skip.className = "skip"; skip.href = "#main"; skip.textContent = "Skip to content";
    document.body.prepend(skip);

    if (s.announcement) {
      const bar = document.createElement("div");
      bar.className = "announce";
      bar.innerHTML = `<div class="wrap"><span>${esc(s.announcement)}</span>${s.announcement_link ? `<a href="${esc(safeUrl(s.announcement_link))}">Learn more →</a>` : ""}</div>`;
      header.after(bar);
    }

    // Menus
    const nav = $("#site-nav"), mt = $(".menu-toggle");
    mt.addEventListener("click", () => { const o = nav.classList.toggle("open"); mt.setAttribute("aria-expanded", o); });

    // Theme
    const tt = $(".theme-toggle");
    const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const paint = () => { tt.innerHTML = isDark() ? ICON.sun : ICON.moon; };
    try { const saved = localStorage.getItem("rmc-theme"); if (saved) document.documentElement.dataset.theme = saved; } catch (e) {}
    paint();
    tt.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("rmc-theme", next); } catch (e) {}
      paint();
    });

    const email = s.email || "", wa = s.whatsapp || "";
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    const fIco = {
      mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3z"/></svg>',
      li: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>',
      yt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15V9l5.2 3z"/></svg>',
      up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
    };
    const waUrl = wa ? "https://wa.me/" + wa.replace(/\D/g, "") : "";
    const fName = esc(s.site_name || "ResearchMed Connect");
    const fLink = (h, t) => `<li><a href="${h}"><span>${t}</span><i aria-hidden="true">→</i></a></li>`;
    footer.innerHTML = `
      <div class="ft-pulse" aria-hidden="true"></div>
      <div class="wrap">
        <div class="ft-cta">
          <p class="ft-cta-title">Have a research idea? <span>Let&rsquo;s take it to publication.</span></p>
          <div class="ft-cta-btns"><a class="ft-btn ft-btn-p" href="contact.html">Send an enquiry</a>${waUrl ? `<a class="ft-btn ft-btn-g" href="${esc(waUrl)}" target="_blank" rel="noopener">${fIco.wa}<span>WhatsApp us</span></a>` : ""}</div>
        </div>
        <div class="foot-grid ft-grid">
          <div class="foot-brand ft-brand">
            <a class="ft-logo" href="index.html" aria-label="${fName} home"><span class="ft-mark">${s.logo ? `<img src="${esc(media(s.logo))}" alt="">` : ICON.logo}</span><span><span class="brand-name">${fName}</span><span class="ft-tag">${esc(s.tagline || "Research. Learn. Publish. Grow.")}</span></span></a>
            <p>${esc(s.footer_about || "Educational and academic guidance for healthcare professionals, students, researchers, and aspiring authors.")}</p>
            <div class="ft-social">
              ${email ? `<a href="mailto:${esc(email)}" aria-label="Email ${esc(email)}">${fIco.mail}</a>` : ""}
              ${waUrl ? `<a href="${esc(waUrl)}" target="_blank" rel="noopener" aria-label="WhatsApp">${fIco.wa}</a>` : ""}
              ${s.linkedin ? `<a href="${esc(safeUrl(s.linkedin))}" target="_blank" rel="noopener" aria-label="LinkedIn">${fIco.li}</a>` : ""}
              ${s.youtube_channel ? `<a href="${esc(safeUrl(s.youtube_channel))}" target="_blank" rel="noopener" aria-label="YouTube channel">${fIco.yt}</a>` : ""}
            </div>
          </div>
          <nav class="ft-col ft-explore" aria-label="Explore"><h2>Explore</h2><ul>${NAV.map(([h, t]) => fLink(h, t)).join("")}</ul></nav>
          <nav class="ft-col" aria-label="Help and legal"><h2>Help &amp; legal</h2><ul>${fLink("contact.html", "Send an enquiry")}${fLink("services.html", "Our services")}${fLink("feedback.html", "Share your experience")}${fLink("disclaimer.html", "Disclaimer")}${fLink("privacy.html", "Privacy Policy")}${fLink("terms.html", "Terms of Use")}</ul></nav>
          <div class="ft-col"><h2>Reach us</h2><div class="ft-cards">
            ${email ? `<a class="ft-card" href="mailto:${esc(email)}"><span class="ft-ic">${fIco.mail}</span><span><small>Email</small><b>${esc(email)}</b></span></a>` : ""}
            ${waUrl ? `<a class="ft-card" href="${esc(waUrl)}" target="_blank" rel="noopener"><span class="ft-ic ft-ic-wa">${fIco.wa}</span><span><small>WhatsApp</small><b>${esc(wa)}</b></span></a>` : ""}
          </div><p class="ft-reply"><span aria-hidden="true"></span>We reply within 1&ndash;2 working days</p></div>
        </div>
        <div class="foot-bottom ft-bottom">
          <span>© ${new Date().getFullYear()} ${fName}. All rights reserved.</span>
          <span>Educational and editorial guidance only — no guarantee of publication.</span>
          <button type="button" class="ft-top" aria-label="Back to top">${fIco.up}<span>Top</span></button>
        </div>
      </div>
      <div class="ft-word" aria-hidden="true">ResearchMed</div>`;
    footer.querySelector(".ft-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    document.body.append(footer);
    if (wa && PAGE !== "contact") {
      const fab = document.createElement("a");
      fab.className = "wa-fab";
      fab.href = "https://wa.me/" + wa.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hello ResearchMed Connect, I would like guidance with ");
      fab.target = "_blank"; fab.rel = "noopener";
      fab.setAttribute("aria-label", "Chat with us on WhatsApp");
      fab.innerHTML = ICON.wa + "<span>Chat with us</span>";
      const qc = document.createElement("aside"); qc.setAttribute("aria-label", "Quick contact"); qc.append(fab); document.body.append(qc);
    }

    // Contact placeholders on static pages
    $$("[data-email]").forEach((el) => { el.textContent = email; if (el.tagName === "A") el.href = "mailto:" + email; });
    $$("[data-whatsapp]").forEach((el) => { el.textContent = wa; if (el.tagName === "A") el.href = "https://wa.me/" + wa.replace(/\D/g, ""); });
  }

  // ---------- Content loading ----------
  const cache = {};
  async function load(name) {
    if (cache[name]) return cache[name];
    cache[name] = fetch(`content/${name}.json`, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((j) => {
        if (name === "settings" || name === "founder") return j || {};
        const items = Array.isArray(j) ? j : (j && j.items) || [];
        const seen = {};
        return items.filter((it) => it && it.title && it.draft !== true).map((it) => {
          let id = slug(it.slug || it.title);
          if (seen[id]) id += "-" + ++seen[id]; else seen[id] = 1;
          return Object.assign({}, it, { _id: id, _c: name });
        }).sort(byDate);
      });
    return cache[name];
  }
  const link = (c, it) => `item.html?c=${c}&id=${encodeURIComponent(it._id)}`;

  // ---------- Card renderers ----------
  function videoCard(v) {
    const th = videoThumb(v);
    return `<a class="card" href="${link("videos", v)}">
      <div class="card-media">${th ? `<img src="${esc(th)}" alt="" loading="lazy">` : `<div class="poster">${ICON.film}</div>`}
        <div class="play"><span>${ICON.play}</span></div>${v.duration ? `<span class="dur">${esc(v.duration)}</span>` : ""}</div>
      <div class="card-body">
        <div class="card-meta"><span class="tag tag-video">Video</span>${v.category ? `<span>${esc(v.category)}</span>` : ""}<span>${fmtDate(v.date)}</span></div>
        <h3>${esc(v.title)}</h3>${v.description ? `<p>${esc(plain(v.description))}</p>` : ""}
      </div></a>`;
  }
  function noteCard(n) {
    const kind = n.pdf ? (String(n.pdf).split(".").pop() || "PDF").toUpperCase().slice(0, 4) : "NOTE";
    return `<a class="card note-card" href="${link("notes", n)}">
      ${n.cover ? `<div class="card-media"><img src="${esc(media(n.cover))}" alt="" loading="lazy"></div>` : ""}
      <div class="card-body">
        <div class="note-top"><span class="doc-icon" aria-hidden="true">${esc(kind)}</span>
          <div style="display:grid;gap:6px;min-width:0">
            <div class="card-meta"><span class="tag tag-note">Notes</span>${n.category ? `<span>${esc(n.category)}</span>` : ""}</div>
            <h3>${esc(n.title)}</h3>
          </div></div>
        ${n.summary ? `<p>${esc(plain(n.summary))}</p>` : ""}
        <div class="card-meta"><span>${fmtDate(n.date)}</span>${n.pdf ? "<span>· Download available</span>" : ""}</div>
      </div></a>`;
  }
  function citeLine(h) { return [h.journal, h.year, h.volume].filter(Boolean).map(esc).join(" · "); }
  function doiHref(doi) { if (!doi) return ""; doi = String(doi).trim(); return /^https?:/i.test(doi) ? doi : "https://doi.org/" + doi.replace(/^doi:\s*/i, ""); }
  function findingsList(h, max) {
    let f = h.key_findings;
    if (typeof f === "string") f = f.split("\n");
    f = (f || []).map((x) => (typeof x === "object" && x ? x.point || x.text || "" : x)).map((x) => String(x).replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    if (max) f = f.slice(0, max);
    return f.length ? `<ul class="findings">${f.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  }
  function indexList(h) {
    let v = h.indexed_in;
    if (typeof v === "string") v = v.split(/[,;\n]/);
    return (v || []).map((x) => String(x).trim()).filter(Boolean);
  }
  function indexBadges(h) {
    const l = indexList(h);
    return l.length ? `<div class="idx-row">${l.map((x) => `<span class="idx idx-${slug(x)}">${esc(x)}</span>`).join("")}</div>` : "";
  }
  function pubIssue(h) {
    return [h.volume, h.year].filter(Boolean).map(esc).join(" · ");
  }
  function highlightCard(h) {
    const short = h.journal_short || h.journal || "";
    return `<a class="card pub-card" href="${link("highlights", h)}">
      <div class="pub-head">
        ${h.logo ? `<img class="pub-logo" src="${esc(media(h.logo))}" alt="${esc(short)} logo" loading="lazy">` : `<span class="pub-logo pub-logo-txt">${esc(short.slice(0, 5))}</span>`}
        <div class="pub-j"><span class="pub-short">${esc(short)}</span>${pubIssue(h) ? `<span class="pub-issue">${pubIssue(h)}</span>` : ""}</div>
      </div>
      <div class="card-body">
        <div class="card-meta"><span class="tag tag-highlight">Published</span>${h.study_type ? `<span>${esc(h.study_type)}</span>` : ""}</div>
        <h3>${esc(h.title)}</h3>
        ${h.summary ? `<p>${esc(plain(h.summary))}</p>` : ""}
        ${indexBadges(h)}
        <span class="pub-more">View publication →</span>
      </div></a>`;
  }
  // ---------- Books: call for chapter authors ----------
  function bookOpen(b) {
    if (b.open === false) return false;
    if (!b.deadline) return true;
    const d = new Date(b.deadline + "T23:59:59");
    return isNaN(d) || d >= new Date();
  }
  function bookCard(b) {
    const open = bookOpen(b);
    const ch = String(b.chapters || "").split(/\n+/).map((x) => x.replace(/^\s*[-•*\d.)]+\s*/, "").trim()).filter(Boolean);
    const shown = ch.slice(0, 6), more = ch.slice(6);
    const li = (x) => `<li>${esc(x)}</li>`;
    const apply = b.apply_link ? safeUrl(b.apply_link) : `contact.html?service=${encodeURIComponent("Book chapter authorship")}&book=${encodeURIComponent(b.title)}`;
    const ext = /^https?:/i.test(apply) ? ' target="_blank" rel="noopener"' : "";
    const cover = b.cover ? `<img src="${esc(media(b.cover))}" alt="Cover of ${esc(b.title)}" loading="lazy">` : `<span class="bk-fallback"><span>${esc(b.title)}</span></span>`;
    return `<article class="bk-card" id="${esc(b._id)}">
      <div class="bk-cover">${cover}</div>
      <div class="bk-body">
        <span class="bk-status ${open ? "is-open" : "is-closed"}">${open ? "Open for authors" : "Closed"}</span>
        <h3>${esc(b.title)}</h3>
        ${b.subtitle ? `<p class="bk-sub">${esc(b.subtitle)}</p>` : ""}
        ${b.description ? `<p class="bk-desc">${esc(b.description)}</p>` : ""}
        ${ch.length ? `<div class="bk-ch"><strong>Chapters open for authors</strong><ul>${shown.map(li).join("")}</ul>${more.length ? `<details><summary>+ ${more.length} more chapter${more.length > 1 ? "s" : ""}</summary><ul>${more.map(li).join("")}</ul></details>` : ""}</div>` : ""}
        <dl class="bk-meta">${b.deadline ? `<div><dt>Last date</dt><dd>${fmtDate(b.deadline)}</dd></div>` : ""}${b.publisher ? `<div><dt>Publisher</dt><dd>${esc(b.publisher)}</dd></div>` : ""}${b.fee ? `<div><dt>Author fee</dt><dd>${esc(b.fee)}</dd></div>` : ""}</dl>
        ${open ? `<div class="btn-row"><a class="btn btn-primary" href="${esc(apply)}"${ext}>Apply as author</a>${b.brochure ? `<a class="btn btn-ghost" href="${esc(media(b.brochure))}" target="_blank" rel="noopener">Details (PDF)</a>` : ""}</div>` : ""}
      </div>
    </article>`;
  }
  function booksPage(all) {
    const root = $("#list");
    if (!root) return;
    const list = [...all].sort((a, b) => bookOpen(b) - bookOpen(a));
    const soon = list.some(bookOpen) ? "" : `<div class="bk-soon" style="display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin:0 0 24px;padding:20px 22px;border-radius:20px;border:1px solid color-mix(in srgb,var(--teal) 35%,var(--line));background:linear-gradient(120deg,color-mix(in srgb,var(--primary) 9%,var(--surface)),color-mix(in srgb,var(--teal) 11%,var(--surface)))"><span aria-hidden="true" style="font-size:2rem;line-height:1">📚</span><div style="flex:1 1 260px"><strong style="display:block;font-family:var(--font-display);font-size:1.25rem">Next book coming soon</strong><span class="muted">All current chapter calls are closed. Register your interest and we will tell you first when the next book opens.</span></div><a class="btn btn-primary" href="contact.html?service=${encodeURIComponent("Book chapter authorship")}">Register interest</a></div>`;
    root.innerHTML = list.length ? `${soon}<div class="bk-list">${list.map(bookCard).join("")}</div>` : `<div class="empty"><strong>No open calls right now</strong>New book projects will be announced here. <a href="contact.html">Send an enquiry</a> to be told first.</div>`;
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
  }

  // ---------- Research papers: call for co-authors ----------
  function daysLeft(deadline) {
    if (!deadline) return "";
    const end = new Date(deadline + "T23:59:59"), now = new Date();
    if (isNaN(end)) return "";
    const d = Math.floor((end - now) / 864e5);
    const txt = d <= 0 ? "Closes today" : d === 1 ? "Last day tomorrow" : d <= 14 ? `${d} days left` : "";
    return txt ? `<span class="bk-urgent">${txt}</span>` : "";
  }
  function paperCard(p) {
    const open = bookOpen(p);
    const roles = String(p.roles || "").split(/\n+/).map((x) => x.replace(/^\s*[-•*\d.)]+\s*/, "").trim()).filter(Boolean);
    const NOT_INDEX = /^(researchgate|academia\.edu|orcid|and other)/i;
    const idx = (Array.isArray(p.indexing) ? p.indexing : String(p.indexing || "").split(",")).map((x) => String(x).trim()).filter((x) => x && !NOT_INDEX.test(x));
    const apply = p.apply_link ? safeUrl(p.apply_link) : `contact.html?service=${encodeURIComponent("Research collaboration")}&paper=${encodeURIComponent(p.title)}`;
    const ext = /^https?:/i.test(apply) ? ' target="_blank" rel="noopener"' : "";
    const img = p.image ? `<img src="${esc(media(p.image))}" alt="Poster: ${esc(p.title)}" loading="lazy">` : `<span class="bk-fallback"><span>${esc(p.field || "Research paper")}</span></span>`;
    const tags = [p.study_type, p.field].filter(Boolean);
    return `<article class="bk-card pp-card" id="${esc(p._id)}">
      <div class="bk-cover pp-img">${img}</div>
      <div class="bk-body">
        <div class="bk-flags"><span class="bk-status ${open ? "is-open" : "is-closed"}">${open ? "Collaborators wanted" : "Closed"}</span>${open ? daysLeft(p.deadline) : ""}</div>
        <h3>${esc(p.title)}</h3>
        ${tags.length ? `<p class="bk-sub">${tags.map(esc).join(" · ")}</p>` : ""}
        ${p.description ? `<p class="bk-desc">${esc(p.description)}</p>` : ""}
        ${roles.length ? `<div class="bk-ch"><strong>Contributor roles open</strong><ul>${roles.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        ${p.requirements ? `<p class="bk-desc"><strong>Who can apply:</strong> ${esc(p.requirements)}</p>` : ""}
        ${idx.length ? `<div class="idx-row">${idx.map((x) => `<span class="idx idx-${slug(x)}">${esc(x)}</span>`).join("")}</div>` : ""}
        <dl class="bk-meta">${p.authors_needed ? `<div><dt>Collaborators needed</dt><dd>${esc(p.authors_needed)}</dd></div>` : ""}${p.target_journal ? `<div><dt>Target journal</dt><dd>${esc(p.target_journal)}</dd></div>` : ""}${p.status ? `<div><dt>Stage</dt><dd>${esc(p.status)}</dd></div>` : ""}${p.deadline ? `<div><dt>Last date</dt><dd>${fmtDate(p.deadline)}</dd></div>` : ""}${p.fee ? `<div><dt>Author fee</dt><dd>${esc(p.fee)}</dd></div>` : ""}</dl>
        ${open ? `<p class="collab-note">Authorship requires real contribution and approval of the final manuscript (ICMJE criteria).</p>` : ""}
        ${open ? `<div class="btn-row"><a class="btn btn-primary" href="${esc(apply)}"${ext}>Apply to collaborate</a>${p.details_pdf ? `<a class="btn btn-ghost" href="${esc(media(p.details_pdf))}" target="_blank" rel="noopener">Details (PDF)</a>` : ""}</div>` : ""}
      </div>
    </article>`;
  }
  function papersPage(all) {
    const root = $("#list");
    if (!root) return;
    const list = [...all].filter(bookOpen);
    root.innerHTML = list.length ? `<div class="bk-list">${list.map(paperCard).join("")}</div>` : collabInvite();
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
  }

  function collabInvite() {
    return `<div class="empty collab-empty"><strong>New studies are being planned</strong>Register your interest to join our next study from day one &mdash; tell us your field, your institution and how you would like to contribute.<div class="btn-row" style="justify-content:center;margin-top:14px"><a class="btn btn-primary" href="contact.html?service=${encodeURIComponent("Research collaboration")}">Register interest</a></div></div>`;
  }
  function empty(what, hint) {
    return `<div class="empty"><strong>No ${what} yet</strong>${hint || "New items appear here as soon as they are published."}</div>`;
  }

  // ---------- Lightbox ----------
  function lightbox() {
    let dlg = $("dialog.lightbox");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "lightbox";
      dlg.innerHTML = `<button class="close" type="button" aria-label="Close">×</button><img alt=""><div class="cap"></div>`;
      document.body.append(dlg);
      $(".close", dlg).addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    }
    return (src, cap) => { $("img", dlg).src = src; $("img", dlg).alt = cap || ""; $(".cap", dlg).textContent = cap || ""; dlg.showModal(); };
  }

  // ---------- Listing page (search + category chips) ----------
  function listing({ items, mount, card, noun, gridClass = "grid grid-3", chipsOf = (i) => [i.category || i.album] }) {
    const root = $(mount);
    if (!root) return;
    const cats = [...new Set(items.flatMap((i) => chipsOf(i)).filter(Boolean))].sort();
    root.innerHTML = `
      <div class="toolbar">
        <label class="search">${ICON.search}<span class="sr-only">Search ${noun}</span><input id="q" type="search" placeholder="Search ${noun}…"></label>
        ${cats.length > 0 && items.length > 1 ? `<div class="chips" role="group" aria-label="Filter by category"><button class="chip" aria-pressed="true" data-cat="">All</button>${cats.map((c) => `<button class="chip" aria-pressed="false" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}
      </div>
      <div class="${gridClass}" id="results"></div>`;
    let cat = "", q = "";
    const draw = () => {
      const f = items.filter((i) => (!cat || chipsOf(i).includes(cat)) && (!q || JSON.stringify(i).toLowerCase().includes(q)));
      $("#results", root).innerHTML = f.length ? f.map(card).join("") : items.length ? `<div class="empty"><strong>No matches</strong>Try a different search or category.</div>` : empty(noun);
      if (noun === "photos") bindGallery(root, f);
    };
    $("#q", root).addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
    $$(".chip", root).forEach((b) => b.addEventListener("click", () => { cat = b.dataset.cat; $$(".chip", root).forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }));
    draw();
  }
  function galleryFigure(g, i) {
    return `<figure><button type="button" data-i="${i}" aria-label="View ${esc(g.title)}"><img src="${esc(media(g.image))}" alt="${esc(g.alt || g.title)}" loading="lazy"></button>${g.title ? `<figcaption>${esc(g.title)}${g.date ? ` · ${fmtDate(g.date)}` : ""}</figcaption>` : ""}</figure>`;
  }
  function bindGallery(root, list) {
    const open = lightbox();
    $$("button[data-i]", root).forEach((b) => b.addEventListener("click", () => { const g = list[+b.dataset.i]; open(media(g.image), [g.title, g.caption].filter(Boolean).join(" — ")); }));
  }

  // ---------- Pages ----------
  async function home(settings, data) {
    const s = settings;
    const setText = (sel, v) => { const el = $(sel); if (el && v) el.textContent = v; };
    setText("#hero-eyebrow", s.hero_eyebrow);
    setText("#hero-title", s.hero_title);
    setText("#hero-lead", s.hero_text);
    setText("#hero-sub", s.hero_text_2);
    const h1 = $("#hero-title");
    if (h1) { // colour the key phrase of the headline
      const t = h1.textContent, m = t.match(/research and publication/i);
      if (m) h1.innerHTML = esc(t.slice(0, m.index)) + `<span class="gt">${esc(m[0])}</span>` + esc(t.slice(m.index + m[0].length));
      else { const w = t.trim().split(/\s+/); if (w.length > 3) h1.innerHTML = esc(w.slice(0, -2).join(" ")) + ` <span class="gt">${esc(w.slice(-2).join(" "))}</span>`; }
    }
    const { videos, notes, highlights, gallery, updates } = data;
    const showVideos = s.show_videos === true;
    const hide = (id) => { const el = $(id); if (el) el.hidden = true; };

    // Latest feed (only when there is something to show)
    const tagFor = { videos: ["tag-video", "Video"], notes: ["tag-note", "Notes"], highlights: ["tag-highlight", "Paper"], gallery: ["tag-gallery", "Photo"], updates: ["tag-update", "Update"] };
    const hrefFor = (it) => (it._c === "gallery" ? "gallery.html" : it._c === "updates" ? "updates.html#" + it._id : link(it._c, it));
    const mixed = [...(showVideos ? videos : []), ...notes, ...updates].sort(byDate).slice(0, 4);
    if (mixed.length && $("#latest-feed")) {
      $("#latest-feed").innerHTML = mixed.map((it) => `<a href="${hrefFor(it)}"><span class="tag ${tagFor[it._c][0]}">${tagFor[it._c][1]}</span><span class="t">${esc(it.title)}</span><span class="m">${fmtDate(it.date)}</span></a>`).join("");
    } else hide("#latest-wrap");

    const hl = [...highlights].sort(featuredFirst);
    const journals = [];
    hl.forEach((h) => { const k = h.journal_short || h.journal; if (k && !journals.some((j) => j.k === k)) journals.push({ k, logo: h.logo, name: h.journal }); });
    if (hl.length && $("#home-proof")) {
      const years = [...new Set(hl.map((h) => (String(h.date || "").match(/\d{4}/) || [""])[0]).filter(Boolean))].sort();
      const nSub = Number(s.papers_submitted) || 0, nPub = Number(s.papers_published) || hl.length;
      const stat = (n, suf, label) => `<div class="stat"><b><span data-count="${n}">${n}</span>${suf ? `<small>${suf}</small>` : ""}</b><span>${label}</span></div>`;
      $("#proof-stats").innerHTML = (nSub ? stat(nSub, "", "papers submitted") : "") + stat(nPub, "", "papers published") + stat(12, "+", "allied health domains") + stat(7, "+ yrs", "mentor experience each");
      const extra = (Array.isArray(s.also_published_in) ? s.also_published_in : []).filter((x) => x && x.name).map((x) => x.label || x.name);
      $("#proof-logos").innerHTML = journals.map((j) => `<a href="highlights.html" class="proof-logo" title="${esc(j.name || j.k)}">${j.logo ? `<img src="${esc(media(j.logo))}" alt="${esc(j.name || j.k)} logo" loading="lazy">` : `<span class="proof-txt proof-${slug(j.k)}">${esc(j.k)}</span>`}<small>${esc(j.k)}</small></a>`).join("")
        + (extra.length ? `<p class="proof-also">Team members have also published in ${extra.map((x) => `<b>${esc(x)}</b>`).join(" and ")} journals.</p>` : "");
    } else hide("#home-proof");
    if ($("#home-journals")) load("journals").then((js) => {
      if (!js.length) return hide("#home-journals");
      journalCarousel($("#home-journals-logos"), js);
    });
    if (hl.length) {
      $("#home-highlights").innerHTML = hl.slice(0, 4).map((h) => highlightCard(h)).join("");
    } else hide("#home-highlights-section");
    if (showVideos && videos.length) $("#home-videos").innerHTML = [...videos].sort(featuredFirst).slice(0, 3).map(videoCard).join("");
    else hide("#home-videos-section");
    if (notes.length) $("#home-notes").innerHTML = [...notes].sort(featuredFirst).slice(0, 3).map(noteCard).join("");
    else hide("#home-notes-section");
    const openBooks = (data.books || []).filter(bookOpen);
    if (openBooks.length && $("#home-books")) $("#home-books").innerHTML = `<div class="bk-list">${openBooks.slice(0, 2).map(bookCard).join("")}</div>`;
    else hide("#home-books-section");
    const openPapers = (data.papers || []).filter(bookOpen);
    if ($("#home-papers")) $("#home-papers").innerHTML = openPapers.length ? `<div class="bk-list">${openPapers.slice(0, 2).map(paperCard).join("")}</div>` : collabInvite();
    const waNum = String(s.whatsapp || "").replace(/\D/g, "");
    const ctaWa = $("#cta-wa");
    if (ctaWa) { if (waNum) { ctaWa.href = `https://wa.me/${waNum}?text=${encodeURIComponent("Hello ResearchMed Connect, I would like guidance with ")}`; ctaWa.target = "_blank"; ctaWa.rel = "noopener"; } else ctaWa.remove(); }
    if (gallery.length) {
      $("#home-gallery").innerHTML = gallery.slice(0, 6).map((g) => `<a href="gallery.html" aria-label="${esc(g.title)}"><img src="${esc(media(g.image))}" alt="${esc(g.alt || g.title)}" loading="lazy"></a>`).join("");
    } else hide("#home-gallery-section");
  }

  async function item() {
    const p = new URLSearchParams(location.search);
    const c = p.get("c"), id = p.get("id");
    const root = $("#item");
    if (!["videos", "notes", "highlights"].includes(c)) { root.innerHTML = empty("item found", "This link may be out of date. <a href='index.html'>Go to the home page</a>."); return; }
    const items = await load(c);
    const it = items.find((x) => x._id === id);
    const back = { videos: ["videos.html", "All videos"], notes: ["notes.html", "All notes"], highlights: ["highlights.html", "All publications"] }[c];
    if (!it) { $("#item-hero").innerHTML = "<h1>Not found</h1>"; root.innerHTML = `<a class="back" href="${back[0]}">← ${back[1]}</a><div class="empty" style="margin-top:20px"><strong>This item is no longer available</strong>It may have been renamed or removed.</div>`; return; }
    document.title = `${it.title} | ResearchMed Connect`;
    const meta = [];
    let main = "";
    if (c === "videos") {
      main = `${videoPlayer(it)}<div class="prose" style="margin-top:24px">${md(it.description)}</div>`;
      if (it.category) meta.push(["Topic", esc(it.category)]);
      if (it.duration) meta.push(["Duration", esc(it.duration)]);
      if (it.speaker) meta.push(["Presenter", esc(it.speaker)]);
      if (it.video_url) meta.push(["Source", `<a href="${esc(safeUrl(it.video_url))}" target="_blank" rel="noopener">Open original ↗</a>`]);
    } else if (c === "notes") {
      main = `${it.cover ? `<div class="detail-media"><img src="${esc(media(it.cover))}" alt=""></div>` : ""}
        ${it.summary ? `<p style="font-size:1.15rem;margin-top:20px">${esc(it.summary)}</p>` : ""}
        <div class="prose" style="margin-top:20px">${md(it.body)}</div>
        ${it.pdf && /\.pdf$/i.test(it.pdf) ? `<div style="margin-top:28px"><iframe src="${esc(media(it.pdf))}" title="${esc(it.title)} (PDF)" style="width:100%;height:80vh;border:1px solid var(--line);border-radius:12px"></iframe></div>` : ""}`;
      if (it.category) meta.push(["Subject", esc(it.category)]);
      if (it.pdf) meta.push(["File", `<a class="btn btn-primary btn-sm" href="${esc(media(it.pdf))}" target="_blank" rel="noopener" download>Download file</a>`]);
      if (it.link) meta.push(["Link", `<a href="${esc(safeUrl(it.link))}" target="_blank" rel="noopener">Open resource ↗</a>`]);
    } else {
      main = `${it.image ? `<div class="detail-media"><img src="${esc(media(it.image))}" alt=""></div>` : ""}
        ${it.summary ? `<div class="prose" style="margin-top:20px"><h2>Summary</h2>${md(it.summary)}</div>` : ""}
        ${findingsList(it) ? `<div class="prose" style="margin-top:20px"><h2>Key findings</h2>${findingsList(it)}</div>` : ""}
        ${it.body ? `<div class="prose" style="margin-top:20px">${md(it.body)}</div>` : ""}
        <div class="cta" style="margin-top:28px"><h2 style="font-size:1.5rem">Want to publish your research too?</h2><p>We guide you from study design to manuscript writing, journal selection and reviewer responses.</p><div class="btn-row"><a class="btn btn-primary" href="contact.html">Send an enquiry</a></div></div>`;
      if (it.journal) meta.push(["Journal", esc(it.journal)]);
      if (it.year || it.volume) meta.push(["Published", esc([it.year, it.volume].filter(Boolean).join(", "))]);
      if (it.study_type) meta.push(["Study type", esc(it.study_type)]);
      if (indexList(it).length) meta.push(["Recognition", esc(indexList(it).join(", "))]);
      if (it.doi) meta.push(["DOI", `<a class="doi" href="${esc(doiHref(it.doi))}" target="_blank" rel="noopener">${esc(String(it.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, ""))}</a>`]);
      if (it.url) meta.push(["Full text", `<a class="btn btn-primary btn-sm" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener">Read the paper ↗</a>`]);
      if (it.pdf) meta.push(["PDF", `<a class="btn btn-primary btn-sm" href="${esc(media(it.pdf))}" target="_blank" rel="noopener">Download PDF</a>`]);
    }
    meta.unshift(["Date", fmtDate(it.date)]);
    const tag = { videos: '<span class="tag tag-video">Video lecture</span>', notes: '<span class="tag tag-note">Notes</span>', highlights: '<span class="tag tag-highlight">Published research</span>' }[c];
    $("#item-hero").innerHTML = `<a class="back" href="${back[0]}">← ${back[1]}</a>${tag}<h1>${esc(it.title)}</h1>${c === "highlights" && citeLine(it) ? `<p class="cite-line" style="font-size:1rem">${citeLine(it)}</p>` : ""}${c === "highlights" ? indexBadges(it) : ""}${c === "highlights" && it.logo ? `<img class="pub-logo pub-logo-lg" src="${esc(media(it.logo))}" alt="${esc(it.journal_short || it.journal || "")} logo">` : ""}`;
    root.innerHTML = `<div class="detail"><div style="min-width:0">${main}</div>
      <aside><dl>${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <button class="btn btn-ghost btn-sm" type="button" id="share">Copy link</button></aside></div>`;
    $("#share").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(location.href); e.target.textContent = "Link copied"; } catch (err) { e.target.textContent = "Copy from the address bar"; }
    });
  }

  async function updatesPage() {
    const ups = await load("updates");
    $("#updates").innerHTML = ups.length
      ? ups.map((u) => `<article class="update" id="${esc(u._id)}"><time datetime="${esc(u.date)}">${fmtDate(u.date)}</time><div><h3>${esc(u.title)}</h3><div class="prose">${md(u.body)}</div>${u.link ? `<p style="margin-top:8px"><a href="${esc(safeUrl(u.link))}" target="_blank" rel="noopener">Read more ↗</a></p>` : ""}</div></article>`).join("")
      : empty("updates");
  }

  function contactForm(settings) {
    const f = $("#contact-form");
    if (!f) return;
    const status = $("#form-status");
    const btn = $("button[type=submit]", f);
    const qs = new URLSearchParams(location.search);
    const sel = $("#c-service", f), want = qs.get("service");
    if (sel && want && [...sel.options].some((o) => o.text === want)) sel.value = want;
    if (qs.get("book") && $("#c-msg", f)) $("#c-msg", f).value = `I would like to contribute a chapter to the book "${qs.get("book")}".\n\nPreferred chapter: \nMy qualification / designation: \nInstitution: `;
    if (qs.get("paper") && $("#c-msg", f)) $("#c-msg", f).value = `I would like to collaborate on the study "${qs.get("paper")}".\n\nHow I can contribute (literature review / data collection / analysis / writing): \nMy qualification / designation: \nInstitution: `;
    // Enquiries are emailed straight to the ResearchMed inbox via FormSubmit (no Google Form).
    // FormSubmit also sends the visitor an automatic thank-you reply.
    const INBOX = "info@researchmed.in";
    const ENDPOINT = "https://formsubmit.co/ajax/" + INBOX;
    const wa = (settings.whatsapp || "").replace(/\D/g, "");
    const waLink = (d) => `https://wa.me/${wa}?text=${encodeURIComponent(`Hello ResearchMed Connect,\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone || "-"}\nNeed help with: ${d.service}\n\n${d.message}`)}`;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (d._honey) return;
      btn.disabled = true; btn.textContent = "Sending…";
      status.hidden = true;
      const ref = "RMC-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const first = String(d.name || "").trim().split(/\s+/)[0] || "there";
      const payload = {
        "Reference": ref,
        "Name": d.name, "Phone / WhatsApp": d.phone || "-",
        "Qualification / designation": d.qualification || "-", "Institution": d.institution || "-",
        "Needs help with": d.service, "Preferred reply via": d.reply_via || "Email",
        "Message": d.message, "Sent from page": location.href,
        email: d.email,
        _subject: `New enquiry ${ref}: ${d.service} from ${d.name}`,
        _template: "table", _captcha: "false",
        _autoresponse: `Dear ${first},\n\nThank you for contacting ResearchMed Connect. We have received your enquiry about "${d.service}" (reference ${ref}).\n\nOur team will get back to you within one to two working days.${wa ? ` For anything urgent, you can WhatsApp us at ${settings.whatsapp}.` : ""}\n\nWarm regards,\nResearchMed Connect\nResearch. Learn. Publish. Grow.\nhttps://researchmed.in`
      };
      try {
        const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) !== "true") throw new Error(j.message || "send failed");
        f.hidden = true;
        status.className = "form-status ok";
        status.innerHTML = `<strong>Thank you, ${esc(first)}!</strong> Your enquiry has reached us (reference <b>${ref}</b>). A confirmation has been sent to ${esc(d.email)} — please check your spam folder if you don't see it. We usually reply within one to two working days.${wa ? `<div class="btn-row" style="margin-top:12px"><a class="btn btn-ghost btn-sm" href="${waLink(d)}" target="_blank" rel="noopener">Need it faster? WhatsApp us</a></div>` : ""}`;
        status.hidden = false;
      } catch (err) {
        status.className = "form-status err";
        status.innerHTML = `<strong>We couldn't send this just now.</strong> Please send the same message on WhatsApp or email instead. It only takes one tap.<div class="btn-row" style="margin-top:12px">${wa ? `<a class="btn btn-primary" href="${waLink(d)}" target="_blank" rel="noopener">Send on WhatsApp</a>` : ""}<a class="btn btn-ghost" href="mailto:${INBOX}?subject=${encodeURIComponent("Enquiry: " + d.service)}&body=${encodeURIComponent(d.message || "")}">Send by email</a></div>`;
        status.hidden = false;
        btn.disabled = false; btn.textContent = "Send enquiry";
      }
    });
  }

  // ---------- Journal carousel (one journal at a time, auto-rotating) ----------
  function journalCarousel(box, js) {
    if (!box || !js.length) return;
    box.className = "jr-carousel";
    box.setAttribute("role", "region"); box.setAttribute("aria-roledescription", "carousel"); box.setAttribute("aria-label", "Indexed Indian journals");
    box.innerHTML = `
      <button class="jr-nav jr-prev" type="button" aria-label="Previous journal">‹</button>
      <div class="jr-stage" aria-live="off"></div>
      <button class="jr-nav jr-next" type="button" aria-label="Next journal">›</button>
      <div class="jr-meta"><span class="jr-count"></span><button class="jr-pause" type="button" aria-label="Pause rotation">❚❚</button></div>
      <div class="jr-bar" aria-hidden="true"><span></span></div>`;
    const stage = $(".jr-stage", box), count = $(".jr-count", box), pauseBtn = $(".jr-pause", box), bar = $(".jr-bar span", box);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DELAY = 3500;
    let i = 0, timer = null, userPaused = reduce, hovering = false;
    const slide = (j) => {
      const u = safeUrl(j.url);
      const mark = j.logo ? `<img src="${esc(media(j.logo))}" alt="${esc(j.short || j.title)} logo" loading="lazy">` : `<span class="jr-abbr">${esc(j.short || j.title)}</span>`;
      const body = `<span class="jr-mark">${mark}</span><span class="jr-text"><b>${esc(j.title)}</b><small>${esc(j.short || "")}${u ? " · Visit journal ↗" : ""}</small></span>`;
      return u ? `<a class="jr-card" href="${esc(u)}" target="_blank" rel="noopener">${body}</a>` : `<div class="jr-card">${body}</div>`;
    };
    const show = (n) => {
      i = (n + js.length) % js.length;
      stage.innerHTML = slide(js[i]);
      count.textContent = `${i + 1} / ${js.length}`;
      bar.style.animation = "none"; void bar.offsetWidth;
      bar.style.animation = running() ? `jr-fill ${DELAY}ms linear` : "none";
    };
    const running = () => !userPaused && !hovering && !document.hidden;
    const schedule = () => { clearTimeout(timer); if (running()) timer = setTimeout(() => show(i + 1) || schedule(), DELAY); };
    const restart = () => { show(i); schedule(); };
    $(".jr-prev", box).addEventListener("click", () => { show(i - 1); schedule(); });
    $(".jr-next", box).addEventListener("click", () => { show(i + 1); schedule(); });
    pauseBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      pauseBtn.textContent = userPaused ? "▶" : "❚❚";
      pauseBtn.setAttribute("aria-label", userPaused ? "Play rotation" : "Pause rotation");
      stage.setAttribute("aria-live", userPaused ? "polite" : "off");
      restart();
    });
    box.addEventListener("mouseenter", () => { hovering = true; restart(); });
    box.addEventListener("mouseleave", () => { hovering = false; restart(); });
    box.addEventListener("focusin", () => { hovering = true; restart(); });
    box.addEventListener("focusout", (e) => { if (!box.contains(e.relatedTarget)) { hovering = false; restart(); } });
    document.addEventListener("visibilitychange", restart);
    let x0 = null;
    box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); schedule(); } x0 = null; });
    if (reduce) { pauseBtn.textContent = "▶"; pauseBtn.setAttribute("aria-label", "Play rotation"); stage.setAttribute("aria-live", "polite"); }
    restart();
  }

  // ---------- Feedback / testimonial form ----------
  function feedbackForm() {
    const f = $("#feedback-form"); if (!f) return;
    const status = $("#form-status"), btn = $("button[type=submit]", f);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (d._honey) return;
      btn.disabled = true; btn.textContent = "Sending…"; status.hidden = true;
      const first = String(d.name || "").trim().split(/\s+/)[0] || "there";
      const payload = {
        "Name": d.name, "Qualification / designation": d.role || "-", "Institution": d.institution || "-",
        "Guidance received": d.service, "Rating": (d.rating || "-") + " / 5", "Feedback": d.message,
        "OK to publish on website": d.consent === "yes" ? "YES" : "No (do not publish)",
        email: d.email,
        _subject: `New testimonial (${d.rating}/5) from ${d.name}${d.consent === "yes" ? " · OK to publish" : ""}`,
        _template: "table", _captcha: "false",
        _autoresponse: `Dear ${first},\n\nThank you for sharing your experience with ResearchMed Connect. Your feedback means a lot to us and helps other students and professionals.\n\nWarm regards,\nResearchMed Connect\nhttps://researchmed.in`,
      };
      try {
        const r = await fetch("https://formsubmit.co/ajax/info@researchmed.in", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) !== "true") throw new Error("failed");
        f.hidden = true; status.className = "form-status ok";
        status.innerHTML = `<strong>Thank you, ${esc(first)}!</strong> Your feedback has reached us. We really appreciate you taking the time.`;
        status.hidden = false;
      } catch (err) {
        status.className = "form-status err";
        status.innerHTML = `<strong>We couldn't send this just now.</strong> Please try again in a moment, or email it to <a href="mailto:info@researchmed.in">info@researchmed.in</a>.`;
        status.hidden = false; btn.disabled = false; btn.textContent = "Send feedback";
      }
    });
  }

  // ---------- Hero trust strip (from real testimonials) ----------
  function heroTrust(all) {
    const box = $("#hero-trust");
    if (!box) return;
    const list = (all || []).filter((t) => t.quote && t.consent !== false);
    if (list.length < 2) return;
    const initials = (n) => String(n || "").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    const insts = [...new Set(list.map((t) => String(t.institution || "").split(",")[0].trim()).filter(Boolean))];
    box.innerHTML = `<div class="av-stack">${list.slice(0, 5).map((t) => `<a href="#home-testimonials-section" data-t="${esc(t.title)}" title="Read what ${esc(t.title)} said" aria-label="Read what ${esc(t.title)} said">${t.photo ? `<img src="${esc(media(t.photo))}" alt="" loading="lazy">` : `<span>${esc(initials(t.title))}</span>`}</a>`).join("")}</div>
      <p><a class="ht-link" href="#home-testimonials-section"><b>Guided faculty &amp; students</b> from ${insts.slice(0, 3).map(esc).join(", ")}${insts.length > 3 ? " and more" : ""} <span class="ht-cta">Read what they say&nbsp;→</span></a></p>`;
    box.addEventListener("click", (e) => {
      const a = e.target.closest("a[href='#home-testimonials-section']");
      if (!a) return;
      const sec = $("#home-testimonials-section");
      if (!sec || sec.hidden) return;
      e.preventDefault();
      sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      document.dispatchEvent(new CustomEvent("rmc:show-testimonial", { detail: a.dataset.t || "" }));
    });
    box.hidden = false;
  }

  // ---------- Testimonials (home page): cinematic, name + designation only ----------
  function testimonials(all) {
    const sec = $("#home-testimonials-section"), grid = $("#home-testimonials");
    if (!sec || !grid) return;
    const list = (all || []).filter((t) => t.quote && t.consent !== false)
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || byDate(a, b));
    if (!list.length) { sec.hidden = true; return; }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = (q) => String(q).trim().split(/\s+/);
    const slides = list.map((t, k) => {
      const w = words(t.quote), who = [t.role, t.institution].filter(Boolean).map(esc).join(", ");
      return `<figure class="tc-slide" data-k="${k}" aria-roledescription="slide" aria-label="${k + 1} of ${list.length}" style="--n:${w.length}">
        <blockquote>${w.map((x, i) => `<span class="w" style="--i:${i}">${esc(x)}</span>`).join(" ")}</blockquote>
        <figcaption><b>${esc(t.title)}</b>${who ? `<small>${who}</small>` : ""}</figcaption>
      </figure>`;
    });
    grid.className = "tc-wrap";
    grid.setAttribute("role", "region"); grid.setAttribute("aria-roledescription", "carousel"); grid.setAttribute("aria-label", "Testimonials");
    grid.innerHTML = `<span class="tc-mark" aria-hidden="true">&ldquo;</span>
      <div class="tc-stage" aria-live="polite">${slides.join("")}</div>
      <div class="tc-ctrl">
        <button class="tc-btn tc-prev" type="button" aria-label="Previous testimonial">‹</button>
        <div class="tc-segs">${list.map((_, k) => `<button type="button" class="tc-seg" aria-label="Show testimonial ${k + 1}"><span><i></i></span></button>`).join("")}</div>
        <button class="tc-btn tc-next" type="button" aria-label="Next testimonial">›</button>
        <button class="tc-btn tc-pause" type="button" aria-label="Pause testimonials">❚❚</button>
      </div>
      <a class="tc-share" href="feedback.html">Guided by us? Share your experience</a>`;
    const els = [...grid.querySelectorAll(".tc-slide")], segs = [...grid.querySelectorAll(".tc-seg")], pauseBtn = $(".tc-pause", grid);
    const n = els.length;
    let cur = 0, timer = null, userPaused = reduce, hovering = false;
    const delayFor = (k) => Math.min(13000, 3800 + words(list[k].quote).length * 170);
    const running = () => n > 1 && !userPaused && !hovering && !document.hidden;
    const paint = () => {
      els.forEach((e, k) => { const on = k === cur; e.classList.toggle("on", on); e.setAttribute("aria-hidden", on ? "false" : "true"); if (on) e.removeAttribute("inert"); else e.setAttribute("inert", ""); });
      segs.forEach((g, k) => {
        g.classList.toggle("done", k < cur); g.classList.toggle("on", k === cur); g.setAttribute("aria-current", k === cur ? "true" : "false");
        const i = $("i", g); i.style.animation = "none"; void i.offsetWidth;
        if (k === cur && running()) { i.style.transform = "scaleX(0)"; i.style.animation = `tcFill ${delayFor(k)}ms linear forwards`; } else { i.style.animation = ""; i.style.transform = k <= cur ? "scaleX(1)" : "scaleX(0)"; }
      });
    };
    const schedule = () => { clearTimeout(timer); if (running()) timer = setTimeout(() => go(cur + 1), delayFor(cur)); };
    const go = (to) => { cur = (to + n) % n; paint(); schedule(); };
    const hold = (on) => { hovering = on; paint(); schedule(); };
    $(".tc-prev", grid).addEventListener("click", () => go(cur - 1));
    $(".tc-next", grid).addEventListener("click", () => go(cur + 1));
    segs.forEach((g, k) => g.addEventListener("click", () => go(k)));
    pauseBtn.addEventListener("click", () => {
      userPaused = !userPaused;
      pauseBtn.textContent = userPaused ? "▶" : "❚❚";
      pauseBtn.setAttribute("aria-label", userPaused ? "Play testimonials" : "Pause testimonials");
      paint(); schedule();
    });
    const stage = $(".tc-stage", grid);
    stage.addEventListener("mouseenter", () => hold(true));
    stage.addEventListener("mouseleave", () => hold(false));
    grid.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); });
    document.addEventListener("visibilitychange", () => { paint(); schedule(); });
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    document.addEventListener("rmc:show-testimonial", (e) => {
      const k = list.findIndex((t) => t.title === e.detail);
      if (k >= 0) go(k);
      hold(true); setTimeout(() => hold(false), 15000);
    });
    if (n < 2) $(".tc-ctrl", grid).hidden = true;
    if (reduce) { pauseBtn.textContent = "▶"; pauseBtn.setAttribute("aria-label", "Play testimonials"); }
    paint(); schedule();
  }

  // ---------- Founder & Managing Director (home + about) ----------
  function founder(f) {
    const sec = $("#founder-section"), box = $("#founder");
    if (!sec || !box) return;
    f = f || {};
    if (f.show === false || !f.name) { sec.hidden = true; return; }
    const initials = String(f.name).replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    const paras = String(f.bio || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
    const hl = String(f.highlights || "").split(/\n+/).map((t) => t.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
    const tags = (Array.isArray(f.expertise) ? f.expertise : String(f.expertise || "").split(",")).map((t) => String(t).trim()).filter(Boolean);
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    const links = [["linkedin", "LinkedIn"], ["scholar", "Google Scholar"], ["orcid", "ORCID"], ["researchgate", "ResearchGate"]]
      .filter(([k]) => safeUrl(f[k])).map(([k, l]) => `<a class="btn btn-ghost btn-sm" href="${esc(safeUrl(f[k]))}" target="_blank" rel="noopener">${l} ↗</a>`);
    if (f.email) links.unshift(`<a class="btn btn-ghost btn-sm" href="mailto:${esc(f.email)}">Email</a>`);
    box.innerHTML = `
      <div class="fd-photo">${f.photo ? `<img src="${esc(media(f.photo))}" alt="${esc(f.name)}" loading="lazy">` : `<span class="fd-init" aria-hidden="true">${esc(initials)}</span>`}</div>
      <div class="fd-body">
        <span class="eyebrow">${esc(f.designation || "Founder & Managing Director")}</span>
        <h2 class="fd-name">${esc(f.name)}</h2>
        ${f.qualifications ? `<p class="fd-qual">${esc(f.qualifications)}</p>` : ""}
        ${f.position ? `<p class="fd-pos">${esc(f.position)}</p>` : ""}
        ${paras.map((t) => `<p class="fd-bio">${esc(t)}</p>`).join("")}
        ${hl.length ? `<ul class="ticks fd-hl">${hl.map((t) => `<li>${tick}${esc(t)}</li>`).join("")}</ul>` : ""}
        ${tags.length ? `<div class="fd-tags">${tags.map((t) => `<span class="fd-chip">${esc(t)}</span>`).join("")}</div>` : ""}
        ${f.message ? `<blockquote class="fd-msg">${esc(f.message)}</blockquote>` : ""}
        ${links.length ? `<div class="btn-row">${links.join("")}</div>` : ""}
      </div>`;
    sec.hidden = false;
  }

  // ---------- Contributors (home + about): cinematic 3D spotlight stage ----------
  function contributors(all) {
    const sec = $("#home-team-section"), grid = $("#home-team");
    if (!sec || !grid) return;
    const list = (all || []).filter((p) => p && p.title && p.draft !== true).sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    if (!list.length) { sec.hidden = true; return; }
    const more = $("#home-team-more"); if (more) more.hidden = true;
    const initials = (n) => String(n || "").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    const split = (role) => { const r = String(role || ""), i = r.indexOf(","); return i < 0 ? [r, ""] : [r.slice(0, i).trim(), r.slice(i + 1).trim().replace(/^Department of\s+/i, "")]; };
    const n = list.length, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    sec.classList.add("cf-sec");
    grid.removeAttribute("style");
    grid.className = "cf";
    grid.setAttribute("role", "region"); grid.setAttribute("aria-roledescription", "carousel"); grid.setAttribute("aria-label", "Contributors");
    grid.innerHTML = `<div class="cf-beam" aria-hidden="true"></div><div class="cf-stage">${list.map((p, k) => {
      const [desig, dept] = split(p.role);
      const pic = p.photo ? `<img src="${esc(media(p.photo))}" alt="${esc(p.title)}" loading="lazy" decoding="async">` : `<span class="cf-init" aria-hidden="true">${esc(initials(p.title))}</span>`;
      const link = p.link ? `<a class="cf-link" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener" aria-label="${esc(p.title)} profile">↗</a>` : "";
      return `<article class="cf-card" data-k="${k}" aria-roledescription="slide" aria-label="${k + 1} of ${n}: ${esc(p.title)}">
        <div class="cf-ring" aria-hidden="true"></div>
        <div class="cf-inner"><div class="cf-photo">${pic}<span class="cf-num" aria-hidden="true">${String(k + 1).padStart(2, "0")}</span>${link}</div>
          <div class="cf-info"><h3>${esc(p.title)}</h3>${desig ? `<p class="cf-desig">${esc(desig)}</p>` : ""}${dept ? `<p class="cf-dept">${esc(dept)}</p>` : ""}${p.institution ? `<p class="cf-inst">${esc(p.institution)}</p>` : ""}</div></div>
      </article>`;
    }).join("")}</div>
      <div class="cf-ctrl"><button type="button" class="cf-btn cf-prev" aria-label="Previous contributor">‹</button><span class="cf-count" aria-live="polite"><b>01</b> / ${String(n).padStart(2, "0")}</span><button type="button" class="cf-btn cf-next" aria-label="Next contributor">›</button></div>`;
    const cards = [...grid.querySelectorAll(".cf-card")], count = $(".cf-count b", grid), stage = $(".cf-stage", grid);
    let cur = 0, timer = null, hold = false, userStop = reduce;
    const place = () => {
      const wide = grid.clientWidth, step = wide < 560 ? 0.62 : wide < 900 ? 0.6 : 0.56;
      cards.forEach((c, k) => {
        let d = k - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        const a = Math.abs(d), vis = a <= (wide < 560 ? 1 : 3);
        c.style.transform = `translate(-50%,0) translateX(${d * step * 100}%) translateZ(${-a * 160}px) rotateY(${d === 0 ? 0 : d < 0 ? 38 : -38}deg) scale(${d === 0 ? 1 : 0.9})`;
        c.style.zIndex = String(100 - a);
        c.style.opacity = vis ? String(a === 0 ? 1 : Math.max(0.25, 0.75 - (a - 1) * 0.22)) : "0";
        c.style.pointerEvents = vis ? "" : "none";
        c.classList.toggle("on", d === 0);
        c.setAttribute("aria-hidden", d === 0 ? "false" : "true");
        c.tabIndex = vis ? 0 : -1;
      });
      count.textContent = String(cur + 1).padStart(2, "0");
    };
    const schedule = () => { clearTimeout(timer); if (!userStop && !hold && !document.hidden && n > 1) timer = setTimeout(() => go(cur + 1), 4200); };
    const go = (k) => { cur = (k + n) % n; place(); schedule(); };
    cards.forEach((c, k) => {
      c.addEventListener("click", (e) => { if (k !== cur) { e.preventDefault(); userStop = true; go(k); } });
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" && k !== cur) { userStop = true; go(k); } });
    });
    $(".cf-prev", grid).addEventListener("click", () => { userStop = true; go(cur - 1); });
    $(".cf-next", grid).addEventListener("click", () => { userStop = true; go(cur + 1); });
    grid.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { userStop = true; go(cur + 1); } if (e.key === "ArrowLeft") { userStop = true; go(cur - 1); } });
    stage.addEventListener("mouseenter", () => { hold = true; schedule(); });
    stage.addEventListener("mouseleave", () => { hold = false; schedule(); });
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { userStop = true; go(cur + (dx < 0 ? 1 : -1)); } x0 = null; });
    document.addEventListener("visibilitychange", schedule);
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => { hold = !e.isIntersecting; schedule(); }), { threshold: 0.3 }).observe(grid);
    window.addEventListener("resize", place);
    if (n < 2) $(".cf-ctrl", grid).hidden = true;
    place(); schedule();
  }

  // ---------- Scrolling notice ticker (top of home page) ----------
  function noticeBoard(all) {
    const today = new Date().toISOString().slice(0, 10);
    const items = (all || []).filter((n) => !n.expires || String(n.expires) >= today)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byDate(a, b));
    const header = $(".site-header");
    if (!items.length || !header) return;
    const one = (n) => {
      const txt = `${n.new ? '<span class="tk-new">New</span>' : ""}<span class="tk-title">${esc(n.title)}</span>${n.details ? `<span class="tk-details"> — ${esc(n.details)}</span>` : ""}`;
      return n.link ? `<a class="tk-item" href="${esc(safeUrl(n.link))}" ${/^https?:/i.test(n.link) ? 'target="_blank" rel="noopener"' : ""}>${txt}</a>` : `<span class="tk-item">${txt}</span>`;
    };
    const run = items.map(one).join('<span class="tk-sep" aria-hidden="true">✦</span>') + '<span class="tk-sep" aria-hidden="true">✦</span>';
    const bar = document.createElement("div");
    bar.className = "ticker";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Notice board");
    bar.innerHTML = `<span class="tk-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>Notice</span>
      <div class="tk-viewport"><div class="tk-track"><div class="tk-run">${run}</div><div class="tk-run" aria-hidden="true">${run}</div></div></div>`;
    header.append(bar);
    const track = $(".tk-track", bar), first = $(".tk-run", bar);
    const speed = 70; // pixels per second
    const set = () => { track.style.animationDuration = Math.max(12, first.scrollWidth / speed) + "s"; };
    set(); window.addEventListener("resize", set);
  }

  // ---------- Boot ----------
  (async function boot() {
    const names = ["videos", "notes", "highlights", "gallery", "updates", "notices", "contributors", "books", "testimonials", "papers"];
    const [settings, ...lists] = await Promise.all(["settings", ...names].map(load));
    const data = {}; names.forEach((n, i) => (data[n] = lists[i]));
    const counts = {}; names.forEach((n) => (counts[n] = data[n].length));
    renderLayout(settings, counts);
    if (PAGE === "home" || PAGE === "about") load("founder").then(founder);
    if (PAGE === "home") { home(settings, data); noticeBoard(data.notices); testimonials(data.testimonials); heroTrust(data.testimonials); }
    if (PAGE === "about" || PAGE === "home") contributors(data.contributors);
    requestAnimationFrame(() => setTimeout(enhance, 60));
    if (PAGE === "videos") {
      if (settings.show_videos === true) listing({ items: data.videos, mount: "#list", card: videoCard, noun: "videos" });
      else $("#list").innerHTML = `<div class="empty"><strong>Video sessions are available on request</strong>Tell us the topic you need and we will arrange a recorded or live session. <a href="contact.html">Send an enquiry</a>.</div>`;
    }
    if (PAGE === "notes") listing({ items: data.notes, mount: "#list", card: noteCard, noun: "notes" });
    if (PAGE === "highlights") listing({ items: data.highlights, mount: "#list", card: (h) => highlightCard(h), noun: "publications", chipsOf: indexList, gridClass: "grid grid-2" });
    if (PAGE === "gallery") listing({ items: data.gallery, mount: "#list", card: galleryFigure, noun: "photos", gridClass: "masonry" });
    if (PAGE === "updates") updatesPage();
    if (PAGE === "books") booksPage(data.books);
    if (PAGE === "papers") papersPage(data.papers);
    if (PAGE === "item") item();
    if (PAGE === "contact") contactForm(settings);
    if (PAGE === "feedback") feedbackForm();
  })();

  // ---------- Accessibility: keep heading levels in order (h1 → h2 → h3) ----------
  function fixHeadingOrder() {
    const main = document.getElementById("main"); if (!main) return;
    const LABEL = { services: "Our services", books: "Books and chapter calls", papers: "Open research papers", highlights: "Published papers", notes: "All notes", updates: "Latest updates", videos: "Videos", gallery: "Photos" };
    const hs = [...main.querySelectorAll("h1, h2, h3")];
    const i = hs.findIndex((h) => h.tagName === "H1");
    if (i < 0 || !hs[i + 1] || hs[i + 1].tagName !== "H3") return;
    const h2 = document.createElement("h2"); h2.className = "sr-only"; h2.textContent = LABEL[PAGE] || "Details";
    const sec = hs[i + 1].closest("section") || hs[i + 1].parentElement;
    const box = sec.querySelector(":scope > .wrap") || sec;
    box.prepend(h2);
  }
  // Content is drawn after data loads, so check once it has settled.
  window.addEventListener("load", () => setTimeout(fixHeadingOrder, 600));

  // ---------- Motion & polish: reveal on scroll, counters, header state, progress ----------
  function enhance() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const header = $(".site-header"), bar = $(".scroll-progress i");
    const onScroll = () => {
      const y = scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (bar) { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`; }
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const count = (el) => {
      const to = Number(el.dataset.count) || 0;
      if (reduce || to < 2) { el.textContent = to; return; }
      const t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    $$(".reveal-kids").forEach((g) => [...g.children].forEach((c, i) => { c.classList.add("reveal"); c.style.setProperty("--d", Math.min(i, 8) * 70 + "ms"); }));
    const targets = $$(".reveal, [data-count]");
    if (reduce || !("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("in")); return; }
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.dataset.count) count(e.target);
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
    // Content that arrives later (cards drawn from JSON) gets observed too.
    new MutationObserver(() => {
      $$(".reveal-kids").forEach((g) => [...g.children].forEach((c, i) => { if (!c.classList.contains("reveal")) { c.classList.add("reveal"); c.style.setProperty("--d", Math.min(i, 8) * 70 + "ms"); io.observe(c); } }));
      $$("[data-count]:not(.in)").forEach((el) => io.observe(el));
    }).observe(document.getElementById("main") || document.body, { childList: true, subtree: true });
  }

  // ---------- Chat assistant (every public page) ----------
  if (PAGE !== "admin") {
    const sc = document.createElement("script");
    sc.src = "assets/js/bot.js?v=20261003b"; sc.defer = true;
    document.body.append(sc);
  }
})();
/* Visitor analytics (GoatCounter: no cookies) + live visitor count in the footer. Set the code in Admin > Numbers & contact. */
(function () {
  var page = document.body.dataset.page || "";
  if (page === "admin" || /^(localhost|127\.)/.test(location.hostname)) return;
  fetch("content/settings.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (s) {
    var code = String(s.goatcounter || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\.goatcounter\.com.*$/, "");
    if (!/^[a-z0-9-]+$/.test(code)) return;
    var base = "https://" + code + ".goatcounter.com";
    var gc = document.createElement("script");
    gc.async = true; gc.src = "https://gc.zgo.at/count.js"; gc.setAttribute("data-goatcounter", base + "/count");
    document.body.appendChild(gc);
    if (s.show_visitors === false) return;
    fetch(base + "/counter/TOTAL.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.count) return;
      var tries = 0;
      (function put() {
        var fb = document.querySelector(".site-footer .foot-bottom");
        if (!fb) { if (++tries < 40) setTimeout(put, 250); return; }
        if (fb.querySelector(".visit-count")) return;
        var el = document.createElement("span");
        el.className = "visit-count";
        el.style.cssText = "display:inline-flex;align-items:center;gap:6px;font-weight:600";
        el.innerHTML = '<span aria-hidden="true" style="width:8px;height:8px;border-radius:50%;background:#2bb3a3;box-shadow:0 0 0 4px rgba(43,179,163,.2)"></span>';
        el.appendChild(document.createTextNode(String(d.count).trim() + " visitors"));
        fb.appendChild(el);
      })();
    }).catch(function () {});
  });
})();
