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
      if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flushP(); flushL(); const n = Math.min(m[1].length + 1, 4); html += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
      if ((m = l.match(/^[-*•]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(m[1]); continue; }
      if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(m[1]); continue; }
      flushL(); para.push(l);
    }
    flushP(); flushL();
    return html;
  }
  const plain = (s, n = 180) => { s = String(s || "").replace(/[#*_\[\]()>-]/g, "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

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
      ["papers.html", "Join a Paper", "papers", n.papers > 0],
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
          ${NAV.map(([h, t, k]) => `<a href="${h}" ${k === PAGE ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
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
    footer.innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div class="foot-brand">
            <span class="brand-name">${esc(s.site_name || "ResearchMed Connect")}</span>
            <span>${esc(s.tagline || "Research. Learn. Publish. Grow.")}</span>
            <p>${esc(s.footer_about || "Educational and academic guidance for healthcare professionals, students, researchers, and aspiring authors.")}</p>
          </div>
          <div><h4>Explore</h4><ul>
            ${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
          <div><h4>Get in touch</h4><ul>
            <li><a href="contact.html">Send an enquiry</a></li><li><a href="services.html">Our services</a></li><li><a href="disclaimer.html">Disclaimer</a></li></ul></div>
          <div><h4>Connect</h4><ul>
            ${email ? `<li>Email: <a href="mailto:${esc(email)}">${esc(email)}</a></li>` : ""}
            ${wa ? `<li>WhatsApp: <a href="https://wa.me/${esc(wa.replace(/\D/g, ""))}" target="_blank" rel="noopener">${esc(wa)}</a></li>` : ""}
            ${s.youtube_channel ? `<li><a href="${esc(safeUrl(s.youtube_channel))}" target="_blank" rel="noopener">YouTube channel ↗</a></li>` : ""}
            ${s.linkedin ? `<li><a href="${esc(safeUrl(s.linkedin))}" target="_blank" rel="noopener">LinkedIn ↗</a></li>` : ""}
          </ul></div>
        </div>
        <div class="foot-bottom">
          <span>© ${new Date().getFullYear()} ${esc(s.site_name || "ResearchMed Connect")}. All rights reserved.</span>
          <span>Educational and editorial guidance only — no guarantee of publication.</span>
        </div>
      </div>`;
    document.body.append(footer);
    if (wa && PAGE !== "contact") {
      const fab = document.createElement("a");
      fab.className = "wa-fab";
      fab.href = "https://wa.me/" + wa.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hello ResearchMed Connect, I would like guidance with ");
      fab.target = "_blank"; fab.rel = "noopener";
      fab.setAttribute("aria-label", "Chat with us on WhatsApp");
      fab.innerHTML = ICON.wa + "<span>Chat with us</span>";
      document.body.append(fab);
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
    root.innerHTML = list.length ? `<div class="bk-list">${list.map(bookCard).join("")}</div>` : `<div class="empty"><strong>No open calls right now</strong>New book projects will be announced here. <a href="contact.html">Send an enquiry</a> to be told first.</div>`;
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
  }

  // ---------- Research papers: call for co-authors ----------
  function paperCard(p) {
    const open = bookOpen(p);
    const roles = String(p.roles || "").split(/\n+/).map((x) => x.replace(/^\s*[-•*\d.)]+\s*/, "").trim()).filter(Boolean);
    const idx = (Array.isArray(p.indexing) ? p.indexing : String(p.indexing || "").split(",")).map((x) => String(x).trim()).filter(Boolean);
    const apply = p.apply_link ? safeUrl(p.apply_link) : `contact.html?service=${encodeURIComponent("Publication guidance")}&paper=${encodeURIComponent(p.title)}`;
    const ext = /^https?:/i.test(apply) ? ' target="_blank" rel="noopener"' : "";
    const img = p.image ? `<img src="${esc(media(p.image))}" alt="" loading="lazy">` : `<span class="bk-fallback"><span>${esc(p.field || "Research paper")}</span></span>`;
    const tags = [p.study_type, p.field].filter(Boolean);
    return `<article class="bk-card pp-card" id="${esc(p._id)}">
      <div class="bk-cover pp-img">${img}</div>
      <div class="bk-body">
        <span class="bk-status ${open ? "is-open" : "is-closed"}">${open ? "Authors wanted" : "Closed"}</span>
        <h3>${esc(p.title)}</h3>
        ${tags.length ? `<p class="bk-sub">${tags.map(esc).join(" · ")}</p>` : ""}
        ${p.description ? `<p class="bk-desc">${esc(p.description)}</p>` : ""}
        ${roles.length ? `<div class="bk-ch"><strong>Author positions open</strong><ul>${roles.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        ${p.requirements ? `<p class="bk-desc"><strong>Who can apply:</strong> ${esc(p.requirements)}</p>` : ""}
        ${idx.length ? `<div class="idx-row">${idx.map((x) => `<span class="idx idx-${slug(x)}">${esc(x)}</span>`).join("")}</div>` : ""}
        <dl class="bk-meta">${p.authors_needed ? `<div><dt>Authors needed</dt><dd>${esc(p.authors_needed)}</dd></div>` : ""}${p.target_journal ? `<div><dt>Target journal</dt><dd>${esc(p.target_journal)}</dd></div>` : ""}${p.status ? `<div><dt>Stage</dt><dd>${esc(p.status)}</dd></div>` : ""}${p.deadline ? `<div><dt>Last date</dt><dd>${fmtDate(p.deadline)}</dd></div>` : ""}${p.fee ? `<div><dt>Author fee</dt><dd>${esc(p.fee)}</dd></div>` : ""}</dl>
        ${open ? `<div class="btn-row"><a class="btn btn-primary" href="${esc(apply)}"${ext}>Apply as co-author</a>${p.details_pdf ? `<a class="btn btn-ghost" href="${esc(media(p.details_pdf))}" target="_blank" rel="noopener">Details (PDF)</a>` : ""}</div>` : ""}
      </div>
    </article>`;
  }
  function papersPage(all) {
    const root = $("#list");
    if (!root) return;
    const list = [...all].sort((a, b) => bookOpen(b) - bookOpen(a));
    root.innerHTML = list.length ? `<div class="bk-list">${list.map(paperCard).join("")}</div>` : `<div class="empty"><strong>No open calls right now</strong>New papers needing co-authors will be announced here. <a href="contact.html">Send an enquiry</a> to be told first.</div>`;
    if (location.hash) { const el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (el) el.scrollIntoView(); }
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
    const { videos, notes, highlights, gallery, updates } = data;
    const showVideos = s.show_videos === true;
    const hide = (id) => { const el = $(id); if (el) el.hidden = true; };

    // Latest feed (only when there is something to show)
    const tagFor = { videos: ["tag-video", "Video"], notes: ["tag-note", "Notes"], highlights: ["tag-highlight", "Paper"], gallery: ["tag-gallery", "Photo"], updates: ["tag-update", "Update"] };
    const hrefFor = (it) => (it._c === "gallery" ? "gallery.html" : it._c === "updates" ? "updates.html#" + it._id : link(it._c, it));
    const mixed = [...(showVideos ? videos : []), ...notes, ...updates].sort(byDate).slice(0, 4);
    if (mixed.length) {
      $("#latest-feed").innerHTML = mixed.map((it) => `<a href="${hrefFor(it)}"><span class="tag ${tagFor[it._c][0]}">${tagFor[it._c][1]}</span><span class="t">${esc(it.title)}</span><span class="m">${fmtDate(it.date)}</span></a>`).join("");
    } else hide("#latest-wrap");

    const hl = [...highlights].sort(featuredFirst);
    const journals = [];
    hl.forEach((h) => { const k = h.journal_short || h.journal; if (k && !journals.some((j) => j.k === k)) journals.push({ k, logo: h.logo, name: h.journal }); });
    if (hl.length && $("#home-proof")) {
      const years = [...new Set(hl.map((h) => (String(h.date || "").match(/\d{4}/) || [""])[0]).filter(Boolean))].sort();
      const nSub = Number(s.papers_submitted) || 0, nPub = Number(s.papers_published) || hl.length;
      $("#proof-stats").innerHTML = `${nSub ? `<div><b>${nSub}</b><span>papers submitted</span></div>` : ""}<div><b>${nPub}</b><span>papers published</span></div>${years.length ? `<div><b>${esc(years[years.length - 1])}</b><span>latest publication year</span></div>` : ""}`;
      const extra = (Array.isArray(s.also_published_in) ? s.also_published_in : []).filter((x) => x && x.name).map((x) => ({ k: x.name, logo: x.logo, name: x.label || x.name, cap: x.label || x.name }));
      const tiles = [...extra, ...journals];
      $("#proof-logos").innerHTML = tiles.map((j) => `<a href="highlights.html" class="proof-logo" title="${esc(j.name || j.k)}">${j.logo ? `<img src="${esc(media(j.logo))}" alt="${esc(j.name || j.k)}">` : `<span class="proof-txt proof-${slug(j.k)}">${esc(j.k)}</span>`}<small>${esc(j.cap || j.k)}</small></a>`).join("");
    } else hide("#home-proof");
    if ($("#home-journals")) load("journals").then((js) => {
      if (!js.length) return hide("#home-journals");
      $("#home-journals-logos").innerHTML = js.map((j) => {
        const u = safeUrl(j.url);
        const inner = j.logo ? `<img src="${esc(media(j.logo))}" alt="${esc(j.title)}" loading="lazy">` : `<span class="proof-txt">${esc(j.short || j.title)}</span>`;
        return u ? `<a class="proof-logo" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(j.title)}">${inner}</a>` : `<span class="proof-logo" title="${esc(j.title)}">${inner}</span>`;
      }).join("");
    });
    if (hl.length) {
      $("#home-highlights").innerHTML = hl.slice(0, 6).map((h) => highlightCard(h)).join("");
    } else hide("#home-highlights-section");
    if (showVideos && videos.length) $("#home-videos").innerHTML = [...videos].sort(featuredFirst).slice(0, 3).map(videoCard).join("");
    else hide("#home-videos-section");
    if (notes.length) $("#home-notes").innerHTML = [...notes].sort(featuredFirst).slice(0, 3).map(noteCard).join("");
    else hide("#home-notes-section");
    const openBooks = (data.books || []).filter(bookOpen);
    if (openBooks.length && $("#home-books")) $("#home-books").innerHTML = `<div class="bk-list">${openBooks.slice(0, 2).map(bookCard).join("")}</div>`;
    else hide("#home-books-section");
    const openPapers = (data.papers || []).filter(bookOpen);
    if (openPapers.length && $("#home-papers")) $("#home-papers").innerHTML = `<div class="bk-list">${openPapers.slice(0, 3).map(paperCard).join("")}</div>`;
    else hide("#home-papers-section");
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
    if (qs.get("paper") && $("#c-msg", f)) $("#c-msg", f).value = `I would like to join as a co-author on the research paper "${qs.get("paper")}".\n\nPreferred author position / role: \nMy qualification / designation: \nInstitution: `;
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

  // ---------- Testimonials (home page) ----------
  function testimonials(all) {
    const sec = $("#home-testimonials-section"), grid = $("#home-testimonials");
    if (!sec || !grid) return;
    const list = (all || []).filter((t) => t.quote && t.consent !== false)
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999) || byDate(a, b));
    if (!list.length) { sec.hidden = true; return; }
    const initials = (n) => String(n || "").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    grid.innerHTML = list.slice(0, 9).map((t) => {
      const r = Math.max(0, Math.min(5, Math.round(Number(t.rating) || 0)));
      const stars = r ? `<div class="tst-stars" role="img" aria-label="${r} out of 5 stars">${"★".repeat(r)}<span>${"★".repeat(5 - r)}</span></div>` : "";
      const who = [t.role, t.institution].filter(Boolean).map(esc).join(", ");
      return `<figure class="tst-card">
        ${stars}
        <blockquote>${esc(t.quote)}</blockquote>
        ${t.service ? `<span class="tst-service">${esc(t.service)}</span>` : ""}
        <figcaption>${t.photo ? `<img src="${esc(media(t.photo))}" alt="" loading="lazy">` : `<span class="tst-init" aria-hidden="true">${esc(initials(t.title))}</span>`}
          <span><b>${esc(t.title)}</b>${who ? `<small>${who}</small>` : ""}</span></figcaption>
      </figure>`;
    }).join("");
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

  // ---------- Contributors (home page) ----------
  function contributors(all) {
    const sec = $("#home-team-section"), grid = $("#home-team");
    if (!sec || !grid) return;
    const list = (all || []).slice().sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    if (!list.length) { sec.hidden = true; return; }
    const initials = (n) => String(n || "").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    grid.innerHTML = list.map((p) => {
      const inner = `${p.photo ? `<img class="tm-photo" src="${esc(media(p.photo))}" alt="" loading="lazy">` : `<span class="tm-photo tm-init" aria-hidden="true">${esc(initials(p.title))}</span>`}
        <span class="tm-name">${esc(p.title)}</span>${p.role ? `<span class="tm-role">${esc(p.role)}</span>` : ""}${p.institution ? `<span class="tm-inst">${esc(p.institution)}</span>` : ""}`;
      return p.link ? `<a class="tm-card" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">${inner}</a>` : `<div class="tm-card">${inner}</div>`;
    }).join("");
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
    if (PAGE === "home") { home(settings, data); noticeBoard(data.notices); contributors(data.contributors); testimonials(data.testimonials); }
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
  })();

  // ---------- Chat assistant (every public page) ----------
  if (PAGE !== "admin") {
    const sc = document.createElement("script");
    sc.src = "assets/js/bot.js?v=20261002c"; sc.defer = true;
    document.body.append(sc);
  }
})();
