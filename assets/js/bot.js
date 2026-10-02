/* ResearchMed Connect — "ResearchMed Assistant" guide bot.
   Free, runs entirely in the browser. Answers common questions, lists open
   authorship opportunities, and sends enquiries to info@researchmed.in via FormSubmit. */
(function () {
  "use strict";
  if (window.__rmcBot) return; window.__rmcBot = true;
  const INBOX = "info@researchmed.in";
  const ENDPOINT = "https://formsubmit.co/ajax/" + INBOX;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = new Date().toISOString().slice(0, 10);
  let settings = {}, wa = "";
  const getJson = (n) => fetch(`content/${n}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  getJson("settings").then((s) => { settings = s || {}; wa = String(settings.whatsapp || "").replace(/\D/g, ""); });

  // ---------- Styles (use the site's colour tokens, so light/dark both work) ----------
  const css = `
  .rb-fab{position:fixed;right:18px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:55;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:var(--primary,#1b5896);color:var(--on-primary,#fff);box-shadow:0 8px 24px rgba(0,0,0,.28);display:grid;place-items:center;transition:transform .15s}
  .rb-fab:hover{transform:scale(1.06)} .rb-fab svg{width:28px;height:28px}
  .rb-dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#e5484d;border:2px solid var(--surface,#fff)}
  .rb-tease{position:fixed;right:86px;bottom:calc(94px + env(safe-area-inset-bottom,0px));z-index:55;max-width:230px;background:var(--surface,#fff);color:var(--ink,#102338);border:1px solid var(--line,#d9e3ed);border-radius:14px 14px 4px 14px;padding:10px 32px 10px 14px;font-size:.92rem;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;animation:rb-in .3s ease-out}
  .rb-tease button{position:absolute;top:4px;right:6px;border:0;background:none;color:var(--muted,#52657b);font-size:1.1rem;cursor:pointer}
  .rb-panel{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:60;width:min(380px,calc(100vw - 24px));height:min(600px,calc(100vh - 36px));background:var(--surface,#fff);color:var(--ink,#102338);border:1px solid var(--line,#d9e3ed);border-radius:18px;box-shadow:0 18px 50px rgba(8,19,30,.32);display:flex;flex-direction:column;overflow:hidden;animation:rb-in .25s ease-out}
  @keyframes rb-in{from{opacity:0;transform:translateY(12px)}}
  .rb-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--primary,#1b5896);color:var(--on-primary,#fff)}
  .rb-av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center;font-weight:800;flex:none}
  .rb-head b{display:block;font-size:1rem} .rb-head small{opacity:.85;font-size:.78rem}
  .rb-x{margin-left:auto;border:0;background:rgba(255,255,255,.15);color:inherit;width:34px;height:34px;border-radius:50%;font-size:1.2rem;cursor:pointer}
  .rb-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg,#f6f9fc)}
  .rb-m{max-width:86%;padding:10px 13px;border-radius:14px;font-size:.94rem;line-height:1.45;overflow-wrap:anywhere}
  .rb-m a{color:var(--primary,#1b5896);font-weight:600}
  .rb-bot{background:var(--surface,#fff);border:1px solid var(--line,#d9e3ed);border-bottom-left-radius:4px;align-self:flex-start}
  .rb-me{background:var(--primary,#1b5896);color:var(--on-primary,#fff);border-bottom-right-radius:4px;align-self:flex-end}
  .rb-m ul{margin:6px 0 0;padding-left:18px} .rb-m li{margin:3px 0}
  .rb-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}
  .rb-chip{border:1px solid color-mix(in srgb,var(--primary,#1b5896) 45%,transparent);background:var(--surface,#fff);color:var(--primary,#1b5896);border-radius:999px;padding:6px 12px;font:inherit;font-size:.85rem;font-weight:600;cursor:pointer}
  .rb-chip:hover{background:var(--primary,#1b5896);color:var(--on-primary,#fff)}
  .rb-typing{display:inline-flex;gap:4px} .rb-typing i{width:7px;height:7px;border-radius:50%;background:var(--muted,#52657b);animation:rb-b 1s infinite} .rb-typing i:nth-child(2){animation-delay:.15s} .rb-typing i:nth-child(3){animation-delay:.3s}
  @keyframes rb-b{50%{opacity:.25;transform:translateY(-3px)}}
  .rb-foot{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line,#d9e3ed);background:var(--surface,#fff)}
  .rb-foot input{flex:1;min-width:0;font:inherit;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#d9e3ed);background:var(--bg,#f6f9fc);color:var(--ink,#102338)}
  .rb-foot button{border:0;border-radius:10px;padding:0 14px;background:var(--primary,#1b5896);color:var(--on-primary,#fff);font-weight:700;cursor:pointer}
  .rb-note{font-size:.72rem;color:var(--muted,#52657b);text-align:center;padding:0 10px 8px;background:var(--surface,#fff)}
  @media (max-width:520px){.rb-fab{bottom:calc(80px + env(safe-area-inset-bottom,0px))}.rb-panel{right:12px;bottom:12px;height:calc(100vh - 24px)}.rb-tease{right:84px}}
  @media print{.rb-fab,.rb-panel,.rb-tease{display:none}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>';
  const fab = document.createElement("button");
  fab.className = "rb-fab"; fab.type = "button"; fab.setAttribute("aria-label", "Chat with ResearchMed Assistant");
  fab.innerHTML = ICON + '<span class="rb-dot" aria-hidden="true"></span>';
  document.body.append(fab);

  let panel, log, input, flow = null, opened = false;

  // ---------- Teaser bubble (once per visit) ----------
  let seen = false; try { seen = sessionStorage.getItem("rb-seen") === "1"; } catch (e) {}
  if (!seen) setTimeout(() => {
    if (opened) return;
    const t = document.createElement("div"); t.className = "rb-tease"; t.setAttribute("role", "status");
    t.innerHTML = 'Hi! 👋 Need help with research, publication or a book chapter? <button type="button" aria-label="Dismiss">×</button>';
    t.addEventListener("click", (e) => { t.remove(); if (e.target.tagName !== "BUTTON") open(); });
    document.body.append(t); try { sessionStorage.setItem("rb-seen", "1"); } catch (e) {}
    setTimeout(() => t.remove(), 14000);
  }, 6000);

  fab.addEventListener("click", () => (panel && !panel.hidden ? close() : open()));

  function open() {
    opened = true; document.querySelector(".rb-tease")?.remove(); fab.querySelector(".rb-dot")?.remove();
    if (!panel) build();
    panel.hidden = false; fab.hidden = true; setTimeout(() => input.focus(), 50);
  }
  function close() { panel.hidden = true; fab.hidden = false; fab.focus(); }

  function build() {
    panel = document.createElement("section");
    panel.className = "rb-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "ResearchMed Assistant");
    panel.innerHTML = `<div class="rb-head"><span class="rb-av">R+</span><div><b>ResearchMed Assistant</b><small>Usually replies instantly</small></div><button class="rb-x" type="button" aria-label="Close chat">×</button></div>
      <div class="rb-log" aria-live="polite"></div>
      <form class="rb-foot"><input type="text" placeholder="Type your question…" aria-label="Your message" autocomplete="off"><button type="submit">Send</button></form>
      <div class="rb-note">Automated assistant · Your details go only to ResearchMed Connect</div>`;
    document.body.append(panel);
    log = panel.querySelector(".rb-log"); input = panel.querySelector("input");
    panel.querySelector(".rb-x").addEventListener("click", close);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    panel.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; me(v); handle(v);
    });
    bot(`Hello! 👋 I'm the <b>ResearchMed Assistant</b>.<br>I can help you with research and publication guidance, book chapter authorship and co-authoring research papers. What would you like to know?`);
    menu();
  }

  // ---------- Message helpers ----------
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function me(t) { const d = document.createElement("div"); d.className = "rb-m rb-me"; d.textContent = t; log.append(d); scroll(); }
  function bot(html, delay) {
    return new Promise((res) => {
      const ty = document.createElement("div"); ty.className = "rb-m rb-bot"; ty.innerHTML = '<span class="rb-typing"><i></i><i></i><i></i></span>';
      log.append(ty); scroll();
      setTimeout(() => { ty.innerHTML = html; scroll(); res(); }, delay == null ? 450 : delay);
    });
  }
  function chips(list) {
    const c = document.createElement("div"); c.className = "rb-chips";
    list.forEach(([label, fn]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "rb-chip"; b.textContent = label;
      b.addEventListener("click", () => { c.remove(); me(label); fn(); });
      c.append(b);
    });
    setTimeout(() => { log.append(c); scroll(); }, 500);
  }
  const waLink = (text) => wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text || "Hello ResearchMed Connect, I would like guidance.")}` : "contact.html";
  const more = () => chips([["📝 Send an enquiry", startLead], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("What else can I help you with?").then(menu); }]]);

  function menu() {
    chips([
      ["🔬 Research guidance", () => answer("research")],
      ["📄 Publication help", () => answer("publication")],
      ["📚 Become a book author", openBooks],
      ["🤝 Co-author a paper", openPapers],
      ["💰 Fees", () => answer("fees")],
      ["👩‍🏫 Mentors", () => answer("mentors")],
      ["📝 Send an enquiry", startLead],
      ["💬 WhatsApp", whatsapp],
    ]);
  }

  // ---------- Knowledge ----------
  const A = {
    research: `We guide you from the first idea to a complete study plan:<ul><li>Choosing and refining your topic and research question</li><li>Aims, objectives and hypotheses</li><li>Study design, sampling and sample size</li><li>Questionnaire / data-collection tools</li><li>Data analysis and interpreting results</li><li>Ethics committee submission basics</li></ul>`,
    publication: `We help you prepare a stronger manuscript:<ul><li>Structuring it (IMRaD) and formatting to journal guidelines</li><li>Choosing a suitable journal indexed in <b>Scopus, Embase, PubMed or Web of Science</b>, and avoiding predatory journals</li><li>Cover letters, submission portals and replying to reviewers</li><li>Referencing (Vancouver, APA)</li></ul>`,
    book: `For aspiring authors we help with chapter planning, organising the manuscript, formatting, figures and permissions, ISBN and publishing options.`,
    student: `We offer affordable guidance for UG, PG and allied health students: dissertations and projects, literature reviews, referencing, and one-to-one sessions.`,
    fees: `Our guidance is <b>affordable</b>, and the fee depends on what you need (topic, stage of work and timeline). Share a few details and we'll send you a clear quote, usually within one to two working days.`,
    mentors: `Guidance is given by well-known professionals from allied health domains. <b>Every mentor holds a Ph.D. and has 7+ years</b> of teaching and research experience, and you're matched with a mentor from your own field.`,
    subjects: `We cover allied health and health sciences: anaesthesia & OT technology, medical lab technology, radiology & imaging, physiotherapy, nursing, cardiac care, dialysis, emergency care, respiratory therapy, optometry, public health and health professions education.`,
    confidential: `Yes. Your topic, data and drafts are used only to guide you and are <b>never shared or reused</b>.`,
    guarantee: `No one can honestly guarantee publication, because journals and their peer reviewers decide. We help you prepare a much stronger manuscript and choose the right journal, which greatly improves your chances.`,
    ghost: `We don't ghost-write. We give educational and editorial guidance so you produce your own original, ethical work.`,
    video: `Yes, video lectures and live online sessions are available <b>on request</b>. Tell us the topic and we'll arrange a recorded or live session for you or your group.`,
    record: () => `Our team has <b>${esc(settings.papers_submitted || 35)} papers submitted and ${esc(settings.papers_published || 28)} published</b>, including in Scopus-indexed and Elsevier journals. See them on the <a href="highlights.html">Publications</a> page.`,
    time: `We usually reply within <b>one to two working days</b>. For anything urgent, WhatsApp is fastest.`,
    contact: () => `You can reach us at <a href="mailto:${INBOX}">${INBOX}</a>${wa ? ` or on <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp (${esc(settings.whatsapp)})</a>` : ""}, or send an enquiry right here.`,
  };
  const RULES = [
    [/\bfees?\b|cost|price|charges?\b|\brates?\b|\bpay|amount|kitna|paisa|rupee|₹|budget|afford/i, "fees"],
    [/book|chapter|isbn/i, "books"],
    [/co-?author|join.*paper|paper.*join|collaborat|authorship/i, "papers"],
    [/mentor|guide\b|who.*(teach|guide)|phd|ph\.d|expert|faculty|qualif/i, "mentors"],
    [/confiden|privacy|secret|safe|share my/i, "confidential"],
    [/guarantee|\bsure\b|100%|assur|promise/i, "guarantee"],
    [/ghost|write (my|the|a) (paper|thesis|article)|do my|write for me/i, "ghost"],
    [/video|lecture|live session|webinar|workshop|class/i, "video"],
    [/subject|field|specialt|domain|nursing|physio|radiolog|\blab\b|\bmlt\b|\bot\b|anaesth|anesth|optom|dialysis|cardiac|public health/i, "subjects"],
    [/scopus|pubmed|embase|web of science|wos|index|journal|publish|manuscript|submi|review(er)?|reject|elsevier/i, "publication"],
    [/research|thesis|dissertation|topic|method|sample|statistic|analysis|questionnaire|ethic|protocol|synopsis/i, "research"],
    [/student|\bug\b|\bpg\b|\bb\.?sc\b|\bm\.?sc\b|project/i, "student"],
    [/published|record|track|how many|experience/i, "record"],
    [/how long|when.*reply|response time|reply time/i, "time"],
    [/whatsapp|\bcall\b|phone|number|email|contact|reach|talk|human|person|agent/i, "contact"],
    [/enquir|inquir|register|sign ?up|apply|start|interested|book a|appointment|quote/i, "lead"],
    [/^(hi|hello|hey|hii+|namaste|salam|good (morning|afternoon|evening))\b/i, "hi"],
    [/thank|thanks|thx|great|ok(ay)?$/i, "thanks"],
  ];
  function handle(text) {
    if (flow) return flow(text);
    const hit = RULES.find(([re]) => re.test(text));
    const k = hit ? hit[1] : null;
    if (k === "books") return openBooks();
    if (k === "papers") return openPapers();
    if (k === "lead") return startLead();
    if (k === "hi") return bot("Hello! How can I help you today?").then(menu);
    if (k === "thanks") return bot("You're welcome! 😊 Anything else I can help with?").then(more);
    if (k) return answer(k);
    bot(`I'm not sure I understood that. I can answer questions about our services, fees, mentors and authorship opportunities, or pass your question straight to our team.`).then(() =>
      chips([["📝 Send my question to the team", () => startLead(text)], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("Here's what I can help with:").then(menu); }]]));
  }
  function answer(k) { const v = A[k]; bot(typeof v === "function" ? v() : v).then(more); }
  function whatsapp() {
    bot(wa ? `Tap below to chat with us on WhatsApp:<br><br><a href="${waLink()}" target="_blank" rel="noopener">💬 Open WhatsApp (${esc(settings.whatsapp)})</a>` : A.contact()).then(more);
  }

  // ---------- Live opportunities from the site's own content ----------
  async function list(name) {
    const j = await getJson(name); const items = (Array.isArray(j) ? j : j.items) || [];
    return items.filter((x) => x && x.title && x.draft !== true && x.open !== false && (!x.deadline || String(x.deadline) >= today));
  }
  async function openBooks() {
    const b = await list("books");
    const lines = b.slice(0, 4).map((x) => `<li><b>${esc(x.title)}</b>${x.deadline ? ` (apply by ${esc(x.deadline)})` : ""}</li>`).join("");
    await bot(`We invite chapter authors for upcoming edited books.${lines ? `<br>Currently open:<ul>${lines}</ul>` : "<br>There's no open call right now, but we can add you to our list for the next book."} <a href="books.html">See all books →</a>`);
    chips([["✍️ Apply as chapter author", () => startLead("", "Book chapter authorship")], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("What else can I help you with?").then(menu); }]]);
  }
  async function openPapers() {
    const p = await list("papers");
    const lines = p.slice(0, 4).map((x) => `<li><b>${esc(x.title)}</b>${x.status ? ` (${esc(x.status)})` : ""}${x.deadline ? `, apply by ${esc(x.deadline)}` : ""}</li>`).join("");
    await bot(`You can join our research papers as a co-author.${lines ? `<br>Currently open:<ul>${lines}</ul>` : "<br>No paper is open right now, but we can notify you about the next one."} <a href="papers.html">See details →</a>`);
    chips([["🤝 Apply as co-author", () => startLead("", "Co-authorship on a research paper")], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("What else can I help you with?").then(menu); }]]);
  }

  // ---------- Enquiry (lead) flow ----------
  function startLead(question, presetNeed) {
    const d = { message: question || "" , service: presetNeed || "" };
    const steps = [
      ["name", "Great, let's send your enquiry. What's your <b>full name</b>?", (v) => v.length >= 2 || "Please enter your name."],
      ["email", "Thanks! What's your <b>email address</b>? We'll send a confirmation there.", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "That doesn't look like a valid email. Please check and type it again."],
      ["phone", "Your <b>phone / WhatsApp number</b>? (type <i>skip</i> if you'd rather not)", (v) => /^skip$/i.test(v) || /^[+\d][\d\s-]{7,}$/.test(v) || "Please enter a valid number, or type skip."],
      ["qualification", "Your <b>qualification / designation and institution</b>? (e.g. MSc Nursing, ABC College, Pune)", () => true],
    ];
    if (!d.service) steps.push(["service", "What do you need help with?", () => true, ["Research guidance", "Publication guidance", "Book chapter authorship", "Co-authorship on a research paper", "Student research support", "Video lecture / session", "Something else"]]);
    if (!d.message) steps.push(["message", "Briefly describe your project or question.", (v) => v.length >= 3 || "Please add a few words about what you need."]);
    let i = 0;
    const ask = () => {
      const s = steps[i];
      bot(s[1]).then(() => { if (s[3]) chips(s[3].map((o) => [o, () => take(o)])); });
    };
    const take = (v) => {
      const s = steps[i]; const ok = s[2](v.trim());
      if (ok !== true) return bot(ok);
      d[s[0]] = /^skip$/i.test(v.trim()) ? "-" : v.trim(); i++;
      if (i < steps.length) ask(); else { flow = null; confirm(d); }
    };
    flow = take;
    ask();
  }
  function confirm(d) {
    bot(`Please check your details:<ul><li><b>Name:</b> ${esc(d.name)}</li><li><b>Email:</b> ${esc(d.email)}</li><li><b>Phone:</b> ${esc(d.phone)}</li><li><b>About you:</b> ${esc(d.qualification)}</li><li><b>Need:</b> ${esc(d.service)}</li><li><b>Message:</b> ${esc(d.message)}</li></ul>`).then(() =>
      chips([["✅ Send enquiry", () => send(d)], ["✏️ Start again", () => startLead("", "")], ["Cancel", () => { bot("No problem, nothing was sent. Anything else?").then(menu); }]]));
  }
  async function send(d) {
    const ref = "RMC-" + today.slice(2).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const first = d.name.split(/\s+/)[0];
    const payload = {
      "Reference": ref, "Name": d.name, "Phone / WhatsApp": d.phone, "Qualification / institution": d.qualification,
      "Needs help with": d.service, "Message": d.message, "Source": "Website chat assistant (" + location.pathname + ")",
      email: d.email,
      _subject: `New chat enquiry ${ref}: ${d.service} from ${d.name}`,
      _template: "table", _captcha: "false",
      _autoresponse: `Dear ${first},\n\nThank you for contacting ResearchMed Connect. We have received your enquiry about "${d.service}" (reference ${ref}).\n\nOur team will get back to you within one to two working days.${wa ? ` For anything urgent, you can WhatsApp us at ${settings.whatsapp}.` : ""}\n\nWarm regards,\nResearchMed Connect\nResearch. Learn. Publish. Grow.\nhttps://researchmed.in`,
    };
    await bot("Sending…", 200);
    try {
      const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) !== "true") throw new Error(j.message || "failed");
      await bot(`✅ <b>Thank you, ${esc(first)}!</b> Your enquiry has reached our team (reference <b>${ref}</b>). A confirmation email is on its way to ${esc(d.email)}; please check spam if you don't see it. We'll reply within one to two working days.`);
      chips([["💬 Need it faster? WhatsApp", whatsapp], ["🏠 Main menu", () => { bot("Anything else I can help with?").then(menu); }]]);
    } catch (e) {
      const txt = `Hello ResearchMed Connect,\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nAbout me: ${d.qualification}\nNeed help with: ${d.service}\n\n${d.message}`;
      await bot(`Sorry, I couldn't send that just now. Please send the same message with one tap:<br><br>${wa ? `<a href="${waLink(txt)}" target="_blank" rel="noopener">💬 Send on WhatsApp</a><br>` : ""}<a href="mailto:${INBOX}?subject=${encodeURIComponent("Enquiry: " + d.service)}&body=${encodeURIComponent(txt)}">✉️ Send by email</a>`);
    }
  }
})();
