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
  const jsonCache = {};
  const getJson = (n) => (jsonCache[n] = jsonCache[n] || fetch(`content/${n}.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));
  getJson("settings").then((s) => { settings = s || {}; wa = String(settings.whatsapp || "").replace(/\D/g, ""); });
  let journal = {}; getJson("journal").then((j) => { journal = j || {}; });
  const OFFER_END = Date.parse("2026-10-16T00:00:00+05:30");
  const offerOn = () => Date.now() < OFFER_END;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canSpeak = "speechSynthesis" in window;
  let speakOn = false; try { speakOn = localStorage.getItem("rb-voice") === "1"; } catch (e) {}

  // ---------- Styles (use the site's colour tokens, so light/dark both work) ----------
  const css = `
  .rb-fab{position:fixed;right:16px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:55;width:66px;height:66px;border-radius:50%;border:3px solid #fff;cursor:pointer;background:radial-gradient(circle at 30% 25%,#2f7fd0,#1b5896 55%,#0e3d6b);box-shadow:0 10px 26px rgba(14,61,107,.45),0 0 0 0 rgba(46,230,197,.55);display:grid;place-items:center;padding:0;animation:rb-float 3.2s ease-in-out infinite,rb-ring 3.2s ease-out infinite}
  .rb-fab:hover{animation-play-state:paused} .rb-fab:hover .rb-face{transform:rotate(-8deg) scale(1.06)}
  .rb-fab .rb-face{width:50px;height:50px;transition:transform .2s;filter:drop-shadow(0 2px 2px rgba(0,0,0,.25))}
  .rb-eye{transform-box:fill-box;transform-origin:center;animation:rb-blink 4.5s infinite}
  .rb-eyes{animation:rb-look 9s ease-in-out infinite}
  .rb-tip{transform-box:fill-box;transform-origin:center;animation:rb-glow 1.8s ease-in-out infinite}
  @keyframes rb-blink{0%,90%,100%{transform:scaleY(1)}93%{transform:scaleY(.12)}96%{transform:scaleY(1)}}
  @keyframes rb-look{0%,30%,100%{transform:translateX(0)}38%,48%{transform:translateX(-2px)}56%,66%{transform:translateX(2px)}}
  @keyframes rb-glow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.85)}}
  @keyframes rb-float{0%,100%{translate:0 0}50%{translate:0 -5px}}
  @keyframes rb-ring{0%{box-shadow:0 10px 26px rgba(14,61,107,.45),0 0 0 0 rgba(46,230,197,.55)}70%,100%{box-shadow:0 10px 26px rgba(14,61,107,.45),0 0 0 14px rgba(46,230,197,0)}}
  @media (prefers-reduced-motion:reduce){.rb-fab,.rb-eye,.rb-eyes,.rb-tip{animation:none}}
  .rb-dot{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#e5484d;border:2px solid var(--surface,#fff)}
  .rb-tease{position:fixed;right:92px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:55;max-width:230px;background:var(--surface,#fff);color:var(--ink,#102338);border:1px solid var(--line,#d9e3ed);border-radius:14px 14px 4px 14px;padding:10px 32px 10px 14px;font-size:.92rem;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;animation:rb-in .3s ease-out}
  .rb-tease button{position:absolute;top:4px;right:6px;border:0;background:none;color:var(--muted,#52657b);font-size:1.1rem;cursor:pointer}
  .rb-panel{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:60;width:min(380px,calc(100vw - 24px));height:min(600px,calc(100vh - 36px));background:var(--surface,#fff);color:var(--ink,#102338);border:1px solid var(--line,#d9e3ed);border-radius:18px;box-shadow:0 18px 50px rgba(8,19,30,.32);display:flex;flex-direction:column;overflow:hidden;animation:rb-in .25s ease-out}
  @keyframes rb-in{from{opacity:0;transform:translateY(12px)}}
  .rb-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--primary,#1b5896);color:var(--on-primary,#fff)}
  .rb-av{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.16);display:grid;place-items:center;flex:none} .rb-av .rb-face{width:36px;height:36px}
  .rb-head b{display:block;font-size:1rem} .rb-head small{opacity:.85;font-size:.78rem}
  .rb-x{margin-left:auto;border:0;background:rgba(255,255,255,.15);color:inherit;width:34px;height:34px;border-radius:50%;font-size:1.2rem;cursor:pointer}
  .rb-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg,#f6f9fc)}
  .rb-m{max-width:86%;padding:10px 13px;border-radius:14px;font-size:.94rem;line-height:1.45;overflow-wrap:anywhere;animation:rb-pop .32s cubic-bezier(.2,.9,.25,1) both;transform-origin:left bottom}
  .rb-me{transform-origin:right bottom}
  @keyframes rb-pop{from{opacity:0;transform:translateY(8px) scale(.97)}}
  .rb-m.rb-txt{animation:rb-fade .25s ease-out both} @keyframes rb-fade{from{opacity:.25}}
  .rb-chips .rb-chip{animation:rb-pop .3s cubic-bezier(.2,.9,.25,1) both}
  .rb-log{scroll-behavior:smooth;overscroll-behavior:contain}
  .rb-av{position:relative}
  .rb-panel.rb-talk .rb-av::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #2ee6c5;animation:rb-talk 1s ease-out infinite}
  @keyframes rb-talk{from{opacity:.9;transform:scale(.92)}to{opacity:0;transform:scale(1.25)}}
  .rb-sub{display:inline-flex;align-items:center;gap:6px}
  .rb-fab .rb-avatar{width:58px;height:58px;filter:none} .rb-av .rb-avatar{width:40px;height:40px}
  .rb-fab{background:#fff;border-color:#fff}
  .rb-on{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:#2ecc71;border:2px solid var(--primary,#1b5896)}
  .rb-ai{display:inline-block;font-size:.62rem;font-weight:800;letter-spacing:.06em;padding:1px 6px;border-radius:999px;background:rgba(255,255,255,.2);vertical-align:2px;margin-left:4px}
  .rb-mouth{transform-box:fill-box;transform-origin:center}
  .rb-panel.rb-talk .rb-mouth{animation:rb-say .22s ease-in-out infinite alternate}
  @keyframes rb-say{from{transform:scaleY(.6)}to{transform:scaleY(1.9)}}
  .rb-w{opacity:0;animation:rb-wi .32s ease-out forwards}
  @keyframes rb-wi{from{opacity:0;filter:blur(2px)}to{opacity:1;filter:none}}
  .rb-src{display:block;margin-top:8px;font-size:.78rem;color:var(--muted,#52657b)}
  .rb-src a{font-weight:600}
  .rb-refs{margin:6px 0 0;padding-left:18px;font-size:.86rem} .rb-refs li{margin:4px 0}
  .rb-think{display:inline-flex;align-items:center;gap:8px;color:var(--muted,#52657b);font-size:.86rem}
  @media (prefers-reduced-motion:reduce){.rb-w{animation:none;opacity:1}.rb-panel.rb-talk .rb-mouth{animation:none}}
  .rb-sub .rb-wave{height:10px;display:none} .rb-panel.rb-talk .rb-sub .rb-wave{display:inline-flex}
  @media (prefers-reduced-motion:reduce){.rb-m,.rb-chips .rb-chip{animation:none}.rb-panel.rb-talk .rb-av::after{animation:none;opacity:.8}}
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
  @media (max-width:520px){.rb-fab{bottom:calc(80px + env(safe-area-inset-bottom,0px))}.rb-panel{right:12px;bottom:12px;height:calc(100vh - 24px)}.rb-tease{right:90px}}
  @media print{.rb-fab,.rb-panel,.rb-tease{display:none}}
  .rb-hb{margin-left:auto;display:flex;gap:6px} .rb-hb .rb-x{margin-left:0}
  .rb-spk{border:0;background:rgba(255,255,255,.15);color:inherit;width:34px;height:34px;border-radius:50%;cursor:pointer;display:grid;place-items:center}
  .rb-spk[aria-pressed="true"]{background:#2ee6c5;color:#062a26}
  .rb-mic{border:0;border-radius:10px;width:44px;flex:none;background:color-mix(in srgb,var(--primary,#1b5896) 12%,transparent);color:var(--primary,#1b5896);cursor:pointer;display:grid;place-items:center;position:relative}
  .rb-mic.on{background:#e5484d;color:#fff;animation:rb-mic 1.2s ease-out infinite}
  @keyframes rb-mic{0%{box-shadow:0 0 0 0 rgba(229,72,77,.55)}100%{box-shadow:0 0 0 12px rgba(229,72,77,0)}}
  .rb-foot .rb-mic{padding:0}
  .rb-listen{display:flex;align-items:center;gap:8px;font-size:.85rem;color:#e5484d;font-weight:600;padding:6px 12px 0;background:var(--surface,#fff)}
  .rb-listen[hidden]{display:none}
  .rb-wave{display:inline-flex;gap:3px;align-items:center;height:14px} .rb-wave i{width:3px;height:100%;background:currentColor;border-radius:2px;animation:rb-w .9s ease-in-out infinite} .rb-wave i:nth-child(2){animation-delay:.15s}.rb-wave i:nth-child(3){animation-delay:.3s}.rb-wave i:nth-child(4){animation-delay:.45s}
  @keyframes rb-w{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
  .rb-hot{border-color:#f0a52a;color:#a35a00;background:color-mix(in srgb,#f0a52a 12%,var(--surface,#fff))}
  .rb-hot:hover{background:#f0a52a;color:#2a1600}
  .rb-nudge{background:linear-gradient(135deg,color-mix(in srgb,#2ee6c5 16%,var(--surface,#fff)),color-mix(in srgb,var(--primary,#1b5896) 10%,var(--surface,#fff)));border:1px solid color-mix(in srgb,#2ee6c5 45%,transparent)}
  .rb-go{background:var(--primary,#1b5896);color:var(--on-primary,#fff);border-color:transparent}
  .rb-go:hover{filter:brightness(1.1)}
  .rb-step{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--teal,#0a6970);margin-bottom:2px}
  .rb-cta{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--line,#d9e3ed);background:color-mix(in srgb,#2ee6c5 10%,var(--surface,#fff));font-size:.85rem;font-weight:600}
  .rb-cta[hidden]{display:none}
  .rb-cta button{border:0;border-radius:999px;padding:7px 14px;font:inherit;font-size:.84rem;font-weight:700;cursor:pointer;color:#fff;background:linear-gradient(120deg,var(--primary,#1b5896),var(--teal,#0a6970));white-space:nowrap}`;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);

  // Friendly robot face (original artwork) — blinking eyes, glowing antenna, medical-cross tip
  let rbN = 0;
  const FACE = () => { const n = ++rbN; return `<svg class="rb-face" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="rbh${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe8f6"/></linearGradient>
    <radialGradient id="rbe${n}"><stop offset="0" stop-color="#e8fdff"/><stop offset=".55" stop-color="#5ef2ff"/><stop offset="1" stop-color="#18b8d6"/></radialGradient></defs>
    <line x1="32" y1="8" x2="32" y2="14" stroke="#cfe0f2" stroke-width="2.5" stroke-linecap="round"/>
    <circle class="rb-tip" cx="32" cy="6.5" r="4.6" fill="#2ee6c5"/>
    <path d="M32 4.4v4.2M29.9 6.5h4.2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="5" y="28" width="6" height="13" rx="3" fill="#2ee6c5"/><rect x="53" y="28" width="6" height="13" rx="3" fill="#2ee6c5"/>
    <rect x="9.5" y="13.5" width="45" height="40" rx="15" fill="url(#rbh${n})"/>
    <rect x="15.5" y="21" width="33" height="21" rx="10.5" fill="#0b2540"/>
    <g class="rb-eyes"><rect class="rb-eye" x="21.5" y="26" width="7" height="10" rx="3.5" fill="url(#rbe${n})"/><rect class="rb-eye" x="35.5" y="26" width="7" height="10" rx="3.5" fill="url(#rbe${n})"/>
    <circle cx="23.6" cy="28.4" r="1.2" fill="#fff"/><circle cx="37.6" cy="28.4" r="1.2" fill="#fff"/></g>
    <path d="M27.5 38.2q4.5 2.8 9 0" stroke="#5ef2ff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="17.5" cy="46.5" r="3" fill="#ff8fab" opacity=".55"/><circle cx="46.5" cy="46.5" r="3" fill="#ff8fab" opacity=".55"/>
    <rect x="27" y="45" width="10" height="3" rx="1.5" fill="#b9cde2"/></svg>`; };
  // Friendly illustrated assistant (original artwork): blinking eyes, mouth moves while she speaks
  const AVATAR = () => { const n = ++rbN; return `<svg class="rb-face rb-avatar" viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="avb${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a8be0"/><stop offset="1" stop-color="#0a8a93"/></linearGradient><clipPath id="avc${n}"><circle cx="32" cy="32" r="32"/></clipPath></defs>
    <circle cx="32" cy="32" r="32" fill="url(#avb${n})"/>
    <g clip-path="url(#avc${n})">
      <path d="M15 31c0-12.5 7.6-20.5 17-20.5S49 18.5 49 31v15c0 4-2.6 6.5-6 6.5H21c-3.4 0-6-2.5-6-6.5z" fill="#2b1b16"/>
      <path d="M9 66c1.5-10.5 10-16.5 23-16.5S53.5 55.5 55 66z" fill="#f4fbfb"/>
      <path d="M26.5 49.6 32 56l5.5-6.4z" fill="#0a8a93"/>
      <path d="M22 52.5c2 5 4 8 6 10M42 52.5c-2 5-4 8-6 10" stroke="#5b6b7a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <rect x="28" y="40.5" width="8" height="10" rx="3.5" fill="#e3ad87"/>
      <ellipse cx="32" cy="31.5" rx="11.3" ry="12.8" fill="#f2c6a2"/>
      <ellipse cx="20.6" cy="33" rx="1.8" ry="2.6" fill="#eab894"/><ellipse cx="43.4" cy="33" rx="1.8" ry="2.6" fill="#eab894"/>
      <path d="M20.6 30c.6-9.4 5.6-14 11.6-14 6.6 0 11.2 4.6 11.4 12.6-2.6-4.6-7.4-7.6-13.6-7.2-4.4.3-7.4 3.4-9.4 8.6z" fill="#2b1b16"/>
      <circle cx="43.6" cy="37.6" r="1.1" fill="#ffd36b"/>
      <path d="M25.2 28.4q2.4-1.3 4.8 0M34 28.4q2.4-1.3 4.8 0" stroke="#2b1b16" stroke-width="1.1" fill="none" stroke-linecap="round"/>
      <g class="rb-eye"><ellipse cx="27.6" cy="32" rx="1.45" ry="1.85" fill="#2b1b16"/><ellipse cx="36.4" cy="32" rx="1.45" ry="1.85" fill="#2b1b16"/></g>
      <circle cx="25" cy="36.4" r="2" fill="#f08f8f" opacity=".35"/><circle cx="39" cy="36.4" r="2" fill="#f08f8f" opacity=".35"/>
      <path class="rb-mouth" d="M28.6 37.6q3.4 2.8 6.8 0q-3.4 1.2-6.8 0z" fill="#b8564e" stroke="#b8564e" stroke-width="1" stroke-linejoin="round"/>
    </g></svg>`; };
  const NAME = "Riya";
  const fab = document.createElement("button");
  fab.className = "rb-fab"; fab.type = "button"; fab.setAttribute("aria-label", "Chat with Riya, the ResearchMed AI assistant");
  fab.innerHTML = AVATAR() + '<span class="rb-dot" aria-hidden="true"></span>';
  const fabWrap = document.createElement("aside"); fabWrap.setAttribute("aria-label", "Chat assistant"); fabWrap.append(fab); document.body.append(fabWrap);

  let panel, log, input, flow = null, opened = false;

  // ---------- Teaser bubble (once per visit) ----------
  let seen = false; try { seen = sessionStorage.getItem("rb-seen") === "1"; } catch (e) {}
  if (!seen) setTimeout(() => {
    if (opened) return;
    const t = document.createElement("div"); t.className = "rb-tease"; t.setAttribute("role", "status");
    t.innerHTML = 'Hi, I’m Riya 👋 Ask me anything about research or publishing. You can even <b>talk to me</b> 🎙️ <button type="button" aria-label="Dismiss">×</button>';
    t.addEventListener("click", (e) => { t.remove(); if (e.target.tagName !== "BUTTON") open(); });
    document.body.append(t); try { sessionStorage.setItem("rb-seen", "1"); } catch (e) {}
    setTimeout(() => t.remove(), 14000);
  }, 6000);

  fab.addEventListener("click", () => (panel && !panel.hidden ? close() : open()));

  function open() {
    opened = true; document.querySelector(".rb-tease")?.remove(); fab.querySelector(".rb-dot")?.remove();
    if (!panel) { build(); ["founder", "team", "notes", "books", "papers", "journal"].forEach(getJson); if (canSpeak) pickVoice(); setTimeout(buildKB, 1200); }
    panel.hidden = false; fab.hidden = true; setTimeout(() => input.focus(), 50);
  }
  function close() { panel.hidden = true; fab.hidden = false; fab.focus(); stopVoice(); }

  function build() {
    panel = document.createElement("section");
    panel.className = "rb-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "ResearchMed Assistant");
    panel.innerHTML = `<div class="rb-head"><span class="rb-av">${AVATAR()}<i class="rb-on" aria-hidden="true"></i></span><div><b>${NAME} <span class="rb-ai">AI</span></b><small class="rb-sub"><span class="rb-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="rb-subt">ResearchMed assistant · Online</span></small></div><div class="rb-hb">${canSpeak ? `<button class="rb-spk" type="button" aria-pressed="${speakOn}" aria-label="Read replies aloud" title="Read replies aloud"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg></button>` : ""}<button class="rb-x" type="button" aria-label="Close chat">×</button></div></div>
      <div class="rb-log" aria-live="polite"></div>
      <div class="rb-cta" hidden><span>✨ Got your answers? Take the next step.</span><button type="button">Send free enquiry →</button></div>
      <div class="rb-listen" hidden><span class="rb-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="rb-ltxt">Listening… speak now</span></div>
      <form class="rb-foot"><input type="text" placeholder="${SR ? "Type or tap 🎙️ to speak…" : "Type your question…"}" aria-label="Your message" autocomplete="off">${SR ? `<button class="rb-mic" type="button" aria-label="Speak your question" title="Speak your question"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg></button>` : ""}<button type="submit">Send</button></form>
      <div class="rb-note">AI assistant · answers use our website, Wikipedia and Europe PMC · our mentors confirm details · <a href="privacy.html" style="color:inherit">Privacy</a></div>`;
    document.body.append(panel);
    log = panel.querySelector(".rb-log"); input = panel.querySelector("input");
    panel.querySelector(".rb-x").addEventListener("click", close);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    panel.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; if (!listening) handsFree = false; submitText(v);
    });
    const spk = panel.querySelector(".rb-spk");
    if (spk) spk.addEventListener("click", () => { setSpeak(!speakOn); if (speakOn) speak("Voice replies are on."); });
    panel.querySelector(".rb-cta button").addEventListener("click", () => { me("Send free enquiry"); startLead("", serviceFor(lastTopic)); });
    const mic = panel.querySelector(".rb-mic");
    if (mic) mic.addEventListener("click", () => { if (listening) { handsFree = false; stopListen(); } else listen(); });
    input.addEventListener("input", () => { if (!listening) handsFree = false; });
    const hr = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
    const hello = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
    bot(`${hello}! 👋 I'm <b>Riya</b>, ResearchMed's AI assistant.<br>Ask me anything about research, writing or publishing. I'll answer from our website and trusted sources, and help you take the next step towards your publication.${SR ? " You can type, or tap 🎙️ and just talk to me." : ""}`, 900);
    menu();
  }

  // ---------- Message helpers ----------
  const scroll = () => requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
  let pendingBots = 0;
  function me(t) { const d = document.createElement("div"); d.className = "rb-m rb-me"; d.textContent = t; log.append(d); scroll(); }
  // Short, natural "typing" pause that grows a little with the length of the reply (never more than ~0.6 s)
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Wrap each word in a span that fades in after the previous one, so replies "stream" like a person typing
  function reveal(el) {
    if (reduceMotion) return 0;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (w.nextNode()) if (w.currentNode.textContent.trim()) nodes.push(w.currentNode);
    const total = nodes.reduce((n, x) => n + x.textContent.split(/\s+/).filter(Boolean).length, 0);
    const step = Math.max(9, Math.min(34, 1500 / Math.max(1, total)));
    let i = 0;
    nodes.forEach((node) => {
      const f = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return f.append(part);
        const sp = document.createElement("span"); sp.className = "rb-w"; sp.style.animationDelay = Math.round(i++ * step) + "ms"; sp.textContent = part; f.append(sp);
      });
      node.replaceWith(f);
    });
    return Math.round(i * step);
  }
  function bot(html, delay) {
    pendingBots++;
    return new Promise((res) => {
      const ty = document.createElement("div"); ty.className = "rb-m rb-bot"; ty.innerHTML = '<span class="rb-typing"><i></i><i></i><i></i></span>';
      log.append(ty); scroll();
      const len = String(html).replace(/<[^>]+>/g, "").length;
      const wait = delay == null ? Math.min(950, 420 + len * 1.1) : delay;
      setTimeout(() => {
        ty.classList.add("rb-txt"); ty.innerHTML = html; speak(html);
        const dur = reveal(ty); scroll();
        const iv = dur ? setInterval(scroll, 220) : 0;
        setTimeout(() => { clearInterval(iv); scroll(); pendingBots--; res(); }, Math.min(dur, 1700) + 60);
      }, wait);
    });
  }
  // A "thinking" bubble for answers that need a lookup; returns a function that turns it into the real reply
  function thinking(label) {
    pendingBots++;
    const ty = document.createElement("div"); ty.className = "rb-m rb-bot";
    ty.innerHTML = `<span class="rb-think"><span class="rb-typing"><i></i><i></i><i></i></span>${esc(label || "Let me check that for you…")}</span>`;
    log.append(ty); scroll();
    return (html) => new Promise((res) => {
      ty.classList.add("rb-txt"); ty.innerHTML = html; speak(html);
      const dur = reveal(ty); scroll(); const iv = dur ? setInterval(scroll, 220) : 0;
      setTimeout(() => { clearInterval(iv); scroll(); pendingBots--; res(); }, Math.min(dur, 1700) + 60);
    });
  }
  function chips(list) {
    const c = document.createElement("div"); c.className = "rb-chips";
    list.forEach(([label, fn]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "rb-chip" + (/^🎉/.test(label) ? " rb-hot" : ""); b.textContent = label;
      b.addEventListener("click", () => { c.remove(); me(label); fn(); });
      b.style.animationDelay = (c.children.length * 35) + "ms";
      c.append(b);
    });
    const put = () => (pendingBots ? setTimeout(put, 60) : (log.append(c), scroll()));
    setTimeout(put, 120);
  }
  // ---------- Voice: speech-to-text in, text-to-speech out ----------
  let rec = null, listening = false, heard = "";
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9₹ ]+/g, " ").replace(/\b(to|till|until|and|the|a|please)\b/g, " ").replace(/\b(\d+)\s*(am|pm)\s+(\d+)/g, "$1 $3").replace(/\s+/g, " ").trim();
  function setSpeak(on) {
    speakOn = !!on; try { localStorage.setItem("rb-voice", speakOn ? "1" : "0"); } catch (e) {}
    const b = panel && panel.querySelector(".rb-spk"); if (b) b.setAttribute("aria-pressed", String(speakOn));
    if (!speakOn && canSpeak) speechSynthesis.cancel();
  }
  // Female voice, best first: natural/neural voices (Edge, Chrome, Apple), Indian English where available
  let voice = null;
  const MALE = /\b(rishi|ravi|prabhat|hemant|david|mark|george|james|daniel|alex|fred|guy|ryan|thomas|oliver|arthur|aaron|male|man)\b/i;
  const FEMALE = [/neerja/i, /swara/i, /(aria|jenny|sonia|libby|natasha|clara|emma|ava|michelle|sara).*(natural|online)/i, /veena/i, /heera/i, /google uk english female/i, /google us english/i, /samantha|karen|moira|tessa|serena|fiona|victoria|allison|ava|susan|zira|hazel|kalpana|female|woman/i];
  const pickVoice = () => {
    const vs = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang) && !MALE.test(v.name));
    voice = null;
    for (const re of FEMALE) { const m = vs.filter((v) => re.test(v.name)); voice = m.find((v) => /natural|online|premium|enhanced/i.test(v.name)) || m[0]; if (voice) break; }
    voice = voice || vs.find((v) => /en-IN/i.test(v.lang)) || vs.find((v) => /en-GB/i.test(v.lang)) || vs[0] || null;
  };
  if (canSpeak) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener("voiceschanged", pickVoice); }
  function speak(html) {
    if (!speakOn || !canSpeak || !html || /rb-typing|^Sending/.test(html)) return;
    html = String(html).replace(/<span class="rb-step">.*?<\/span>(<br>)?/, "");
    const d = document.createElement("div"); d.innerHTML = String(html).replace(/<br\s*\/?>(\s*)/gi, ". ").replace(/<li>/gi, ". ");
    let t = (d.textContent || "").replace(/\(?\s*reference\s+RMC-[A-Z0-9-]+\s*\)?/gi, "").replace(/\u{1F399}\uFE0F?/gu, " the mic ").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}→←]/gu, "").replace(/(\d)\s*[–-]\s*(\d)/g, "$1 to $2").replace(/ResearchMed/g, "Research Med").replace(/IJAOTT/g, "I J A O T T").replace(/\bPh\.D\./g, "PhD").replace(/\s+/g, " ").replace(/(\.\s*){2,}/g, ". ").trim();
    if (!t) return;
    if (!voice) pickVoice();
    t = t.replace(/\s*[·|]\s*/g, ", ").replace(/\(([^)]{0,40})\)/g, ", $1,").replace(/,\s*,/g, ",").replace(/\s+([,.!?])/g, "$1");
    if (t.length > 900) t = t.slice(0, 900).replace(/[^.!?]*$/, "");
    // One utterance per reply, so the voice flows without gaps between sentences
    const u = new SpeechSynthesisUtterance(t); if (voice) u.voice = voice; u.lang = (voice && voice.lang) || "en-IN";
    const natural = voice && /natural|online|neerja|premium|enhanced|siri/i.test(voice.name);
    u.rate = natural ? 1 : 0.96; u.pitch = natural ? 1 : 1.06; u.volume = 1;
    u.onstart = () => { talking(true); keepAlive(true); }; u.onend = u.onerror = () => { keepAlive(false); setTimeout(afterSpeech, 40); };
    speechSynthesis.speak(u);
  }
  // Desktop Chrome stops long speech after ~15 s; a quick pause/resume keeps it going smoothly
  let ka = 0;
  function keepAlive(on) { clearInterval(ka); if (on && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) ka = setInterval(() => { if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); speechSynthesis.resume(); } }, 10000); }
  let handsFree = false, autoT = 0;
  function talking(on) { if (panel) panel.classList.toggle("rb-talk", on); const st = panel && panel.querySelector(".rb-subt"); if (st) st.textContent = on ? "Speaking…" : "ResearchMed assistant · Online"; }
  // When the visitor is talking by voice, listen again automatically once the reply has finished, like a real conversation
  function afterSpeech() {
    if (speechSynthesis.speaking || speechSynthesis.pending) return;
    talking(false); clearTimeout(autoT);
    const tryListen = (n) => {
      if (!handsFree || listening || !panel || panel.hidden) return;
      if (pendingBots || speechSynthesis.speaking || speechSynthesis.pending || sendingNow) { if (n < 40) autoT = setTimeout(() => tryListen(n + 1), 250); return; }
      listen(true);
    };
    autoT = setTimeout(() => tryListen(0), 450);
  }
  let sendingNow = false;
  function stopVoice() { handsFree = false; clearTimeout(autoT); if (canSpeak) speechSynthesis.cancel(); talking(false); stopListen(); }
  function listen(auto) {
    if (!SR || listening) return;
    handsFree = true;
    if (canSpeak) speechSynthesis.cancel();
    if (!speakOn) setSpeak(true); // talking to the bot turns on spoken replies
    rec = new SR(); rec.lang = "en-IN"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    heard = ""; listening = true;
    const mic = panel.querySelector(".rb-mic"), bar = panel.querySelector(".rb-listen"), lt = panel.querySelector(".rb-ltxt");
    mic.classList.add("on"); mic.setAttribute("aria-label", "Stop listening"); bar.hidden = false; lt.textContent = auto ? "I'm listening… (tap 🎙️ to stop)" : "Listening… speak now";
    rec.onresult = (e) => { let fin = "", tmp = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; (r.isFinal ? (fin += r[0].transcript) : (tmp += r[0].transcript)); } if (fin) heard += fin; input.value = (heard + " " + tmp).trim(); };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") bot("I can't hear you because microphone access is blocked. Please allow the microphone for this site in your browser settings, or just type your question.");
      else if (e.error === "no-speech") { if (!auto) bot("I didn't catch anything. Tap 🎙️ and try again, or type your question."); handsFree = false; }
      else handsFree = false;
    };
    rec.onend = () => {
      listening = false; mic.classList.remove("on"); mic.setAttribute("aria-label", "Speak your question"); bar.hidden = true;
      const v = (heard || input.value).trim(); input.value = ""; if (v) submitText(v);
    };
    try { rec.start(); } catch (e) { rec.onend(); }
  }
  function stopListen() { if (rec && listening) { try { rec.abort ? rec.abort() : rec.stop(); } catch (e) {} } }
  // Typed or spoken text: first try to match one of the buttons on screen, then the knowledge base
  function submitText(v) {
    if (canSpeak) speechSynthesis.cancel();
    const n = norm(v), lastEl = log.lastElementChild, last = lastEl && lastEl.classList.contains("rb-chips") ? lastEl : null;
    if (last && n.length >= 3) {
      // Most specific button wins: the label whose words are all in what was said, with the most words
      const said = new Set(n.split(" "));
      let btn = null, bestN = 0;
      [...last.querySelectorAll(".rb-chip")].forEach((b) => {
        const l = norm(b.textContent), ws = l.split(" ").filter(Boolean);
        const ok = l === n || (n.length >= 4 && l.includes(n)) || (ws.length && ws.every((w) => said.has(w)) && l.length >= 4);
        if (ok && ws.length > bestN) { btn = b; bestN = ws.length; }
      });
      if (btn) return btn.click();
    }
    me(v); handle(v);
  }

  const groupUrl = () => (/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(String(settings.whatsapp_group || "").trim()) ? String(settings.whatsapp_group).trim() : "https://chat.whatsapp.com/JacGKiNxqda5ZrIUpyTFft");
  function group() {
    bot(`👥 Join the <b>ResearchMed Connect WhatsApp group</b> to get calls for papers, book chapter invitations, collaboration openings and free research tips before anyone else.<br><br><a href="${esc(groupUrl())}" target="_blank" rel="noopener">👉 Join our WhatsApp group</a>`).then(moreQuiet);
  }
  const waLink = (text) => wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text || "Hello ResearchMed Connect, I would like guidance.")}` : "contact.html";
  // ---------- Encouragement: answer first, then gently invite an enquiry ----------
  let answered = 0, lastTopic = "", sent = false;
  const SERVICE = { research: "Research guidance", publication: "Publication guidance", student: "Student research support", video: "Video lecture / session", books: "Book chapter authorship", papers: "Research collaboration", thesis: "Student research support", stats: "Research guidance", plagiarism: "Publication guidance", types: "Publication guidance", predatory: "Publication guidance", fees: "", mentors: "", beginner: "" };
  const serviceFor = (k) => SERVICE[k] || "";
  const NUDGE = {
    research: "💡 Every published researcher started with just one question. Share your topic with us, and a Ph.D. mentor from your field will help you shape it.",
    publication: "💡 A well-prepared manuscript and the right journal make a real difference. Send us your draft details and we'll guide you step by step.",
    student: "💡 Your dissertation can become your first publication. Tell us where you are, and we'll help you plan the next steps.",
    fees: "💡 The quickest way to know your exact fee is a free, no-obligation quote. It takes about 2 minutes to ask.",
    mentors: "💡 We'll match you with a mentor from your own field. Tell us a little about your work to get started.",
    video: "💡 Tell us the topic and group size, and we'll plan a session around your needs.",
  };
  const GENERIC = [
    "💡 Have a project in mind? Our mentors would love to hear about it. Sending an enquiry is free and there's no obligation.",
    "🌱 Big research journeys start with small steps. Tell us what you're working on, and we'll suggest the best way forward.",
    "🎯 You're asking all the right questions! Let a Ph.D. mentor look at your specific case. It's free to ask.",
  ];
  function showCta(on) { const c = panel && panel.querySelector(".rb-cta"); if (c) c.hidden = !on || sent || !!flow; }
  const nudgeChips = () => chips([["📝 Send a free enquiry", () => startLead("", serviceFor(lastTopic))], ["📞 Free 15-min call", startCall], ["❓ Ask another question", () => bot("Of course! Ask me anything, or pick a topic:").then(menu)], ["💬 WhatsApp", whatsapp]]);
  const more = () => {
    answered++;
    if (sent) return chips([["❓ Ask another question", () => bot("Of course! What would you like to know?").then(menu)], ["💬 WhatsApp", whatsapp]]);
    showCta(true);
    // A warm line after the 1st answer, a stronger one after the 3rd, then only every 3rd answer, so it never feels pushy
    if (answered !== 1 && answered % 3 !== 0) return nudgeChips();
    const line = answered === 3 ? "🌟 You've explored a lot already, which tells us you're serious about your research! The next step is simple: send us a free enquiry and a mentor will reply within one to two working days."
      : NUDGE[lastTopic] || GENERIC[Math.floor(answered / 3) % GENERIC.length];
    bot(line, 650).then(() => { log.lastElementChild.classList.add("rb-nudge"); nudgeChips(); });
  };
  const moreQuiet = () => chips([["📝 Send a free enquiry", () => startLead("", serviceFor(lastTopic))], ["❓ Ask another question", () => bot("Of course! What would you like to know?").then(menu)]]);

  function menu() {
    chips([
      ...(offerOn() ? [["🎉 Anaesthesia Day offer", offer]] : []),
      ["📞 Free 15-min call", startCall],
      ["🔬 Research guidance", () => answer("research")],
      ["📄 Publication help", () => answer("publication")],
      ["📚 Become a book author", openBooks],
      ["🤝 Research collaboration", openPapers],
      ["💰 Fees", () => answer("fees")],
      ["👩‍🏫 Mentors", () => answer("mentors")],
      ["📖 Our journal IJAOTT", journalInfo],
      ["👥 Our team", team],
      ["📚 Free notes", notes],
      ["📝 Send an enquiry", startLead],
      ["💬 WhatsApp", whatsapp],
      ["👥 Join WhatsApp group", group],
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
    how: `Getting started is simple:<ul><li><b>1.</b> Send a free enquiry (or book a free 15-minute call)</li><li><b>2.</b> We match you with a Ph.D. mentor from your field</li><li><b>3.</b> You get a clear plan and quote, with no obligation</li><li><b>4.</b> One-to-one guidance, step by step, until submission</li></ul>`,
    online: `Yes, all our guidance is <b>online</b>, by WhatsApp, phone, email and video call (Google Meet). You can join from anywhere in India or abroad.`,
    who: `ResearchMed Connect is for <b>UG and PG students, Ph.D. scholars, faculty and working healthcare professionals</b>, at any stage, even if you have never written a paper before.`,
    beginner: `Absolutely, beginners are very welcome! 😊 Many of the people we guide are writing their <b>first paper</b>. We start from the basics and go at your pace.`,
    thesis: `Yes, we guide <b>synopsis, thesis and dissertation</b> work: topic, objectives, methodology, data analysis, writing the chapters and referencing. You do the work; we guide you so it is strong and original.`,
    stats: `Yes, we guide you on <b>statistics and data analysis</b>: choosing the right tests, sample size, using tools such as SPSS or Excel, and presenting and interpreting your results.`,
    plagiarism: `We help you write originally and cite properly: paraphrasing, referencing (Vancouver, APA) and understanding similarity reports, so your work meets journal standards ethically.`,
    types: `We guide all common article types: <b>original research, review articles, systematic reviews, case reports, short communications and letters</b>. We'll help you choose the best type for your work.`,
    predatory: `Predatory journals charge fees without real peer review and can harm your career. Warning signs: guaranteed or very fast acceptance, fake indexing claims and spam invitations. We help you choose <b>genuine indexed journals</b> instead.`,
    timeline: `It depends on your stage and the journal. Writing with guidance often takes a few weeks, and journal peer review can take from several weeks to a few months. We'll give you a realistic timeline once we know your work.`,
    start: `All you need to begin is your <b>idea or draft</b>, even a rough one. Tell us your topic, your stage (idea, data collected, draft ready) and your deadline, if any.`,
    faq: `Many common questions are answered on our <a href="faqs.html">FAQs page</a>. You can also ask me directly, for example about fees, mentors, timelines or journals.`,
    feedback: `We'd love to hear from you! Share your experience on the <a href="feedback.html">feedback page</a>, or read what others say on the home page.`,
    gallery: `See photos from our sessions and events in the <a href="gallery.html">gallery</a>, and the latest news on the <a href="updates.html">updates page</a>.`,
    contact: () => `You can reach us at <a href="mailto:${INBOX}">${INBOX}</a>${wa ? ` or on <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp (${esc(settings.whatsapp)})</a>` : ""}, or send an enquiry right here.`,
  };
  const RULES = [
    [/anaesthesia day|anesthesia day|ether day|\boffer|discount|\b2x\b|two papers|two chapters|\bdeal\b|special/i, "offer"],
    [/15.?min|free call|free consult|book (a )?call|schedule (a )?call|call ?back|talk to (a )?(mentor|expert|someone)|speak to (a )?(mentor|expert|someone)|appointment|\bmeeting\b|google meet|video call/i, "call"],
    [/ijaott|our journal|your journal|operation theatre technology journal|journal of anaes|editorial board|editor.in.chief|reviewer|peer review|submit (my |a )?(manuscript|paper|article) to|track (my )?(manuscript|submission|paper)|call for papers|inaugural issue|issn|\bapc\b/i, "journal"],
    [/\bteam\b|founder|director|who (are|runs|owns|started)|zakir|harshitha|about (you|us|the company)/i, "team"],
    [/\bnotes?\b|resources?|study material|free material|reading|learn|tutorial|blog/i, "notes"],
    [/\bfaqs?\b|common questions|frequently asked/i, "faq"],
    [/feedback|testimonial|review(s)? (of|about) you/i, "feedback"],
    [/gallery|photos?|pictures?|events?|news|updates?/i, "gallery"],
    [/when.*(reply|respond|hear)|response time|reply time|how (long|soon).*(reply|respond|hear back|get back)/i, "time"],
    [/how (does it|do you|it) work|process|procedure|steps|how to (start|begin|join)|get started/i, "how"],
    [/online|offline|location|where are you|city|visit|remote|abroad|outside india/i, "online"],
    [/beginner|first (paper|time|article)|never (written|published)|new to research|fresher|no experience/i, "beginner"],
    [/who can|eligib|for whom|can (a|an|i) (student|nurse|doctor|technician|faculty)/i, "who"],
    [/thesis|dissertation|synopsis/i, "thesis"],
    [/statistic|spss|data analysis|analy[sz]e (my )?data|sample size|p.?value|\btests?\b/i, "stats"],
    [/plagiar|similarity|turnitin|paraphras|referenc|citation|vancouver|\bapa\b/i, "plagiarism"],
    [/case report|review article|systematic review|meta.?analysis|types? of (article|paper)|short communication|letter to/i, "types"],
    [/predatory|fake journal|scam|fraud|genuine journal/i, "predatory"],
    [/how long|how much time|timeline|duration|how fast|how quickly|weeks|months/i, "timeline"],
    [/what do i need|requirement|documents|prepare before|what should i (send|share|bring)/i, "start"],
    [/\bgroup\b|community|join (the |your )?whatsapp|whatsapp (group|community|channel)|telegram/i, "group"],
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
  const BROAD = new Set(["subjects", "research", "publication", "student", "notes", "gallery", "record", "types", "stats", "plagiarism", "predatory", "thesis", "faq", "feedback"]);
  const ASKS = /^(what|whats|what's|who|whom|which|why|how (is|are|does|do|to|can|many|much)|explain|define|describe|meaning|tell me about|difference|is it true|can you explain)\b|\?$/i;
  function handle(text) {
    if (flow) return flow(text);
    const hit = RULES.find(([re]) => re.test(text));
    const k = hit ? hit[1] : null;
    // Knowledge-style questions ("what is a p value?", "explain hypoxia") get a real answer, not just our service blurb
    if (!k || (BROAD.has(k) && ASKS.test(text.trim()) && toks(text).length >= 1 && !/\b(you|your|ResearchMed|us)\b/i.test(text))) return smartAnswer(text, k);
    if (k === "books") return openBooks();
    if (k === "papers") return openPapers();
    if (k === "lead") return startLead();
    if (k === "offer") return offerOn() ? offer() : bot("Our World Anaesthesia Day offer has ended, but our regular guidance is always affordable. Want a quote?").then(more);
    if (k === "call") return startCall();
    if (k === "group") return group();
    if (k === "journal") return journalInfo(text);
    if (k === "team") return team();
    if (k === "notes") return notes();
    if (k === "hi") return bot("Hello! How can I help you today?").then(menu);
    if (k === "thanks") return bot(sent ? "You're welcome! 😊 We'll be in touch soon. All the best with your research!" : "You're welcome! 😊 Whenever you're ready, our mentors would be glad to help with your project.").then(sent ? moreQuiet : nudgeChips);
    return answer(k);
  }
  function answer(k) { if (SERVICE[k] !== undefined || NUDGE[k]) lastTopic = k; const v = A[k]; bot(typeof v === "function" ? v() : v).then(more); }
  function whatsapp() {
    bot(wa ? `Tap below to chat with us on WhatsApp:<br><br><a href="${waLink()}" target="_blank" rel="noopener">💬 Open WhatsApp (${esc(settings.whatsapp)})</a>` : A.contact()).then(moreQuiet);
  }

  // ---------- Knowledge from the website itself ----------
  const STOP = new Set("a an the is are was were be been am i me my we our you your it its of to in on at for from by with and or not no do does did can could would should will shall may might must what which who whom whose when where why how this that these those there here about into than then so if as but just also any some please tell explain define meaning mean know want need help get give show like".split(" "));
  const stem = (w) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  const toks = (t) => String(t).toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
  const clean = (t) => String(t || "").replace(/[#*_>`]+/g, " ").replace(/\s+/g, " ").trim();
  let KB = null;
  function buildKB() {
    if (KB) return KB;
    const docs = [];
    // Keep line breaks (bullets) so answers can be shown as tidy lists
    const add = (title, text, url, rec) => {
      const raw = String(text || "").replace(/\r/g, "").replace(/^\s*[*+]\s+/gm, "- ").replace(/[#*_>`]+/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
      if (raw.length < 40) return;
      const lines = raw.split("\n"); let chunk = "";
      lines.forEach((ln) => { if ((chunk + ln).length > 700 && chunk) { docs.push({ title: clean(title), text: clean(chunk), raw: chunk, url, rec }); chunk = ""; } chunk += ln + "\n"; });
      if (chunk.trim()) docs.push({ title: clean(title), text: clean(chunk), raw: chunk, url, rec });
    };
    const page = (url) => fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.text() : "")).catch(() => "").then((h) => {
      if (!h) return; const doc = new DOMParser().parseFromString(h, "text/html"), d = doc.querySelector("main") || doc.body; if (!d) return;
      d.querySelectorAll("script,style,nav,header,footer,form,button,svg,noscript,.rb-panel").forEach((x) => x.remove());
      const ttl = (doc.title || url).split("|")[0];
      d.querySelectorAll("details").forEach((x) => { const q = x.querySelector("summary"); const qt = q ? q.textContent.trim() : ttl; if (q) q.remove(); add(qt, x.textContent.replace(/\s+/g, " "), url); x.remove(); });
      let head = ttl, buf = "";
      d.querySelectorAll("h1,h2,h3,p,li").forEach((el) => { if (/^H/.test(el.tagName)) { add(head, buf, url); head = el.textContent; buf = ""; } else buf += "\n" + (el.tagName === "LI" ? "- " : "") + el.textContent.replace(/\s+/g, " ").trim(); });
      add(head, buf, url);
    });
    const items = (j) => (Array.isArray(j) ? j : (j && j.items) || []).filter((x) => x && x.title && x.draft !== true);
    KB = Promise.all([
      ...["services.html", "about.html", "faqs.html", "journal/index.html", "journal/authors.html", "journal/policies.html", "journal/submit.html", "journal/join.html"].map(page),
      getJson("notes").then((j) => items(j).forEach((n) => String(n.body || "").split(/\n(?=##\s)/).forEach((sec, i) => { const h = (sec.match(/^##\s*(.+)/) || [])[1]; add(n.title + (h ? " – " + h : ""), (i ? "" : (n.summary || "") + "\n") + sec.replace(/^##[^\n]*\n?/, ""), "notes.html"); }))),
      getJson("highlights").then((j) => items(j).forEach((x) => add(x.title, `${x.title}. Published in ${x.journal || ""} ${x.year || ""}. ${x.study_type || ""}. ${x.summary || ""}`, "highlights.html", true))),
      getJson("books").then((j) => items(j).forEach((x) => add(x.title, `${x.title}. ${x.subtitle || ""}. ${x.description || ""} Chapters: ${[].concat(x.chapters || []).join(", ")}. ${x.deadline ? "Apply by " + x.deadline + "." : ""}`, "books.html", true))),
      getJson("papers").then((j) => items(j).forEach((x) => add(x.title, `${x.title}. ${x.field || ""} ${x.study_type || ""}. ${x.description || ""} Roles: ${[].concat(x.roles || []).join(", ")}. Target journal: ${x.target_journal || ""}. ${x.deadline ? "Apply by " + x.deadline + "." : ""}`, "papers.html", true))),
      getJson("notices").then((j) => items(j).forEach((x) => add(x.title, `${x.title}. ${x.details || ""}`, x.link || "updates.html"))),
      getJson("updates").then((j) => items(j).forEach((x) => add(x.title, `${x.title}. ${x.body || ""}`, x.link || "updates.html"))),
    ]).then(() => {
      const df = {}; docs.forEach((d) => { d.t = toks(d.title + " " + d.title + " " + d.text); d.set = new Set(d.t); d.set.forEach((w) => (df[w] = (df[w] || 0) + 1)); });
      const N = docs.length || 1, avg = docs.reduce((n, d) => n + d.t.length, 0) / N;
      return { docs, idf: (w) => Math.log(1 + (N - (df[w] || 0) + 0.5) / ((df[w] || 0) + 0.5)), avg };
    });
    return KB;
  }
  async function kbSearch(q, only) {
    const kb = await buildKB(), qt = [...new Set(toks(q))]; if (!qt.length) return null;
    const recsOk = /publish|paper|article|book|chapter|collab|study|you|your|our/i.test(q) && !DEFN.test(q);
    let best = null;
    kb.docs.forEach((d) => {
      if (d.rec && !recsOk) return;
      if (only && !only(d)) return;
      let sc = 0, hit = 0;
      qt.forEach((w) => { const tf = d.t.filter((x) => x === w).length; if (tf) { hit++; sc += kb.idf(w) * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * d.t.length / kb.avg)); } });
      const cover = hit / qt.length; sc *= 0.5 + cover;
      if (!best || sc > best.sc) best = { d, sc, cover };
    });
    return best && best.cover >= (qt.length <= 2 ? 1 : 0.6) && best.sc > 2.2 ? best : null;
  }
  const DEFN = /^(what|whats|what's|who) (is|are|was|were)\b|^(define|definition|meaning|what does)\b/i;
  // Pick the lines of a passage that best match the question, in their original order
  function excerpt(d, q) {
    const qt = new Set(toks(q));
    const units = String(d.raw || d.text).split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.trim()).filter((x) => x.replace(/^- /, "").length > 12);
    const scored = units.map((u, i) => ({ u, i, s: toks(u).filter((w) => qt.has(w)).length }));
    const bul = scored.filter((x) => /^- /.test(x.u));
    if (bul.length >= 2) {
      const lead = scored.find((x) => !/^- /.test(x.u) && x.i < bul[0].i && x.u.length < 260);
      return `${lead ? esc(lead.u) : ""}<ul>${bul.slice(0, 5).map((x) => `<li>${esc(x.u.replace(/^- /, ""))}</li>`).join("")}</ul>`;
    }
    let pick = scored.filter((x) => x.s).sort((a, b) => b.s - a.s).slice(0, 3).sort((a, b) => a.i - b.i);
    if (!pick.length) pick = scored.slice(0, 2);
    const isList = pick.length > 1 && pick.every((x) => /^- /.test(x.u));
    const body = isList ? `<ul>${pick.map((x) => `<li>${esc(x.u.replace(/^- /, ""))}</li>`).join("")}</ul>` : esc(pick.map((x) => x.u.replace(/^- /, "")).join(" ")).slice(0, 460);
    return body;
  }
  const sentences = (t, max) => { const ss = String(t).match(/[^.!?]+[.!?]+/g) || [t]; let o = ""; for (const x of ss) { if ((o + x).length > max && o) break; o += x; } return o.trim(); };
  const pageName = (u) => ({ "services.html": "Services", "about.html": "About us", "faqs.html": "FAQs", "notes.html": "Free notes", "highlights.html": "Publications", "books.html": "Books", "papers.html": "Collaborate", "updates.html": "Updates" }[u] || (/^journal\//.test(u) ? "IJAOTT journal" : "our website"));

  // ---------- Trusted web sources (no key needed): Wikipedia + Europe PMC; Google if configured in Admin ----------
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms))]);
  const topicOf = (q) => String(q).replace(/[?!.]+$/g, "").replace(/^(hi|hello|hey)[,! ]+/i, "").replace(/^(please\s+)?(can|could) you (please )?(tell me|explain|define|describe)( about)?\s*/i, "").replace(/^(what|who) (is|are|was|were)( an?| the)?\s+/i, "").replace(/^(define|explain|describe|meaning of|what does|tell me about|what do you mean by)\s+/i, "").replace(/\s+(mean|means|stand for)$/i, "").trim();
  async function wiki(q) {
    const t = topicOf(q); if (t.length < 2) return null;
    const s = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(t)}&srlimit=3&format=json&origin=*`).then((r) => r.json()).catch(() => null);
    const hits = (s && s.query && s.query.search) || []; if (!hits.length) return null;
    for (const h of hits) {
      const j = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(h.title.replace(/ /g, "_"))}`).then((r) => r.json()).catch(() => null);
      if (j && j.type !== "disambiguation" && j.extract && j.extract.length > 60) return { title: j.title, text: sentences(j.extract, 420), url: (j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || `https://en.wikipedia.org/wiki/${encodeURIComponent(j.title)}` };
    }
    return null;
  }
  async function epmc(q) {
    const t = topicOf(q); if (t.length < 3) return [];
    const j = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(t)}&format=json&pageSize=3&resultType=lite&sort=CITED%20desc`).then((r) => r.json()).catch(() => null);
    return ((j && j.resultList && j.resultList.result) || []).filter((x) => x.title).slice(0, 3).map((x) => ({ title: x.title.replace(/<[^>]+>/g, ""), meta: [x.journalTitle, x.pubYear].filter(Boolean).join(", "), url: x.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${x.pmid}/` : x.doi ? `https://doi.org/${x.doi}` : `https://europepmc.org/article/${x.source}/${x.id}` }));
  }
  async function google(q) {
    const key = String(settings.google_cse_key || "").trim(), cx = String(settings.google_cse_cx || "").trim(); if (!key || !cx) return null;
    const j = await fetch(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&num=3&q=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => null);
    const it = (j && j.items) || []; return it.length ? it.slice(0, 3).map((x) => ({ title: x.title, text: x.snippet || "", url: x.link })) : null;
  }
  const safeHref = (u) => (/^https:\/\//.test(String(u)) ? esc(u) : "#");
  const RESEARCHY = /study|studies|research|evidence|trial|effect|outcome|risk|management|treatment|therapy|anaesth|anesth|surg|patient|clinical|disease|syndrome|ventilat|oxygen|drug|dose|infection|operating|theatre|theater|nurs|physio|radiolog|cardiac|dialysis|smoke|airway|sedat|analges|pain|icu|monitor/i;
  async function smartAnswer(text, k) {
    const done = thinking(/what|who|define|explain|meaning/i.test(text) ? "Looking that up for you…" : "Let me check that for you…");
    const defn = DEFN.test(text.trim());
    const wikiP = defn ? withTimeout(wiki(text), 4500) : null;
    // For definitions, only use our own page when its heading is about exactly that topic
    const tt = toks(topicOf(text));
    const site = await withTimeout(kbSearch(text, defn ? (d) => { const st = new Set(toks(d.title)); return tt.length > 0 && tt.every((w) => st.has(w)); } : null), 3500);
    if (site) {
      lastTopic = k || lastTopic || "research";
      await done(`${/^(how|what|which|why)\b/i.test(text) && site.d.title ? `<b>${esc(site.d.title)}</b><br>` : ""}${excerpt(site.d, text)}<span class="rb-src">📌 From our website: <a href="${esc(site.d.url)}">${esc(site.d.title || pageName(site.d.url))}</a></span>`);
      return more();
    }
    const [g, w, refs] = await Promise.all([withTimeout(google(text), 4500), wikiP || withTimeout(wiki(text), 4500), RESEARCHY.test(text) ? withTimeout(epmc(text), 4500) : Promise.resolve([])]);
    const topic = esc(((w && w.title) || topicOf(text)).replace(/\s*\([^)]*\)\s*$/, ""));
    if (g || w || (refs && refs.length)) {
      let h = "";
      if (g) h += `${g.map((x) => `<b>${esc(x.title)}</b>: ${esc(x.text)}`).slice(0, 2).join("<br>")}<span class="rb-src">🔎 From Google: ${g.slice(0, 2).map((x) => `<a href="${safeHref(x.url)}" target="_blank" rel="noopener">${esc(new URL(x.url).hostname.replace(/^www\./, ""))}</a>`).join(" · ")}</span>`;
      else if (w) h += `${esc(w.text)}<span class="rb-src">🌐 Source: <a href="${safeHref(w.url)}" target="_blank" rel="noopener">Wikipedia – ${esc(w.title)}</a></span>`;
      if (refs && refs.length) h += `${h ? "<br>" : ""}📚 <b>Research to read:</b><ul class="rb-refs">${refs.map((r) => `<li><a href="${safeHref(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>${r.meta ? ` <small>(${esc(r.meta)})</small>` : ""}</li>`).join("")}</ul>`;
      lastTopic = k || "research";
      await done(h);
      // Turn curiosity into a research idea: the encouraging bridge to our services
      return bot(`✨ <b>${topic}</b> is a great area to explore. Many of our authors turned a question like yours into a published review or study, and our Ph.D. mentors can help you do the same, from topic to submission.`, 500).then(() => { log.lastElementChild.classList.add("rb-nudge"); answered++; showCta(true); nudgeChips(); });
    }
    if (k) { await done(typeof A[k] === "function" ? A[k]() : A[k] || "Here's what I can share:"); lastTopic = k; return more(); }
    await done(`That's a thoughtful question! 😊 I couldn't find a reliable answer right now, but our Ph.D. mentors can answer it personally. Shall I send it to them? It's free and there's no obligation.`);
    chips([["📝 Yes, send my question", () => startLead(text)], ["📞 Ask on a free call", startCall], ["🏠 Show topics", () => { bot("Here's what I can help with:").then(menu); }]]);
  }

  // ---------- Live opportunities from the site's own content ----------
  async function list(name) {
    const j = await getJson(name); const items = (Array.isArray(j) ? j : j.items) || [];
    return items.filter((x) => x && x.title && x.draft !== true && x.open !== false && (!x.deadline || String(x.deadline) >= today));
  }
  async function openBooks() {
    const b = await list("books");
    const lines = b.slice(0, 4).map((x) => `<li><b>${esc(x.title)}</b>${x.deadline ? ` (apply by ${esc(x.deadline)})` : ""}</li>`).join("");
    await bot(`We invite chapter authors for upcoming edited books.${lines ? `<br>Currently open:<ul>${lines}</ul>` : "<br>There's no open call right now, but we can add you to our list for the next book."} <a href="books.html">See all books →</a><br><br>✍️ Becoming a published book author is a proud milestone, and we guide you through every step.`); lastTopic = "books"; showCta(true);
    chips([["✍️ Apply as chapter author", () => startLead("", "Book chapter authorship")], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("What else can I help you with?").then(menu); }]]);
  }
  async function openPapers() {
    const p = (await list("papers")).filter((x) => x.open !== false && (!x.deadline || new Date(x.deadline + "T23:59:59") >= new Date()));
    const lines = p.slice(0, 4).map((x) => `<li><b>${esc(x.title)}</b>${x.status ? ` (${esc(x.status)})` : ""}${x.deadline ? `, apply by ${esc(x.deadline)}` : ""}</li>`).join("");
    await bot(`You can collaborate on our studies from the planning stage. Authorship is earned through real contribution (ICMJE criteria).${lines ? `<br>Currently open:<ul>${lines}</ul>` : "<br>No study is open right now, but we can notify you about the next one."} <a href="papers.html">See details →</a><br><br>🤝 Collaborating is a great way to build your publication record while learning from experienced researchers.`); lastTopic = "papers"; showCta(true);
    chips([["🤝 Register interest", () => startLead("", "Research collaboration")], ["💬 WhatsApp us", whatsapp], ["🏠 Main menu", () => { bot("What else can I help you with?").then(menu); }]]);
  }

  const home = () => bot("What else can I help you with?").then(menu);
  // ---------- World Anaesthesia Day offer ----------
  function offer() {
    const ms = OFFER_END - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
    bot(`🎉 <b>World Anaesthesia Day special (16 October)</b><ul><li><b>One research collaboration, two papers</b></li><li><b>One chapter collaboration, two chapters</b></li></ul>Ends in <b>${d} day${d === 1 ? "" : "s"} ${h} hr</b> (midnight, 16 October IST). Authorship still follows real contribution (ICMJE).`).then(() =>
      chips([["🤝 Claim for papers", () => startLead("I would like to claim the World Anaesthesia Day offer: one collaboration, two papers.", "Research collaboration")], ["📚 Claim for chapters", () => startLead("I would like to claim the World Anaesthesia Day offer: one chapter collaboration, two chapters.", "Book chapter authorship")], ["💬 Claim on WhatsApp", () => bot(`Tap to claim on WhatsApp:<br><br><a href="${waLink("Hello ResearchMed Connect, I would like to claim the World Anaesthesia Day offer (one collaboration, two papers / one chapter collaboration, two chapters).")}" target="_blank" rel="noopener">💬 Open WhatsApp</a>`).then(more)], ["🏠 Main menu", home]]));
  }
  // ---------- IJAOTT journal ----------
  function journalInfo(text) {
    const J = journal || {}, t = String(text || "");
    if (/track/i.test(t)) return bot(`You can check the status of your IJAOTT submission with your manuscript ID on the <a href="journal/track.html">tracking page</a>.`).then(jChips);
    if (/reviewer|join|editorial board member|become/i.test(t)) return bot(`We welcome reviewers and editorial board members with a background in anaesthesia, OT technology or allied health. Apply on the <a href="journal/join.html">join page</a>.`).then(jChips);
    const acc = String(J.accepting) !== "false";
    bot(`📖 <b>${esc(J.title || "Indian Journal of Anaesthesia & Operation Theatre Technology")} (${esc(J.short || "IJAOTT")})</b> is our peer-reviewed, open-access journal, published by ResearchMed Connect.<ul>${J.frequency ? `<li><b>Frequency:</b> ${esc(J.frequency)}</li>` : ""}${J.review_type ? `<li><b>Review:</b> ${esc(J.review_type)}</li>` : ""}${J.licence ? `<li><b>Licence:</b> ${esc(J.licence)}</li>` : ""}${J.editor_in_chief ? `<li><b>Editor-in-Chief:</b> ${esc(J.editor_in_chief)}</li>` : ""}</ul>${acc ? `✅ <b>Now accepting submissions</b>${J.cfp_title ? `: ${esc(J.cfp_title)}` : ""}.` : ""} ${J.email ? `Journal email: <a href="mailto:${esc(J.email)}">${esc(J.email)}</a>` : ""}`).then(jChips);
  }
  const jChips = () => chips([["📤 Submit a manuscript", () => bot(`Read the <a href="journal/authors.html">author guidelines</a>, download the template, then submit on the <a href="journal/submit.html">submission page</a>.`).then(jChips)], ["🔎 Track my manuscript", () => journalInfo("track")], ["🧑‍⚖️ Become a reviewer", () => journalInfo("join")], ["👥 Editorial board", () => bot(`Meet our editors on the <a href="journal/board.html">editorial board page</a>.`).then(jChips)], ["🏠 Main menu", home]]);
  // ---------- Team ----------
  async function team() {
    const f = await getJson("founder"), t = await getJson("team");
    const people = ((t && t.items) || []).filter((x) => x && x.title && x.draft !== true).slice(0, 5);
    await bot(`${f && f.name ? `ResearchMed Connect is led by <b>${esc(f.name)}</b>${f.designation ? `, ${esc(f.designation)}` : ""}${f.qualifications ? ` (${esc(f.qualifications)})` : ""}.` : "We are a team of Ph.D. mentors from allied health."}${people.length ? `<br>Our core team:<ul>${people.map((p) => `<li><b>${esc(p.title)}</b>${p.designation ? `, ${esc(p.designation)}` : ""}</li>`).join("")}</ul>` : ""} <a href="about.html#team-section">Meet the team →</a>`);
    more();
  }
  // ---------- Free notes ----------
  async function notes() {
    const n = await getJson("notes"), items = ((n && n.items) || []).filter((x) => x && x.title && x.draft !== true).slice(0, 5);
    await bot(`📚 Free notes and guides for researchers:${items.length ? `<ul>${items.map((x) => `<li>${esc(x.title)}</li>`).join("")}</ul>` : " "}<a href="notes.html">Read all notes →</a>`);
    more();
  }
  // ---------- Free 15-minute call booking ----------
  function startCall() {
    const days = []; const fmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    for (let i = 1; days.length < 5 && i < 10; i++) { const dt = new Date(Date.now() + i * 864e5); if (dt.getDay() !== 0) days.push(fmt.format(dt)); }
    const d = { service: "Free 15-minute call", message: "" };
    const steps = [
      ["intro", "📞 <b>Free 15-minute call</b> with a Ph.D. mentor: no cost, no obligation. Let's book it. What's your <b>full name</b>?", (v) => v.length >= 2 || "Please tell me your name."],
      ["email", "Thanks! Your <b>email address</b>? We'll send the confirmation there.", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/gi, ".").replace(/\s/g, "")) || "That doesn't look like a valid email. Please type it again."],
      ["phone", "Your <b>phone / WhatsApp number</b> for the call?", (v) => /^[+\d][\d\s-]{7,}$/.test(v) || "Please enter a valid phone number."],
      ["call_date", "Which <b>day</b> suits you? Pick one, or type a date.", (v) => v.length >= 3 || "Please choose a day.", days],
      ["call_time", "Preferred <b>time (IST)</b>?", () => true, ["10–11 AM", "11 AM–12 PM", "12–1 PM", "2–3 PM", "3–4 PM", "4–5 PM", "5–6 PM", "6–7 PM", "7–8 PM"]],
      ["call_mode", "How should we <b>call you</b>?", () => true, ["WhatsApp call", "Google Meet", "Phone call"]],
      ["message", "Lastly, what would you like to <b>discuss</b>? (topic, manuscript, book chapter…)", (v) => v.length >= 3 || "Please add a few words."],
    ];
    let i = 0;
    const ask = () => { const s = steps[i]; bot(`<span class="rb-step">Step ${i + 1} of ${steps.length}</span><br>${s[1]}`).then(() => { if (s[3]) chips(s[3].map((o) => [o, () => take(o)])); }); };
    const take = (v) => {
      const s = steps[i]; let val = v.trim();
      if (s[0] === "email") val = val.replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/gi, ".").replace(/\s/g, "").toLowerCase();
      const ok = s[2](val); if (ok !== true) return bot(ok);
      d[s[0] === "intro" ? "name" : s[0]] = val; i++;
      if (i < steps.length) ask(); else { flow = null; confirm(d); }
    };
    flow = take; showCta(false); ask();
  }

  // ---------- Enquiry (lead) flow ----------
  function startLead(question, presetNeed) {
    const d = { message: question || "" , service: presetNeed || "" };
    const steps = [
      ["name", "🎉 Wonderful! This is how every publication journey begins. It takes about <b>2 minutes</b>, and it's completely free.<br><br>What's your <b>full name</b>?", (v) => v.length >= 2 || "Please enter your name."],
      ["email", "Thanks! What's your <b>email address</b>? We'll send a confirmation there.", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || "That doesn't look like a valid email. Please check and type it again."],
      ["phone", "Your <b>phone / WhatsApp number</b>? (type <i>skip</i> if you'd rather not)", (v) => /^skip$/i.test(v) || /^[+\d][\d\s-]{7,}$/.test(v) || "Please enter a valid number, or type skip."],
      ["qualification", "Your <b>qualification / designation and institution</b>? (e.g. MSc Nursing, ABC College, Pune)", () => true],
    ];
    if (!d.service) steps.push(["service", "What do you need help with?", () => true, ["Research guidance", "Publication guidance", "Free 15-minute call", "Book chapter authorship", "Research collaboration", "Student research support", "Video lecture / session", "Something else"]]);
    if (!d.message) steps.push(["message", "Almost done! 🙌 Briefly describe your project or question. A rough idea is perfectly fine.", (v) => v.length >= 3 || "Please add a few words about what you need."]);
    let i = 0;
    const ask = () => {
      const s = steps[i];
      bot(`<span class="rb-step">Step ${i + 1} of ${steps.length}</span><br>${s[1]}`).then(() => { if (s[3]) chips(s[3].map((o) => [o, () => take(o)])); });
    };
    const take = (v) => {
      const s = steps[i]; const raw = s[0] === "email" ? v.trim().replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/gi, ".").replace(/\s/g, "") : v.trim(); const ok = s[2](raw);
      if (ok !== true) return bot(ok);
      let val = v.trim(); if (s[0] === "email") val = val.replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/gi, ".").replace(/\s/g, "").toLowerCase();
      d[s[0]] = /^skip$/i.test(val) ? "-" : val; i++;
      if (i < steps.length) ask(); else { flow = null; confirm(d); }
    };
    flow = take; showCta(false);
    ask();
  }
  function confirm(d) {
    bot(`Please check your details:<ul><li><b>Name:</b> ${esc(d.name)}</li><li><b>Email:</b> ${esc(d.email)}</li><li><b>Phone:</b> ${esc(d.phone)}</li>${d.qualification ? `<li><b>About you:</b> ${esc(d.qualification)}</li>` : ""}<li><b>Need:</b> ${esc(d.service)}</li>${d.call_date ? `<li><b>Call:</b> ${esc(d.call_date)}, ${esc(d.call_time)} IST, ${esc(d.call_mode)}</li>` : ""}<li><b>Message:</b> ${esc(d.message)}</li></ul>`).then(() =>
      chips([[d.call_date ? "✅ Book my call" : "✅ Send enquiry", () => send(d)], ["✏️ Start again", () => (d.call_date ? startCall() : startLead("", ""))], ["Cancel", () => { bot("No problem, nothing was sent. Anything else?").then(menu); }]]));
  }
  async function send(d) {
    const ref = "RMC-" + today.slice(2).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const first = d.name.split(/\s+/)[0];
    const payload = {
      "Reference": ref, "Name": d.name, "Phone / WhatsApp": d.phone, "Qualification / institution": d.qualification || "-",
      ...(d.call_date ? { "Preferred call": `${d.call_date} · ${d.call_time} IST · ${d.call_mode}` } : {}),
      "Needs help with": d.service, "Message": d.message, "Source": "Website chat assistant (" + location.pathname + ")",
      email: d.email,
      _subject: d.call_date ? `Call request ${ref}: ${d.name}, ${d.call_date} ${d.call_time} IST (${d.call_mode})` : `New chat enquiry ${ref}: ${d.service} from ${d.name}`,
      _template: "table", _captcha: "false",
      _autoresponse: `Dear ${first},\n\nThank you for contacting ResearchMed Connect. ${d.call_date ? `We have received your request for a free 15-minute call (reference ${ref}).\n\nPreferred slot: ${d.call_date}, ${d.call_time} IST, by ${d.call_mode}.\n\nWe will confirm the exact time with you before the call.` : `We have received your enquiry about "${d.service}" (reference ${ref}).\n\nOur team will get back to you within one to two working days.`}${wa ? ` For anything urgent, you can WhatsApp us at ${settings.whatsapp}.` : ""}\n\nWarm regards,\nResearchMed Connect\nResearch. Learn. Publish. Grow.\nhttps://researchmed.in`,
    };
    sendingNow = true; setTimeout(() => { sendingNow = false; }, 4000);
    await bot("Sending…", 200);
    try {
      const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) !== "true") throw new Error(j.message || "failed");
      sent = true; showCta(false);
      if (d.call_date) await bot(`✅ <b>Thank you, ${esc(first)}!</b> Your call request is in (reference <b>${ref}</b>) for <b>${esc(d.call_date)}, ${esc(d.call_time)} IST</b> by ${esc(d.call_mode)}. We'll confirm the exact time before the call, and a confirmation email is on its way to ${esc(d.email)}.`);
      else await bot(`✅ <b>Thank you, ${esc(first)}!</b> Your enquiry has reached our team (reference <b>${ref}</b>). A confirmation email is on its way to ${esc(d.email)}; please check spam if you don't see it. We'll reply within one to two working days.<br><br>🌟 You've taken the most important step. We're excited to be part of your research journey!`);
      chips([["👥 Join our WhatsApp group", group], ["💬 Need it faster? WhatsApp", whatsapp], ["🏠 Main menu", () => { bot("Anything else I can help with?").then(menu); }]]);
    } catch (e) {
      const txt = `Hello ResearchMed Connect,\n\nName: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone}\nAbout me: ${d.qualification}\nNeed help with: ${d.service}${d.call_date ? `\nPreferred call: ${d.call_date}, ${d.call_time} IST, ${d.call_mode}` : ""}\n\n${d.message}`;
      await bot(`Sorry, I couldn't send that just now. Please send the same message with one tap:<br><br>${wa ? `<a href="${waLink(txt)}" target="_blank" rel="noopener">💬 Send on WhatsApp</a><br>` : ""}<a href="mailto:${INBOX}?subject=${encodeURIComponent("Enquiry: " + d.service)}&body=${encodeURIComponent(txt)}">✉️ Send by email</a>`);
    }
  }
})();
