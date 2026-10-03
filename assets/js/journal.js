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

    const selectedKind = () => {
      const checked = f.querySelector('input[name="Submission type"]:checked');
      return checked && checked.value === "Reviewer / editor application" ? "reviewer" : "manuscript";
    };

    const sync = () => {
      const kind = selectedKind();
      f.querySelectorAll("[data-for]").forEach((el) => {
        const on = el.dataset.for === kind;
        el.hidden = !on;
        el.querySelectorAll("input,select,textarea").forEach((i) => {
          if (i.dataset.req == null) i.dataset.req = i.required ? "1" : "0";
          i.required = on && i.dataset.req === "1";
          i.disabled = !on;
        });
        if (el.tagName === "LABEL") {
          const i = $("input", el);
          if (i) { if (i.dataset.req == null) i.dataset.req = "1"; i.required = on; i.disabled = !on; }
        }
      });
      btn.textContent = kind === "reviewer" ? "Send application" : "Submit manuscript";
    };

    if (new URLSearchParams(location.search).get("type") === "reviewer") {
      const r = f.querySelector('input[name="Submission type"][value="Reviewer / editor application"]');
      if (r) r.checked = true;
    }
    f.querySelectorAll('input[name="Submission type"]').forEach((r) => r.addEventListener("change", sync));
    sync();

    if (JPAGE === "track") {
      const tf = $("#jr-track-form");
      const out = $("#jr-track-result");
      const endpoint = String(J.submission_endpoint || "").trim();

      if (tf && out) {
        const show = (html) => { out.innerHTML = html; };
        const run = () => {
          const ref = String($("#jr-ref", tf)?.value || "").trim().toUpperCase();
          const email = String($("#jr-track-email", tf)?.value || "").trim();
          if (!endpoint) {
            show('<div class="empty"><strong>Tracking service is not configured yet.</strong><p>Please contact the editorial office.</p></div>');
            return;
          }

          show('<div class="empty"><strong>Checking your submission…</strong></div>');
          const callback = "ijaottTrack_" + Date.now();
          window[callback] = function (data) {
            try {
              if (!data || !data.ok) {
                show('<div class="empty"><strong>Unable to check the submission.</strong><p>Please try again.</p></div>');
                return;
              }
              if (!data.found) {
                show('<div class="empty"><strong>Submission not found</strong><p>' + esc(data.error || "Check your reference number and email address.") + '</p></div>');
                return;
              }
              const r = data.record;
              const note = r.note ? '<p><b>Editorial note:</b> ' + esc(r.note) + '</p>' : '';
              show('<div class="jr-track-card"><span class="jr-art-type">' + esc(r.status) + '</span>' +
                '<h2>' + esc(r.title || (r.kind === "reviewer" ? "Reviewer / editor application" : "Manuscript submission")) + '</h2>' +
                '<p><b>Reference:</b> ' + esc(r.reference) + '</p>' +
                '<p><b>Current stage:</b> ' + esc(r.stage) + '</p>' +
                '<p><b>Submitted:</b> ' + esc(r.submittedAt) + '</p>' +
                '<p><b>Last updated:</b> ' + esc(r.updatedAt) + '</p>' + note +
                '</div>');
            } finally {
              delete window[callback];
              const node = document.getElementById(callback);
              if (node) node.remove();
            }
          };
          const node = document.createElement("script");
          node.id = callback;
          node.src = endpoint + "?action=track&reference=" + encodeURIComponent(ref) +
            "&email=" + encodeURIComponent(email) + "&prefix=" + encodeURIComponent(callback);
          node.onerror = () => {
            delete window[callback];
            node.remove();
            show('<div class="empty"><strong>Tracking service could not be reached.</strong><p>Please try again in a moment.</p></div>');
          };
          document.body.appendChild(node);
        };
        tf.addEventListener("submit", (e) => { e.preventDefault(); run(); });
        const params = new URLSearchParams(location.search);
        if (params.get("ref") && params.get("email")) {
          $("#jr-ref", tf).value = params.get("ref");
          $("#jr-track-email", tf).value = params.get("email");
          run();
        }
      }
    }

    if (J.accepting === false) {
      const n = document.createElement("p");
      n.className = "form-status err";
      n.textContent = "Manuscript submissions are paused at the moment. You can still apply to join as a reviewer.";
      f.prepend(n);
    }

    f.addEventListener("submit", async (event) => {
      const kind = selectedKind();
      const data = new FormData(f);
      if (data.get("_honey")) return;

      const ref = (kind === "reviewer" ? "IJAOTT-R-" : "IJAOTT-") +
        new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();

      const title = String(data.get("Manuscript title") || "").trim();
      const name = String(data.get("name") || "").trim();
      const first = name.split(/\s+/)[0] || "there";
      const endpoint = String(J.submission_endpoint || "").trim();

      f.querySelector("#j-ref").value = ref;
      f.querySelector("#j-subject").value =
        kind === "reviewer"
          ? `IJAOTT reviewer application ${ref}: ${name}`
          : `IJAOTT submission ${ref}: ${title}`;
      f.querySelector("#j-auto").value =
        kind === "reviewer"
          ? `Dear ${first},\\n\\nThank you for offering to review for the ${J.title}. Your application reference is ${ref}.\\n\\nWarm regards,\\nEditorial Office, ${J.short}\\nhttps://researchmed.in/journal/`
          : `Dear ${first},\\n\\nThank you for submitting "${title}" to the ${J.title}. Your reference number is ${ref}.\\n\\nWe have received your submission and will check it within about 7 days before sending it for double-blind peer review.\\n\\nWarm regards,\\nEditorial Office, ${J.short}\\nhttps://researchmed.in/journal/`;
      f.querySelector("#j-next").value =
        "https://researchmed.in/journal/thanks.html?reference=" + encodeURIComponent(ref);

      if (!endpoint) {
        // Temporary fallback until the Google Apps Script /exec URL is configured.
        // FormSubmit receives the native multipart/form-data request.
        btn.disabled = true;
        btn.textContent = "Submitting…";
        return;
      }

      event.preventDefault();
      const fileInput = kind === "reviewer" ? $("#j-cv", f) : $("#j-file", f);
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (kind === "manuscript" && !file) {
        status.hidden = false;
        status.className = "form-status err";
        status.textContent = "Please select your manuscript file.";
        return;
      }

      if (file && file.size > 10 * 1024 * 1024) {
        status.hidden = false;
        status.className = "form-status err";
        status.textContent = "The selected file is larger than 10 MB.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Uploading…";
      status.hidden = false;
      status.className = "form-status";
      status.textContent = "Uploading your submission securely…";

      const hidden = (name, value) => {
        let input = f.querySelector(`input[data-gas-field="${name}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.dataset.gasField = name;
          input.name = name;
          f.appendChild(input);
        }
        input.value = value == null ? "" : String(value);
      };

      hidden("kind", kind);
      hidden("filename", file ? file.name : "");
      hidden("mimeType", file ? (file.type || "application/octet-stream") : "");
      
      const submitToGoogle = (base64) => {
        hidden("fileData", base64);
        f.action = endpoint;
        f.method = "POST";
        f.enctype = "application/x-www-form-urlencoded";
        f.submit();
      };

      if (!file) {
        submitToGoogle("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        submitToGoogle(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => {
        btn.disabled = false;
        btn.textContent = kind === "reviewer" ? "Send application" : "Submit manuscript";
        status.textContent = "The file could not be read. Please try again.";
      };
      reader.readAsDataURL(file);
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
/* Journal fixes: hide tracking until configured, consistent APC text, clean auto-reply line breaks, Google Scholar citation tags */ (function () { var P = document.body.dataset.jpage || ""; var get = function (n) { return fetch("content/" + n + ".json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }); }; var NL = String.fromCharCode(92) + "n"; document.addEventListener("submit", function (e) { var a = e.target && e.target.querySelector && e.target.querySelector("#j-auto"); if (a && a.value.indexOf(NL) > -1) a.value = a.value.split(NL).join(String.fromCharCode(10)); }); var slug = function (s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "article"; }; Promise.all([get("journal"), get("journal-articles")]).then(function (r) { var J = r[0] || {}, A = r[1] || {}; if (!String(J.submission_endpoint || "").trim()) { document.querySelectorAll('a[href="journal/track.html"]').forEach(function (a) { var li = a.closest(".jr-next li"); if (li) li.remove(); else if (P !== "track") a.remove(); }); } document.querySelectorAll(".jr-next li").forEach(function (li) { if (/APC/.test(li.textContent)) li.textContent = J.apc ? "Article processing charge: " + J.apc + ", charged only after acceptance." : "No submission fee. The APC will be announced before the first issue."; }); var id = new URLSearchParams(location.search).get("id"); if (!id || P !== "issues") return; var list = (Array.isArray(A) ? A : A.items || []).filter(function (x) { return x && x.title && x.draft !== true; }), seen = {}, art = null; list.forEach(function (x) { var k = slug(x.slug || x.title); if (seen[k]) k += "-" + ++seen[k]; else seen[k] = 1; if (k === id) art = x; }); if (!art) return; var m = function (n, v) { if (!v) return; var t = document.createElement("meta"); t.name = n; t.content = String(v); document.head.appendChild(t); }; var abs = function (u) { return new URL(String(u).replace(/^\/+/, ""), document.baseURI).href; }; m("citation_title", art.title); String(art.authors || "").split(/\n+|;\s*/).map(function (x) { return x.replace(/^\s*\d+[.)]\s*/, "").trim(); }).filter(Boolean).forEach(function (x) { m("citation_author", x); }); m("citation_publication_date", String(art.published || art.year || "").replace(/-/g, "/")); m("citation_journal_title", J.title); m("citation_journal_abbrev", J.short); m("citation_publisher", J.publisher); m("citation_issn", J.issn); m("citation_volume", art.volume); m("citation_issue", art.issue); var pg = String(art.pages || "").split(/[-–]/); m("citation_firstpage", pg[0]); m("citation_lastpage", pg[1]); m("citation_doi", art.doi && String(art.doi).replace(/^https?:\/\/doi\.org\//i, "")); m("citation_pdf_url", art.pdf && (/^https?:/i.test(art.pdf) ? art.pdf : abs(art.pdf))); m("citation_abstract_html_url", location.href); m("citation_language", "en"); }); })();
/* Journal facts: indexing, archiving and DOI prefix from the admin panel */ (function () { fetch("content/journal.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (J) { var rows = [["Indexed in", Array.isArray(J.indexing) ? J.indexing.join(", ") : J.indexing], ["Archiving", J.archiving], ["DOI prefix", J.doi_prefix]].filter(function (x) { return x[1] && String(x[1]).trim(); }); if (!rows.length) return; var tries = 0; (function add() { var dl = document.querySelector("#jr-facts dl"); if (!dl) { if (++tries < 40) setTimeout(add, 150); return; } rows.forEach(function (x) { var d = document.createElement("div"), t = document.createElement("dt"), v = document.createElement("dd"); t.textContent = x[0]; v.textContent = String(x[1]); d.appendChild(t); d.appendChild(v); dl.appendChild(d); }); })(); }); })();
