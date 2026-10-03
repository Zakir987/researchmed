/* IJAOTT — journal pages (researchmed.in/journal/). Content comes from content/journal*.json, edited in the admin panel. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const media = (p) => (!p ? "" : /^(https?:)?\/\//i.test(p) ? p : String(p).replace(/^\/+/, ""));
  const safeUrl = (u) => (/^(https?:|mailto:|\/|[a-z0-9._-]+(\.html|\/))/i.test(String(u || "").trim()) ? String(u).trim() : "#");
  const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "article";
  const fmtDate = (d) => { const x = new Date(String(d) + "T00:00:00"); return isNaN(x) ? esc(d || "") : x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); };
  const JPAGE = document.body.dataset.jpage || "";
  const get = (n) => fetch(`content/${n}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  const items = (j) => ((Array.isArray(j) ? j : (j && j.items) || []).filter((x) => x && x.title && x.draft !== true));

  function prepArticles(list) {
    const seen = {};
    return list.map((a) => {
      let id = slug(a.slug || a.title); if (seen[id]) id += "-" + ++seen[id]; else seen[id] = 1;
      return Object.assign({}, a, { _id: id });
    }).sort((a, b) => String(b.published || b.date || "").localeCompare(String(a.published || a.date || "")));
  }
  const issueKey = (a) => [a.volume, a.issue].every(Boolean) ? `Volume ${a.volume}, Issue ${a.issue}${a.year ? ` (${a.year})` : ""}` : (a.year ? `${a.year}` : "Articles");
  const authorsLine = (a) => String(a.authors || "").split(/\n+|;\s*/).map((x) => x.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean).join(", ");
  const artUrl = (a) => `journal/article.html?id=${encodeURIComponent(a._id)}`;
  function citation(a, J) {
    const vi = [a.year, a.volume ? `${a.volume}${a.issue ? `(${a.issue})` : ""}` : ""].filter(Boolean).join(";");
    return `${authorsLine(a)}. ${a.title}. ${J.short || "IJAOTT"}. ${vi}${a.pages ? ":" + a.pages : ""}.${a.doi ? " doi:" + String(a.doi).replace(/^https?:\/\/doi\.org\//i, "") : ""}`;
  }
  function artCard(a) {
    return `<article class="jr-art">
      <span class="jr-art-type">${esc(a.article_type || "Article")}</span>
      <h3><a href="${artUrl(a)}">${esc(a.title)}</a></h3>
      ${authorsLine(a) ? `<p class="jr-art-au">${esc(authorsLine(a))}</p>` : ""}
      <p class="jr-art-meta">${[issueKey(a) !== "Articles" ? issueKey(a) : "", a.pages ? "pp. " + esc(a.pages) : "", a.published ? "Published " + fmtDate(a.published) : ""].filter(Boolean).join(" · ")}</p>
      <div class="jr-art-links"><a href="${artUrl(a)}">Abstract</a>${a.pdf ? `<a href="${esc(media(a.pdf))}" target="_blank" rel="noopener">PDF ↗</a>` : ""}${a.doi ? `<a href="${esc(/^https?:/i.test(a.doi) ? a.doi : "https://doi.org/" + a.doi)}" target="_blank" rel="noopener">DOI ↗</a>` : ""}</div>
    </article>`;
  }
  const noArticles = (J) => `<div class="empty"><strong>The inaugural issue is in preparation</strong>${J.accepting === false ? "Submissions will reopen soon." : "We are now accepting manuscripts for the first issue."} <div class="btn-row" style="justify-content:center;margin-top:14px"><a class="btn btn-primary" href="journal/submit.html">Submit a manuscript</a><a class="btn btn-ghost" href="journal/authors.html">Author guidelines</a></div></div>`;

  function facts(J) {
    const box = $("#jr-facts"); if (!box) return;
    const rows = [
      ["Abbreviation", J.short], ["Publisher", J.publisher], ["Editor-in-Chief", J.editor_in_chief],
      ["ISSN", J.issn || "To be assigned"], ["Frequency", J.frequency], ["Peer review", J.review_type],
      ["Access", `Open access · ${J.licence || "CC BY 4.0"}`], ["Submission fee", J.submission_fee],
      ["Article processing charge", J.apc || "Announced before the first issue"], ["Language", J.language], ["Since", J.start_year], ["Contact", J.email ? `<a href="mailto:${esc(J.email)}">${esc(J.email)}</a>` : ""],
    ].filter(([, v]) => v);
    box.innerHTML = `<h2>Journal at a glance</h2><dl>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === "Contact" ? v : esc(v)}</dd></div>`).join("")}</dl>`;
  }
  function cfp(J) {
    const box = $("#jr-cfp"); if (!box || J.accepting === false || !J.cfp_title) return;
    box.innerHTML = `<span class="jr-cfp-tag">Now accepting submissions</span><h2>${esc(J.cfp_title)}</h2>${J.cfp_text ? `<p>${esc(J.cfp_text)}</p>` : ""}${J.cfp_deadline ? `<p><b>Last date:</b> ${fmtDate(J.cfp_deadline)}</p>` : ""}<div class="btn-row"><a class="btn btn-primary" href="journal/submit.html">Submit a manuscript</a><a class="btn btn-ghost" href="journal/authors.html">Read the guidelines</a></div>`;
    box.hidden = false;
  }
  function board(list) {
    const box = $("#jr-board"); if (!box) return;
    const ROLE_ORDER = ["editor-in-chief", "managing editor", "deputy editor", "associate editor", "section editor", "editorial board member", "reviewer"];
    const rank = (r) => { const i = ROLE_ORDER.findIndex((x) => String(r || "").toLowerCase().includes(x)); return i < 0 ? 50 : i; };
    list = list.slice().sort((a, b) => rank(a.role) - rank(b.role) || (Number(a.order) || 999) - (Number(b.order) || 999));
    if (!list.length) { box.innerHTML = `<div class="empty"><strong>Editorial board being formed</strong>Board members will be listed here.</div>`; return; }
    const groups = []; list.forEach((p) => { const g = p.role || "Editorial board"; let x = groups.find((y) => y.k === g); if (!x) groups.push(x = { k: g, p: [] }); x.p.push(p); });
    const init = (n) => String(n || "").replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
    box.innerHTML = groups.map((g) => `<h2 class="jr-board-h">${esc(g.k)}</h2><div class="jr-board">${g.p.map((p) => `<div class="jr-person">
        ${p.photo ? `<img src="${esc(media(p.photo))}" alt="${esc(p.title)}" loading="lazy">` : `<span class="jr-init" aria-hidden="true">${esc(init(p.title))}</span>`}
        <div><b>${esc(p.title)}</b>${p.qualifications ? `<small>${esc(p.qualifications)}</small>` : ""}${p.affiliation ? `<span>${esc(p.affiliation)}</span>` : ""}
        ${p.orcid || p.email ? `<span class="jr-plinks">${p.orcid ? `<a href="${esc(safeUrl(p.orcid))}" target="_blank" rel="noopener">ORCID ↗</a>` : ""}${p.email ? `<a href="mailto:${esc(p.email)}">Email</a>` : ""}</span>` : ""}</div>
      </div>`).join("")}</div>`).join("");
  }
  function issues(list, J) {
    const box = $("#jr-issues"); if (!box) return;
    if (!list.length) { box.innerHTML = noArticles(J); return; }
    const groups = []; list.forEach((a) => { const k = issueKey(a); let g = groups.find((x) => x.k === k); if (!g) groups.push(g = { k, a: [] }); g.a.push(a); });
    box.innerHTML = groups.map((g, i) => `<section class="jr-issue"><h2>${i === 0 ? '<span class="jr-cur">Current issue</span>' : ""}${esc(g.k)}</h2><div class="jr-arts">${g.a.map(artCard).join("")}</div></section>`).join("");
  }
  function latest(list, J) {
    const box = $("#jr-latest"); if (!box) return;
    box.innerHTML = list.length ? `<div class="jr-arts">${list.slice(0, 4).map(artCard).join("")}</div><p style="margin-top:14px"><a href="journal/issues.html">All issues →</a></p>` : noArticles(J);
  }
  function article(list, J) {
    const box = $("#jr-article"); if (!box) return;
    const id = new URLSearchParams(location.search).get("id");
    const a = list.find((x) => x._id === id);
    if (!a) { box.innerHTML = `<div class="empty"><strong>Article not found</strong><a href="journal/issues.html">Browse all issues</a></div>`; return; }
    document.title = `${a.title} | IJAOTT`;
    const h1 = $(".jr-hero h1"), eb = $(".jr-hero .eyebrow"), hp = $(".jr-hero p");
    if (h1) h1.textContent = a.title;
    if (eb) eb.textContent = a.article_type || "Article";
    if (hp) hp.textContent = authorsLine(a);
    const md = $('meta[name="description"]'); if (md) md.content = String(a.abstract || a.title).slice(0, 160);
    const hist = [["Received", a.received], ["Accepted", a.accepted], ["Published", a.published]].filter(([, v]) => v);
    box.innerHTML = `<div class="jr-doc"><aside class="jr-toc jr-art-side">
        ${a.pdf ? `<a class="btn btn-primary btn-block" href="${esc(media(a.pdf))}" target="_blank" rel="noopener">Download PDF</a>` : ""}
        <dl class="jr-hist"><div><dt>Issue</dt><dd>${esc(issueKey(a))}${a.pages ? `, pp. ${esc(a.pages)}` : ""}</dd></div>${hist.map(([k, v]) => `<div><dt>${k}</dt><dd>${fmtDate(v)}</dd></div>`).join("")}${a.doi ? `<div><dt>DOI</dt><dd><a href="${esc(/^https?:/i.test(a.doi) ? a.doi : "https://doi.org/" + a.doi)}" target="_blank" rel="noopener">${esc(String(a.doi).replace(/^https?:\/\/doi\.org\//i, ""))}</a></dd></div>` : ""}<div><dt>Licence</dt><dd>${esc(J.licence || "CC BY 4.0")}</dd></div></dl>
      </aside><div class="prose jr-prose">
        ${a.affiliations ? `<p class="muted" style="white-space:pre-line">${esc(a.affiliations)}</p>` : ""}
        <h2>Abstract</h2><p style="white-space:pre-line">${esc(a.abstract || "")}</p>
        ${a.keywords ? `<p><b>Keywords:</b> ${esc(Array.isArray(a.keywords) ? a.keywords.join(", ") : a.keywords)}</p>` : ""}
        <h2>How to cite</h2><p class="jr-example">${esc(citation(a, J))}</p>
        <p class="muted">© The author(s). Published by ${esc(J.publisher || "ResearchMed Connect")} under the ${esc(J.licence || "CC BY 4.0")} licence.</p>
      </div></div>`;
  }
  function fees(J) {
    const box = $("#jr-fees"); if (!box) return;
    box.innerHTML = `<p>${esc(J.submission_fee || "There is no fee to submit a manuscript.")}.</p><p><b>Article processing charge (APC):</b> ${J.apc ? esc(J.apc) + " — charged only after a manuscript is accepted." : "will be announced here before the first issue. No charge applies to manuscripts submitted before then."}</p>`;
  }

  function form(J) {
    const f = $("#jr-form"); if (!f) return;
    const status = $("#jr-status"), btn = $("button[type=submit]", f);
    const INBOX = J.email || "info@researchmed.in";
    const sync = () => {
      const kind = f.kind.value;
      f.querySelectorAll("[data-for]").forEach((el) => {
        const on = el.dataset.for === kind; el.hidden = !on;
        el.querySelectorAll("input,select,textarea").forEach((i) => { if (i.dataset.req == null) i.dataset.req = i.required ? "1" : "0"; i.required = on && i.dataset.req === "1"; i.disabled = !on; });
        if (el.tagName === "LABEL") { const i = $("input", el); if (i) { if (i.dataset.req == null) i.dataset.req = "1"; i.required = on; i.disabled = !on; } }
      });
      btn.textContent = kind === "reviewer" ? "Send application" : "Submit manuscript";
    };
    if (new URLSearchParams(location.search).get("type") === "reviewer") f.kind.value = "reviewer";
    f.querySelectorAll("input[name=kind]").forEach((r) => r.addEventListener("change", sync)); sync();
    if (J.accepting === false) { const n = document.createElement("p"); n.className = "form-status err"; n.textContent = "Manuscript submissions are paused at the moment. You can still apply to join as a reviewer."; f.prepend(n); }
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      if (d._honey) return;
      const kind = f.kind.value;
      const ref = (kind === "reviewer" ? "IJAOTT-R-" : "IJAOTT-") + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const first = String(d.name || "").trim().split(/\s+/)[0] || "there";
      btn.disabled = true; btn.textContent = "Sending…"; status.hidden = true;
      const base = { "Reference": ref, "Name": d.name, "Phone / WhatsApp": d.phone || "-", "Institution": d.institution, email: d.email, _template: "table", _captcha: "false" };
      const payload = kind === "reviewer"
        ? Object.assign(base, { "Application": "Reviewer / editor", "Qualifications": d.qualification || "-", "Expertise": d.expertise || "-", "Profile": d.profile || "-", "Role": d.role,
            _subject: `IJAOTT reviewer application ${ref}: ${d.name}`,
            _autoresponse: `Dear ${first},\n\nThank you for offering to review for the ${J.title}. We have received your application (reference ${ref}) and will be in touch.\n\nWarm regards,\nEditorial Office, ${J.short}\nhttps://researchmed.in/journal/` })
        : Object.assign(base, { "Manuscript title": d.title, "Article type": d.article_type, "Authors": d.authors, "Abstract": d.abstract, "Keywords": d.keywords || "-", "Ethics / registration": d.ethics, "ResearchMed guidance received": d.rmc_guidance, "Declaration": "Original, not under review elsewhere, ICMJE authorship confirmed",
            _subject: `IJAOTT submission ${ref}: ${d.title}`,
            _autoresponse: `Dear ${first},\n\nThank you for submitting "${d.title}" to the ${J.title}. Your reference number is ${ref}.\n\nNEXT STEP: please reply to ${INBOX} with the subject "${ref}" and attach:\n  1. Title page (Word) with all authors, affiliations and declarations\n  2. Anonymised manuscript (Word) with tables and figures\n\nWe will check your submission within about 7 days and then send it for double-blind peer review.\n\nWarm regards,\nEditorial Office, ${J.short}\nhttps://researchmed.in/journal/` });
      const mail = `mailto:${INBOX}?subject=${encodeURIComponent(ref + (kind === "reviewer" ? " – reviewer application" : " – " + (d.title || "")))}&body=${encodeURIComponent(kind === "reviewer" ? "Please find my CV attached." : "Please find attached:\n1. Title page\n2. Anonymised manuscript")}`;
      try {
        const r = await fetch("https://formsubmit.co/ajax/" + INBOX, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) !== "true") throw new Error(j.message || "send failed");
        f.hidden = true; status.className = "form-status ok";
        status.innerHTML = kind === "reviewer"
          ? `<strong>Thank you, ${esc(first)}!</strong> Your application has reached the editorial office (reference <b>${ref}</b>). <div class="btn-row" style="margin-top:12px"><a class="btn btn-primary" href="${mail}">Email your CV</a></div>`
          : `<strong>Received — reference ${ref}</strong><p style="margin-top:8px">One more step: <b>email your files</b> (title page and anonymised manuscript) to <a href="mailto:${esc(INBOX)}">${esc(INBOX)}</a> with <b>${ref}</b> in the subject. We've also sent these instructions to ${esc(d.email)}.</p><div class="btn-row" style="margin-top:12px"><a class="btn btn-primary" href="${mail}">Email my files now</a></div>`;
        status.hidden = false;
      } catch (err) {
        status.className = "form-status err";
        status.innerHTML = `<strong>We couldn't send this form just now.</strong> Please email your ${kind === "reviewer" ? "application and CV" : "manuscript files and the details above"} to <a href="mailto:${esc(INBOX)}">${esc(INBOX)}</a> instead.<div class="btn-row" style="margin-top:12px"><a class="btn btn-primary" href="${mail}">Send by email</a></div>`;
        status.hidden = false; btn.disabled = false; sync();
      }
    });
  }

  (async function boot() {
    const [J, B, A] = await Promise.all([get("journal"), get("journal-board"), get("journal-articles")]);
    const arts = prepArticles(items(A));
    facts(J); cfp(J); fees(J);
    if (JPAGE === "home") latest(arts, J);
    if (JPAGE === "board") board(items(B));
    if (JPAGE === "issues") { issues(arts, J); article(arts, J); }
    if (JPAGE === "submit") form(J);
  })();
})();
