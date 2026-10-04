/* ResearchMed Connect — simple built-in admin panel.
   Saves changes straight to the GitHub repository with the owner's personal key
   (kept only in this browser). GitHub Pages republishes the site in about a minute. */
(function () {
  "use strict";
  const OWNER = "Zakir987", REPO = "researchmed", BRANCH = "main";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const KEY = "rmc-admin-key";
  const IJAOTT_ENDPOINT_KEY = "ijaott-admin-endpoint";
  const IJAOTT_ADMIN_KEY = "ijaott-admin-secret";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  let token = "";
  try { token = localStorage.getItem(KEY) || ""; } catch (e) {}

  // ---------- GitHub helpers ----------
  async function gh(path, opts = {}) {
    const r = await fetch(API + path, {
      ...opts,
      headers: { Accept: "application/vnd.github+json", Authorization: "token " + token, ...(opts.headers || {}) },
    });
    if (!r.ok) {
      let msg = r.status + "";
      try { msg = (await r.json()).message || msg; } catch (e) {}
      const err = new Error(msg); err.status = r.status; throw err;
    }
    return r.status === 204 ? null : r.json();
  }
  const b64ToText = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
  function bytesToB64(bytes) {
    let s = ""; const n = 0x8000;
    for (let i = 0; i < bytes.length; i += n) s += String.fromCharCode.apply(null, bytes.subarray(i, i + n));
    return btoa(s);
  }
  const textToB64 = (t) => bytesToB64(new TextEncoder().encode(t));
  async function readJson(path) {
    const f = await gh(`/contents/${path}?ref=${BRANCH}`);
    return { data: JSON.parse(b64ToText(f.content)), sha: f.sha };
  }
  async function writeFile(path, b64, sha, message) {
    const body = { message, content: b64, branch: BRANCH };
    if (sha) body.sha = sha;
    const r = await gh(`/contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
    return r.content.sha;
  }
  // Large photos/posters are resized (max 1600px) and converted to WebP so pages load fast.
  async function shrinkImage(file) {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size < 150 * 1024) return file;
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.82));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, "") + ".webp", { type: "image/webp" });
    } catch (e) { return file; }
  }
  async function uploadFile(file, folder = "media/uploads") {
    if (file.size > 25 * 1024 * 1024) throw new Error("This file is larger than 25 MB. Please use a smaller file (or a YouTube / Google Drive link).");
    file = await shrinkImage(file);
    const clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
    const path = `${folder}/${Date.now().toString(36)}-${clean}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(path, bytesToB64(bytes), null, `Upload ${clean} via admin`);
    return "/" + path;
  }

  // ---------- Section definitions ----------
  const SECTIONS = {
    enquiries: { label: "Enquiries", static: true },
    ijaott_tracking: {
      label: "IJAOTT Tracking", file: "content/journal-tracking.json", list: true, noun: "manuscript status",
      hint: "Authors see this on researchmed.in/journal/track.html when they enter their reference number. Anyone with the reference number can see it, so never put author names, emails or manuscript titles here.",
      fields: [
        { k: "title", l: "Reference number (from the submission email)", t: "text", req: true, ph: "IJAOTT-261003-AB12" },
        { k: "status", l: "Current stage", t: "select", opts: ["Submitted", "Initial editorial check", "Under peer review", "Revision requested", "Revised manuscript received", "Accepted", "Production (copyediting & proofs)", "Published", "Rejected", "Withdrawn"] },
        { k: "note", l: "Message to the author (optional; shown on the tracking page)", t: "area" },
        { k: "updated", l: "Last updated", t: "date", def: today },
      ],
      summary: (x) => [x.status, x.updated].filter(Boolean).join(" · "),
    },
    notices: {
      label: "Notice Board", file: "content/notices.json", list: true, noun: "notice",
      hint: "Notices scroll across the top of the home page. Tick NEW to show a blinking tag.",
      fields: [
        { k: "title", l: "Notice", t: "text", req: true },
        { k: "date", l: "Date", t: "date", def: today },
        { k: "details", l: "Short details (optional)", t: "text" },
        { k: "link", l: "Link (optional)", t: "text", ph: "https://… or contact.html" },
        { k: "new", l: "Show blinking NEW tag", t: "check" },
        { k: "pinned", l: "Keep at the top", t: "check" },
        { k: "expires", l: "Hide after this date (optional)", t: "date" },
      ],
      summary: (x) => [x.date, x.new ? "NEW" : "", x.pinned ? "Pinned" : "", x.expires ? "until " + x.expires : ""].filter(Boolean).join(" · "),
    },
    updates: {
      label: "Updates", file: "content/updates.json", list: true, noun: "update",
      hint: "News shown on the Updates page (newest first). The page appears in the menu once there is at least one update.",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "date", l: "Date", t: "date", def: today },
        { k: "body", l: "Details. Use - for bullet points", t: "area" },
        { k: "link", l: "Link (optional)", t: "text", ph: "https://… or papers.html" },
      ],
      summary: (x) => x.date || "",
    },
    highlights: {
      label: "Publications", file: "content/highlights.json", list: true, noun: "publication",
      hint: "Author names are never shown. Upload the journal logo once; later papers in the same journal can reuse it.",
      fields: [
        { k: "title", l: "Paper title", t: "text", req: true },
        { k: "journal", l: "Journal full name", t: "text" },
        { k: "journal_short", l: "Journal short name (e.g. IJNRD)", t: "text" },
        { k: "volume", l: "Volume / issue / pages", t: "text", ph: "Vol. 11, Issue 9, pp. 10–15" },
        { k: "year", l: "Published (month / year)", t: "text", ph: "September 2026" },
        { k: "date", l: "Publication date", t: "date", def: today },
        { k: "study_type", l: "Study type", t: "text", ph: "Original research" },
        { k: "url", l: "Link to the paper", t: "text", ph: "https://…" },
        { k: "indexed_in", l: "Badges (separate with commas)", t: "tags", ph: "Peer-reviewed, Scopus, UGC Approved" },
        { k: "logo", l: "Journal logo", t: "image", folder: "media/logos", reuse: true },
        { k: "summary", l: "Short summary (optional)", t: "area" },
      ],
      summary: (x) => [x.journal_short || x.journal, x.year].filter(Boolean).join(" · "),
    },
    journals: {
      label: "Journal Logos", file: "content/journals.json", list: true, noun: "journal", append: true,
      hint: "Logos shown on the home page under 'Indexed Indian journals we guide you towards'. Upload a logo (square PNG works best); without one, the short name is shown. Use the arrows to change the order.",
      fields: [
        { k: "title", l: "Journal full name", t: "text", req: true, ph: "Indian Journal of Anaesthesia" },
        { k: "short", l: "Short name (shown when there is no logo)", t: "text", ph: "IJA" },
        { k: "logo", l: "Journal logo", t: "image", folder: "media/logos", reuse: true },
        { k: "url", l: "Journal website (optional)", t: "text", ph: "https://…" },
      ],
      summary: (x) => [x.short, x.logo ? "logo added" : "no logo yet"].filter(Boolean).join(" · "),
    },
    gallery: {
      label: "Photos", file: "content/gallery.json", list: true, noun: "photo",
      hint: "Photos appear in the Gallery and on the home page.",
      fields: [
        { k: "image", l: "Photo", t: "image", req: true },
        { k: "title", l: "Title", t: "text", req: true },
        { k: "album", l: "Album / event", t: "text", ph: "Workshops" },
        { k: "date", l: "Date", t: "date", def: today },
        { k: "caption", l: "Caption (optional)", t: "area" },
      ],
      summary: (x) => [x.album, x.date].filter(Boolean).join(" · "),
    },
    notes: {
      label: "Notes & PDFs", file: "content/notes.json", list: true, noun: "note",
      hint: "Upload a PDF, Word or PowerPoint file, or paste a Google Drive link.",
      fields: [
        { k: "title", l: "Title", t: "text", req: true },
        { k: "category", l: "Subject", t: "text", ph: "Research Methodology" },
        { k: "date", l: "Date", t: "date", def: today },
        { k: "summary", l: "Short summary", t: "area" },
        { k: "body", l: "Full note (optional). Use ## for headings and - for bullet points", t: "area" },
        { k: "pdf", l: "File (PDF / Word / PowerPoint)", t: "file" },
        { k: "link", l: "Or a link (optional)", t: "text", ph: "https://drive.google.com/…" },
      ],
      summary: (x) => [x.category, x.date, x.pdf ? "file attached" : ""].filter(Boolean).join(" · "),
    },
    contributors: {
      label: "Contributors", file: "content/contributors.json", list: true, noun: "contributor", append: true,
      hint: "People shown in the Contributors section of the home page. Lower 'Order' numbers appear first.",
      fields: [
        { k: "title", l: "Full name", t: "text", req: true, ph: "Dr. A. Sharma" },
        { k: "role", l: "Role / designation", t: "text", ph: "Research Mentor" },
        { k: "institution", l: "Institution / department (optional)", t: "text" },
        { k: "photo", l: "Photo (square works best)", t: "image", folder: "media/people" },
        { k: "link", l: "Profile link (optional)", t: "text", ph: "LinkedIn, Google Scholar or ORCID link" },
        { k: "order", l: "Order (1 = first)", t: "number" },
      ],
      summary: (x) => [x.role, x.institution, x.order ? "#" + x.order : ""].filter(Boolean).join(" · "),
    },
    testimonials: {
      label: "Testimonials", file: "content/testimonials.json", list: true, noun: "testimonial",
      hint: "Real feedback from people you have guided. Shown on the home page under 'What our learners say'. Only add a testimonial with the person's permission.",
      fields: [
        { k: "title", l: "Person's name (as they agree to show it)", t: "text", req: true, ph: "Dr. A. Sharma or Priya S." },
        { k: "role", l: "Role / course (optional)", t: "text", ph: "M.Sc. Anaesthesia Technology student" },
        { k: "institution", l: "Institution / city (optional)", t: "text" },
        { k: "quote", l: "Their words", t: "area", req: true },
        { k: "service", l: "Guidance received (optional)", t: "text", ph: "Publication guidance" },
        { k: "rating", l: "Star rating 1–5 (optional)", t: "number" },
        { k: "photo", l: "Photo (optional, square works best)", t: "image", folder: "media/people" },
        { k: "order", l: "Order (1 = first, optional)", t: "number" },
        { k: "date", l: "Date received", t: "date", def: today },
        { k: "consent", l: "This person has given permission to publish their words and name", t: "check", req: true },
      ],
      summary: (x) => [x.role, x.rating ? x.rating + "★" : "", x.date].filter(Boolean).join(" · "),
    },
    books: {
      label: "Books", file: "content/books.json", list: true, noun: "book",
      hint: "Books that need chapter authors. They show on the Books page and on the home page while open. Untick 'Open' or let the last date pass to close a call.",
      fields: [
        { k: "title", l: "Book title", t: "text", req: true },
        { k: "subtitle", l: "Subtitle / type (optional)", t: "text", ph: "Edited textbook for AOTT diploma students" },
        { k: "cover", l: "Cover image (optional)", t: "image", folder: "media/books" },
        { k: "description", l: "About the book", t: "area" },
        { k: "chapters", l: "Chapters open for authors (one per line)", t: "area" },
        { k: "deadline", l: "Last date to apply", t: "date" },
        { k: "publisher", l: "Publisher / ISBN (optional)", t: "text" },
        { k: "fee", l: "Author fee (optional)", t: "text", ph: "e.g. No fee, or ₹2,000 per chapter" },
        { k: "brochure", l: "Details / brochure PDF (optional)", t: "file", folder: "media/books" },
        { k: "apply_link", l: "Own application link (optional; otherwise the Contact form is used)", t: "text" },
        { k: "open", l: "Open for authors", t: "check", def: () => true },
        { k: "date", l: "Date added", t: "date", def: today },
      ],
      summary: (x) => [x.open === false ? "Closed" : "Open", x.deadline ? "last date " + x.deadline : "", x.chapters ? String(x.chapters).split(/\n+/).filter(Boolean).length + " chapters" : ""].filter(Boolean).join(" · "),
    },
    papers: {
      label: "Paper Authors", file: "content/papers.json", list: true, noun: "paper",
      hint: "Research papers that need co-authors. They show on the 'Join a Paper' page and on the home page while open. Untick 'Open' or let the last date pass to close a call.",
      fields: [
        { k: "title", l: "Paper title / topic", t: "text", req: true },
        { k: "image", l: "Image (optional)", t: "image", folder: "media/papers" },
        { k: "field", l: "Subject area", t: "text", ph: "Anaesthesia & OT Technology" },
        { k: "study_type", l: "Study type", t: "text", ph: "Original research, Review article, Case report…" },
        { k: "description", l: "About the paper", t: "area" },
        { k: "roles", l: "Author positions open (one per line)", t: "area", ph: "Second author – data collection\nThird author – literature review" },
        { k: "authors_needed", l: "Number of authors needed", t: "number" },
        { k: "requirements", l: "Who can apply / what the author will do (optional)", t: "area" },
        { k: "target_journal", l: "Target journal (optional)", t: "text" },
        { k: "indexing", l: "Indexing (separate with commas)", t: "tags", ph: "Scopus, PubMed" },
        { k: "status", l: "Paper stage (optional)", t: "text", ph: "Data collection complete, Manuscript drafted…" },
        { k: "deadline", l: "Last date to apply", t: "date" },
        { k: "fee", l: "Author fee (optional)", t: "text", ph: "e.g. No fee, or ₹3,000 per author" },
        { k: "details_pdf", l: "Details PDF (optional)", t: "file", folder: "media/papers" },
        { k: "apply_link", l: "Own application link (optional; otherwise the Contact form is used)", t: "text" },
        { k: "open", l: "Open for authors", t: "check", def: () => true },
        { k: "date", l: "Date added", t: "date", def: today },
      ],
      summary: (x) => [x.open === false ? "Closed" : "Open", x.authors_needed ? x.authors_needed + " authors needed" : "", x.deadline ? "last date " + x.deadline : ""].filter(Boolean).join(" · "),
    },
    journal: {
      label: "Journal: Settings", file: "content/journal.json", list: false,
      hint: "Basic details of the Indian Journal of Anaesthesia &amp; Operation Theatre Technology, shown on researchmed.in/journal/. Leave ISSN empty until it is assigned.",
      fields: [
        { k: "title", l: "Journal title", t: "text", req: true },
        { k: "short", l: "Abbreviation", t: "text", ph: "IJAOTT" },
        { k: "editor_in_chief", l: "Editor-in-Chief", t: "text" },
        { k: "publisher", l: "Publisher", t: "text", ph: "ResearchMed Connect" },
        { k: "issn", l: "ISSN (only once assigned)", t: "text", ph: "e.g. 1234-5678 (Online)" },
        { k: "frequency", l: "Publication frequency", t: "text", ph: "Quarterly (January, April, July, October)" },
        { k: "start_year", l: "Started (year)", t: "text" },
        { k: "review_type", l: "Peer review type", t: "text", ph: "Double-blind peer review" },
        { k: "licence", l: "Licence", t: "text", ph: "CC BY 4.0" },
        { k: "submission_fee", l: "Submission fee", t: "text", ph: "No submission fee" },
        { k: "apc", l: "Article processing charge (charged after acceptance)", t: "text", ph: "e.g. ₹3,000 per accepted article" },
        { k: "email", l: "Editorial office email", t: "text", ph: "info@researchmed.in" },
{ k: "submission_endpoint", l: "Submission & tracking link (Google Apps Script /exec URL; turns on manuscript tracking)", t: "text", ph: "https://script.google.com/macros/s/.../exec" },
{ k: "doi_prefix", l: "DOI prefix (only after joining Crossref)", t: "text", ph: "10.xxxxx" },
{ k: "indexing", l: "Indexed in (only confirmed indexing; separate with commas)", t: "tags", ph: "Google Scholar, Crossref" },
{ k: "archiving", l: "Long-term archiving", t: "text", ph: "e.g. Internet Archive, PKP Preservation Network" },
        { k: "accepting", l: "Accepting manuscripts", t: "check", def: () => true },
        { k: "cfp_title", l: "Call for papers – heading", t: "text", ph: "Call for papers: Volume 1, Issue 1" },
        { k: "cfp_text", l: "Call for papers – details", t: "area" },
        { k: "cfp_deadline", l: "Call for papers – last date (optional)", t: "date" },
      ],
    },
    journal_board: {
      label: "Journal: Editorial Board", file: "content/journal-board.json", list: true, noun: "board member",
      hint: "Add only people who have agreed in writing to serve. They appear on the Editorial board page, grouped by role.",
      fields: [
        { k: "title", l: "Full name", t: "text", req: true, ph: "Dr. …" },
        { k: "role", l: "Role", t: "text", req: true, ph: "Editor-in-Chief, Associate Editor, Editorial Board Member, Reviewer" },
        { k: "qualifications", l: "Qualifications", t: "text" },
        { k: "affiliation", l: "Designation & institution", t: "text" },
        { k: "photo", l: "Photo (optional)", t: "image", folder: "media/people" },
        { k: "orcid", l: "ORCID link (optional)", t: "text", ph: "https://orcid.org/…" },
        { k: "email", l: "Email (optional)", t: "text" },
        { k: "order", l: "Order within the role (1 = first)", t: "number" },
      ],
      summary: (x) => [x.role, x.affiliation].filter(Boolean).join(" · "),
    },
    journal_articles: {
      label: "Journal: Articles", file: "content/journal-articles.json", list: true, noun: "article",
      hint: "Publish an accepted article: fill in the details and upload the final PDF. Articles are grouped by volume and issue on the Issues page.",
      fields: [
        { k: "title", l: "Article title", t: "text", req: true },
        { k: "article_type", l: "Article type", t: "text", ph: "Original research, Review article, Case report…" },
        { k: "authors", l: "Authors (one per line, in order)", t: "area" },
        { k: "affiliations", l: "Affiliations (optional)", t: "area" },
        { k: "abstract", l: "Abstract", t: "area" },
        { k: "keywords", l: "Keywords (separate with commas)", t: "tags" },
        { k: "volume", l: "Volume", t: "text", ph: "1" },
        { k: "issue", l: "Issue", t: "text", ph: "1" },
        { k: "year", l: "Year", t: "text", ph: "2026" },
        { k: "pages", l: "Pages", t: "text", ph: "1–8" },
        { k: "doi", l: "DOI (optional)", t: "text" },
        { k: "received", l: "Received", t: "date" },
        { k: "accepted", l: "Accepted", t: "date" },
        { k: "published", l: "Published", t: "date", def: today },
        { k: "pdf", l: "Final PDF", t: "file", folder: "media/journal" },
      ],
      summary: (x) => [x.volume ? `Vol ${x.volume}${x.issue ? `(${x.issue})` : ""}` : "", x.published].filter(Boolean).join(" · "),
    },
    founder: {
      label: "Founder", file: "content/founder.json", list: false,
      hint: "Your profile as Founder &amp; Managing Director. It appears on the home page and the About page. Leave any box empty to hide that line.",
      fields: [
        { k: "show", l: "Show the founder section on the website", t: "check", def: () => true },
        { k: "name", l: "Full name", t: "text", ph: "Dr. Zakir Hussain Parray" },
        { k: "designation", l: "Designation", t: "text", ph: "Founder & Managing Director" },
        { k: "qualifications", l: "Qualifications", t: "text", ph: "Ph.D., M.Sc. Anaesthesia & OT Technology" },
        { k: "position", l: "Current position / institution (optional)", t: "text" },
        { k: "photo", l: "Photo (portrait or square works best)", t: "image", folder: "media/people" },
        { k: "bio", l: "About the founder (a blank line starts a new paragraph)", t: "area" },
        { k: "highlights", l: "Key achievements (one per line)", t: "area", ph: "7+ years of teaching and research" },
        { k: "expertise", l: "Areas of expertise (separate with commas)", t: "tags", ph: "Anaesthesia Technology, Research Methodology, Medical Education" },
        { k: "message", l: "Message from the founder (optional quote)", t: "area" },
        { k: "email", l: "Email (optional)", t: "text" },
        { k: "linkedin", l: "LinkedIn link (optional)", t: "text" },
        { k: "scholar", l: "Google Scholar link (optional)", t: "text" },
        { k: "orcid", l: "ORCID link (optional)", t: "text" },
        { k: "researchgate", l: "ResearchGate link (optional)", t: "text" },
      ],
    },
    settings: {
      label: "Numbers & contact", file: "content/settings.json", list: false,
      hint: "Home page numbers, contact details and the thin announcement bar at the top of every page.",
      fields: [
        { k: "logo", l: "Website logo (square image works best; shown top-left and as the browser tab icon)", t: "image", folder: "media/brand" },
        { k: "papers_submitted", l: "Papers submitted", t: "number" },
        { k: "papers_published", l: "Papers published", t: "number" },
        { k: "email", l: "Email shown on the website", t: "text" },
        { k: "whatsapp", l: "WhatsApp number", t: "text" },
        { k: "announcement", l: "Announcement bar text (leave empty to hide)", t: "text" },
        { k: "announcement_link", l: "Announcement link", t: "text" },
        { k: "hero_title", l: "Home page headline", t: "text" },
        { k: "hero_text", l: "Home page intro", t: "area" },
        { k: "youtube_channel", l: "YouTube channel link", t: "text" },
        { k: "linkedin", l: "LinkedIn link", t: "text" },
        { k: "goatcounter", l: "Visitor counter code (your GoatCounter code, e.g. researchmed)", t: "text", ph: "researchmed" },
        { k: "show_visitors", l: "Show the visitor count in the website footer", t: "check", def: () => true },
      ],
    },
  };

  // ---------- State ----------
  let current = "enquiries", doc = null, sha = null, editing = -1;
  const logos = new Set();

  // ---------- Rendering ----------
  const root = $("#admin");
  function show(html) { root.innerHTML = html; }
  function toast(msg, bad) {
    const t = $("#toast");
    t.textContent = msg; t.className = "toast " + (bad ? "bad" : "ok"); t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 6000);
  }

  function renderLogin(err) {
    show(`
      <div class="contact-card">
        <h2 style="font-size:1.4rem">Connect this browser (one time)</h2>
        <ol class="steps">
          <li>Click <strong>Get my key</strong>. GitHub opens with everything filled in.</li>
          <li>On that page set <strong>Expiration</strong> to <strong>No expiration</strong>, scroll down, click the green <strong>Generate token</strong> button, then copy the key (it starts with ghp_).</li>
          <li>Come back here, paste the key below and click <strong>Connect</strong>.</li>
        </ol>
        <div class="btn-row"><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://github.com/settings/tokens/new?scopes=repo&description=ResearchMed%20website%20admin">Get my key ↗</a></div>
        <form id="login" class="form">
          <label for="key">Paste your key<input id="key" type="password" autocomplete="off" placeholder="ghp_…" required></label>
          <button class="btn btn-primary" type="submit">Connect</button>
        </form>
        ${err ? `<p class="form-status err">${esc(err)}</p>` : ""}
        <p class="muted" style="font-size:.92rem">The key stays only in this browser. Anyone without it cannot change your website. Use <strong>Sign out</strong> on shared computers.</p>
      </div>`);
    $("#login").addEventListener("submit", async (e) => {
      e.preventDefault();
      token = $("#key").value.trim();
      try {
        const repo = await gh("");
        if (!repo.permissions || !repo.permissions.push) throw new Error("This key cannot edit the website.");
        try { localStorage.setItem(KEY, token); } catch (er) {}
        start();
      } catch (er) {
        token = "";
        renderLogin(er.status === 401 ? "That key was not accepted. Please copy it again." : er.message);
      }
    });
  }

  function tabs() {
    return `<div class="admin-tabs" role="tablist">${Object.entries(SECTIONS).map(([k, s]) =>
      `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === current}">${s.label}</button>`).join("")}
      <button type="button" class="signout" id="signout">Sign out</button></div>`;
  }

  async function start(tab) {
    if (tab) current = tab;
    editing = -1;
    show(`${tabs()}<div class="admin-panel"><div class="skeleton" style="min-height:160px"></div></div>`);
    bindTabs();
    if (SECTIONS[current].static) { $(".admin-panel").innerHTML = enquiriesPanel(); return; }
if (SECTIONS[current].tracking) { try { if (!localStorage.getItem(IJAOTT_ENDPOINT_KEY)) { const jj = await fetch("content/journal.json", { cache: "no-cache" }).then((r) => r.json()); if (jj.submission_endpoint) localStorage.setItem(IJAOTT_ENDPOINT_KEY, jj.submission_endpoint); } } catch (er) {} await renderTrackingPanel(); return; }
    try {
      const r = await readJson(SECTIONS[current].file);
      doc = r.data; sha = r.sha;
      if (current === "highlights" || current === "journals") (doc.items || []).forEach((x) => x.logo && logos.add(x.logo));
      if (current === "settings") {} // nothing extra
      renderSection();
    } catch (e) {
      if (e.status === 401) { signOut(); renderLogin("Your key has expired or was removed. Please connect again."); return; }
      if (e.status === 404) { doc = SECTIONS[current].list ? { items: [] } : {}; sha = null; renderSection(); return; }
      $(".admin-panel").innerHTML = `<p class="form-status err">Could not load: ${esc(e.message)}</p>`;
    }
  }
  // Enquiries from the Contact page are emailed to info@researchmed.in via FormSubmit.
  function trackingConfig() {
    let endpoint = "", key = "";
    try {
      endpoint = localStorage.getItem(IJAOTT_ENDPOINT_KEY) || "";
      key = localStorage.getItem(IJAOTT_ADMIN_KEY) || "";
    } catch (e) {}
    return { endpoint, key };
  }

  async function trackingRequest(endpoint, params) {
    const body = new URLSearchParams(params);
    const r = await fetch(endpoint, { method: "POST", headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}, body });
    if (!r.ok) throw new Error("Tracking service returned " + r.status);
    return r.json();
  }

  async function renderTrackingPanel() {
    const panel = $(".admin-panel");
    let cfg = trackingConfig();
    panel.innerHTML = `
      <p class="muted">Review and update IJAOTT submissions here. Authors see the same status on the public tracking page.</p>
      <form id="tracking-config" class="form contact-card">
        <label>Apps Script Web App URL<input id="ijaott-endpoint" type="url" value="${esc(cfg.endpoint)}" placeholder="https://script.google.com/macros/s/.../exec" required></label>
        <label>Admin key<input id="ijaott-key" type="password" value="${esc(cfg.key)}" placeholder="Your IJAOTT admin key" required></label>
        <div class="btn-row"><button class="btn btn-primary" type="submit">Load submissions</button></div>
      </form>
      <div id="tracking-results"></div>`;
    $("#tracking-config").addEventListener("submit", async (e) => {
      e.preventDefault();
      cfg = { endpoint: $("#ijaott-endpoint").value.trim(), key: $("#ijaott-key").value.trim() };
      try { localStorage.setItem(IJAOTT_ENDPOINT_KEY, cfg.endpoint); localStorage.setItem(IJAOTT_ADMIN_KEY, cfg.key); } catch (er) {}
      await loadTrackingRows();
    });
    if (cfg.endpoint && cfg.key) await loadTrackingRows();
  }

  async function loadTrackingRows() {
    const cfg = trackingConfig(), box = $("#tracking-results");
    if (!cfg.endpoint || !cfg.key) return;
    box.innerHTML = '<p class="muted">Loading submissions…</p>';
    try {
      const data = await trackingRequest(cfg.endpoint, {action:"listTracking", adminKey:cfg.key});
      if (!data.ok) throw new Error(data.error || "Could not load submissions.");
      const rows = data.records || [];
      box.innerHTML = rows.length ? `
        <div style="overflow:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr><th style="text-align:left;padding:10px">Reference</th><th style="text-align:left;padding:10px">Author</th><th style="text-align:left;padding:10px">Manuscript</th><th style="text-align:left;padding:10px">Status</th><th style="text-align:left;padding:10px">Stage</th><th style="text-align:left;padding:10px">Updated</th><th style="text-align:left;padding:10px">Action</th></tr></thead>
          <tbody>${rows.map((x,i)=>`
            <tr>
              <td style="padding:10px;vertical-align:top"><b>${esc(x.reference)}</b><br><small>${esc(x.email)}</small></td>
              <td style="padding:10px;vertical-align:top">${esc(x.name)}</td>
              <td style="padding:10px;vertical-align:top;min-width:220px">${esc(x.title)}</td>
              <td style="padding:10px;vertical-align:top"><select data-ts=${i} data-field="status">
                ${["Submitted","Preliminary Check","Under Review","Revision Required","Accepted","Rejected","Production","Published"].map(v=>`<option ${v===x.status?"selected":""}>${esc(v)}</option>`).join("")}
              </select></td>
              <td style="padding:10px;vertical-align:top"><select data-ts=${i} data-field="stage">
                ${["Editorial office screening","Technical/editorial check","Double-blind peer review","Author revision","Editorial decision","Accepted for publication","Copyediting/typesetting","Published online"].map(v=>`<option ${v===x.stage?"selected":""}>${esc(v)}</option>`).join("")}
              </select></td>
              <td style="padding:10px;vertical-align:top;white-space:nowrap">${esc(x.updatedAt)}</td>
              <td style="padding:10px;vertical-align:top"><textarea data-ts=${i} data-field="note" rows="3" placeholder="Editorial note">${esc(x.note)}</textarea><br><label style="display:block;margin:6px 0"><input type="checkbox" data-ts=${i} data-field="notify"> Email author</label><button class="btn btn-primary" type="button" data-update=${i}>Update</button></td>
            </tr>`).join("")}</tbody>
        </table></div>` : '<div class="empty"><strong>No IJAOTT submissions yet</strong><p>New submissions will appear here automatically.</p></div>';
      box.querySelectorAll("[data-update]").forEach(btn => btn.addEventListener("click", async () => {
        const i = Number(btn.dataset.update), x = rows[i];
        const status = box.querySelector('[data-ts="'+i+'"][data-field="status"]').value;
        const stage = box.querySelector('[data-ts="'+i+'"][data-field="stage"]').value;
        const note = box.querySelector('[data-ts="'+i+'"][data-field="note"]').value.trim();
        const notify = box.querySelector('[data-ts="'+i+'"][data-field="notify"]').checked;
        await busy(btn, async () => {
          const data = await trackingRequest(cfg.endpoint, {action:"updateTracking",adminKey:cfg.key,reference:x.reference,status,stage,note,notify:String(notify)});
          if (!data.ok) throw new Error(data.error || "Update failed.");
          toast(notify ? "Tracking updated and author notified." : "Tracking updated. The author can now see the change.");
          await loadTrackingRows();
        });
      }));
    } catch (e) {
      box.innerHTML = '<p class="form-status err">Could not load tracking: ' + esc(e.message) + '</p>';
    }
  }

  function enquiriesPanel() {
    return `<p class="muted">Every enquiry sent from the website's Contact page is emailed straight to <b>info@researchmed.in</b> (Zoho Mail), with the subject "New enquiry RMC-…". The sender automatically gets a thank-you email with the same reference number.</p>
      <div class="btn-row" style="margin-top:14px">
        <a class="btn btn-primary" href="https://mail.zoho.in" target="_blank" rel="noopener">Open Zoho Mail</a>
        <a class="btn btn-ghost" href="/contact.html" target="_blank" rel="noopener">Open contact page</a>
      </div>
      <p class="muted" style="margin-top:14px">Tip: just press Reply in Zoho Mail — it goes to the person who sent the enquiry.</p>`;
  }
  function bindTabs() {
    root.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => start(b.dataset.tab)));
    $("#signout").addEventListener("click", () => { signOut(); renderLogin(); });
  }
  function signOut() { token = ""; try { localStorage.removeItem(KEY); } catch (e) {} }

  function field(f, v) {
    const id = "f-" + f.k;
    const val = v == null ? (f.def ? f.def() : "") : v;
    if (f.t === "select") return `<label for="${id}">${f.l}<select id="${id}">${f.opts.map((o) => `<option ${o === val ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    if (f.t === "check") return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${val ? "checked" : ""}> ${f.l}</label>`;
    if (f.t === "area") return `<label for="${id}">${f.l}${f.req ? " *" : ""}<textarea id="${id}" rows="${f.req ? 5 : 3}" ${f.req ? "required" : ""}>${esc(val)}</textarea></label>`;
    if (f.t === "tags") return `<label for="${id}">${f.l}<input id="${id}" value="${esc(Array.isArray(val) ? val.join(", ") : val)}" placeholder="${esc(f.ph || "")}"></label>`;
    if (f.t === "image" || f.t === "file") {
      const opts = f.reuse && logos.size ? `<select id="${id}-pick"><option value="">— or reuse a logo already uploaded —</option>${[...logos].map((l) => `<option value="${esc(l)}" ${l === val ? "selected" : ""}>${esc(l.split("/").pop())}</option>`).join("")}</select>` : "";
      return `<div class="upl"><span class="upl-l">${f.l}${f.req ? " *" : ""}</span>
        ${val ? `<span class="upl-cur">${f.t === "image" ? `<img src="${esc(val.replace(/^\//, ""))}" alt="">` : ""}<span>${esc(String(val).split("/").pop())}</span></span>` : ""}
        <input id="${id}" type="file" ${f.t === "image" ? 'accept="image/*"' : 'accept=".pdf,.doc,.docx,.ppt,.pptx"'}>
        ${opts}<input type="hidden" id="${id}-old" value="${esc(val || "")}"></div>`;
    }
    const type = f.t === "date" ? "date" : f.t === "number" ? "number" : "text";
    return `<label for="${id}">${f.l}${f.req ? " *" : ""}<input id="${id}" type="${type}" value="${esc(val)}" placeholder="${esc(f.ph || "")}" ${f.req ? "required" : ""}></label>`;
  }

  function renderSection() {
    const s = SECTIONS[current];
    const panel = $(".admin-panel");
    if (!s.list) {
      panel.innerHTML = `<p class="muted">${s.hint}</p><form id="edit" class="form admin-form">${s.fields.map((f) => field(f, doc[f.k])).join("")}
        <div class="btn-row"><button class="btn btn-primary" type="submit">Save changes</button></div></form>`;
      $("#edit").addEventListener("submit", saveSingle);
      return;
    }
    const items = doc.items || (doc.items = []);
    panel.innerHTML = `
      <p class="muted">${s.hint}</p>
      <div class="btn-row"><button class="btn btn-primary" id="add" type="button">+ Add ${s.noun}</button></div>
      <div id="formwrap"></div>
      <ul class="admin-list">${items.length ? items.map((x, i) => `
        <li><div class="al-main"><strong>${esc(x.title || "(untitled)")}</strong><span class="muted">${esc(s.summary ? s.summary(x) : "")}</span></div>
          <div class="al-btns">
            <button type="button" data-edit="${i}">Edit</button>
            <button type="button" data-del="${i}" class="danger">Delete</button>
          </div></li>`).join("") : `<li class="muted">Nothing here yet. Click “Add ${s.noun}”.</li>`}</ul>`;
    $("#add").addEventListener("click", () => openForm(-1));
    panel.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openForm(+b.dataset.edit)));
    panel.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => confirmDelete(+b.dataset.del, b)));
  }

  function openForm(i) {
    editing = i;
    const s = SECTIONS[current], x = i >= 0 ? doc.items[i] : {};
    $("#formwrap").innerHTML = `<form id="edit" class="form admin-form contact-card">
      <h3>${i >= 0 ? "Edit" : "New"} ${s.noun}</h3>
      ${s.fields.map((f) => field(f, i >= 0 ? x[f.k] : undefined)).join("")}
      <div class="btn-row"><button class="btn btn-primary" type="submit">Save &amp; publish</button><button class="btn btn-ghost" type="button" id="cancel">Cancel</button></div></form>`;
    $("#cancel").addEventListener("click", () => { $("#formwrap").innerHTML = ""; editing = -1; });
    $("#edit").addEventListener("submit", saveItem);
    $("#edit").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function collect(fields, base) {
    const out = { ...base };
    for (const f of fields) {
      const el = $("#f-" + f.k);
      if (f.t === "check") { out[f.k] = el.checked; if (f.req && !el.checked) throw new Error("Please tick: " + f.l); }
      else if (f.t === "number") out[f.k] = el.value === "" ? "" : Number(el.value);
      else if (f.t === "tags") out[f.k] = el.value.split(",").map((v) => v.trim()).filter(Boolean);
      else if (f.t === "image" || f.t === "file") {
        const file = el.files && el.files[0];
        const pick = $("#f-" + f.k + "-pick");
        if (file) out[f.k] = await uploadFile(file, f.folder);
        else if (pick && pick.value) out[f.k] = pick.value;
        else out[f.k] = $("#f-" + f.k + "-old").value;
        if (f.req && !out[f.k]) throw new Error(`Please choose a ${f.l.toLowerCase()}.`);
      } else out[f.k] = el.value.trim();
    }
    return out;
  }

  async function busy(btn, fn) {
    const label = btn.textContent; btn.disabled = true; btn.textContent = "Saving…";
    try { await fn(); } catch (e) { toast(e.status === 409 ? "The website changed in another window. Please reload and try again." : "Could not save: " + e.message, true); btn.disabled = false; btn.textContent = label; }
  }
  async function commit(msg) {
    const text = JSON.stringify(doc, null, 2) + "\n";
    sha = await writeFile(SECTIONS[current].file, textToB64(text), sha, msg);
    toast("Saved. The website will show it in about a minute.");
  }

  async function saveItem(e) {
    e.preventDefault();
    const s = SECTIONS[current];
    await busy(e.submitter || $("#edit button[type=submit]"), async () => {
      const item = await collect(s.fields, editing >= 0 ? doc.items[editing] : {});
      if (editing >= 0) doc.items[editing] = item; else if (s.append) doc.items.push(item); else doc.items.unshift(item);
      if (current === "highlights") { if (item.featured === undefined) item.featured = true; if (item.logo) logos.add(item.logo); }
      await commit(`${editing >= 0 ? "Update" : "Add"} ${s.noun}: ${item.title || ""}`.slice(0, 70));
      editing = -1; renderSection();
    });
  }
  async function saveSingle(e) {
    e.preventDefault();
    await busy(e.submitter || $("#edit button[type=submit]"), async () => {
      doc = await collect(SECTIONS[current].fields, doc);
      await commit(current === "founder" ? "Update founder profile" : "Update site settings");
      $("#edit button[type=submit]").disabled = false; $("#edit button[type=submit]").textContent = "Save changes";
    });
  }
  function confirmDelete(i, btn) {
    if (btn.dataset.sure) {
      busyList(async () => { const t = doc.items[i].title; doc.items.splice(i, 1); await commit(`Delete ${SECTIONS[current].noun}: ${t}`.slice(0, 70)); });
    } else { btn.dataset.sure = "1"; btn.textContent = "Sure? Click again"; setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; btn.textContent = "Delete"; } }, 4000); }
  }
  function move(i, d) {
    busyList(async () => { const a = doc.items; [a[i], a[i + d]] = [a[i + d], a[i]]; await commit(`Reorder ${SECTIONS[current].label}`); });
  }
  async function busyList(fn) {
    root.querySelectorAll(".al-btns button").forEach((b) => (b.disabled = true));
    try { await fn(); } catch (e) { toast("Could not save: " + e.message, true); }
    renderSection();
  }

  if (token) start(); else renderLogin();
})();
