/**
 * ResearchMed Connect — visitor alerts on WhatsApp and email (Google Apps Script).
 *
 * What it does
 *  - The website sends an anonymous "someone is visiting" ping (page, where they came from,
 *    mobile/desktop, time zone). No names, emails, phone numbers or IP addresses.
 *  - New visitor of the day  -> WhatsApp message (and/or email, see CHANNELS below)
 *  - Hot action (WhatsApp click, offer click, chat with Riya opened, enquiry sent,
 *    event registration click) -> WhatsApp + email straight away
 *  - Every evening (9 PM India time) -> one summary: visitors, top pages, where they came from
 *  - Every ping is also written to a Google Sheet "ResearchMed visitor log" in your Drive.
 *
 * One-time setup (about 10 minutes) — see README.md in this folder for screenshots-style steps:
 *  1. WhatsApp key: save +34 644 95 73 56 in your phone as "CallMeBot", send it the WhatsApp
 *     message:  I allow callmebot to send me messages
 *     It replies with your apikey. Paste it into WA_APIKEY below.
 *  2. Fill in WA_PHONE and EMAIL_TO below.
 *  3. Run the function  setup  once (Run button) and allow the permissions.
 *  4. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > Deploy.
 *  5. Copy the Web app URL (ends in /exec) into Admin > Numbers & contact >
 *     "Visitor alerts: web app URL" on researchmed.in and Save.
 */

const CONFIG = {
  WA_PHONE: "+917006869559",          // your WhatsApp number with country code
  WA_APIKEY: "",                      // the apikey CallMeBot sends you on WhatsApp (paste it only here in Apps Script, never on GitHub)
  EMAIL_TO: "info@researchmed.in",    // where email alerts and the evening summary go

  // Which channels to use for each kind of alert: "whatsapp", "email", both, or "" for none
  CHANNELS: {
    visitor: "whatsapp",              // a new visitor arrives
    lead: "whatsapp,email",           // someone clicks WhatsApp / an offer / sends an enquiry ...
    summary: "email,whatsapp",        // the evening summary
  },
  ALERT_ON: "new",                    // "new" = first visit of each person per day, "every" = every page opened, "leads" = only hot actions
  MAX_WHATSAPP_PER_DAY: 40,           // safety caps so a busy day (or a spammer) cannot flood your phone
  MAX_EMAIL_PER_DAY: 40,
  SUMMARY_HOUR: 21,                   // 21 = 9 PM India time
  SITE: "researchmed.in",
  TZ: "Asia/Kolkata",
  KEEP_ROWS: 20000,                   // older rows in the log sheet are removed
};

/* ---------------- web app ---------------- */
function doGet() {
  return ContentService.createTextOutput("ResearchMed visitor alerts are online.");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (x) { return ok_(); }
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    handle_(d);
  } catch (err) {
    console.error(err);
  } finally {
    lock.releaseLock();
  }
  return ok_();
}

function ok_() { return ContentService.createTextOutput("ok"); }

/* ---------------- main logic ---------------- */
function handle_(raw) {
  const t = clean_(raw.t, 10);
  if (t !== "view" && t !== "lead") return;
  const d = {
    type: t,
    vid: clean_(raw.v, 20) || "unknown",
    page: clean_(raw.p, 90) || "/",
    title: clean_(raw.ti, 90).replace(/\s*\|\s*ResearchMed Connect\s*$/i, ""),
    ref: clean_(raw.r, 140),
    device: clean_(raw.m, 12),
    tz: clean_(raw.tz, 40),
    lang: clean_(raw.l, 12),
    isNew: raw.n === true || raw.n === 1 || raw.n === "1",
    kind: clean_(raw.k, 60),
    info: clean_(raw.i, 100),
    name: clean_(raw.nm, 30),
  };
  const day = state_();
  const now = new Date();
  log_(now, d);

  if (t === "view") {
    day.views++;
    const seen = day.seen.indexOf(d.vid) >= 0;
    if (!seen && day.seen.length < 900) day.seen.push(d.vid);
    const alertIt = CONFIG.ALERT_ON === "every" || (CONFIG.ALERT_ON === "new" && !seen);
    if (alertIt) {
      const lines = [
        "👀 *Someone is on researchmed.in*",
        "Page: " + (d.title || d.page),
        "Came from: " + source_(d.ref),
        "Device: " + [d.device, place_(d.tz)].filter(String).join(" · "),
        d.isNew ? "First visit ever" : "Has visited before",
        "Visitors today: " + day.seen.length,
      ];
      send_("visitor", "New visitor: " + (d.title || d.page), lines.join("\n"), day);
    }
  } else {
    day.leads.push(Utilities.formatDate(now, CONFIG.TZ, "h:mm a") + " " + d.kind + (d.info ? " (" + d.info + ")" : ""));
    if (day.leads.length > 60) day.leads.shift();
    const lines = [
      "🔥 *" + (d.kind || "Action on the website") + "*",
      d.info ? "Detail: " + d.info : "",
      d.name ? "Name: " + d.name : "",
      "Page: " + (d.title || d.page),
      "Came from: " + source_(d.ref),
      "Device: " + [d.device, place_(d.tz)].filter(String).join(" · "),
      d.kind && /enquiry|call/i.test(d.kind) ? "Full details are in your enquiry email." : "Tip: reply fast, they are on the website right now.",
    ].filter(String);
    send_("lead", "ResearchMed: " + (d.kind || "visitor action"), lines.join("\n"), day);
  }
  save_(day);
}

function send_(kind, subject, text, day) {
  const ch = String(CONFIG.CHANNELS[kind] || "");
  if (/whatsapp/.test(ch) && CONFIG.WA_APIKEY) {
    if (day.wa < CONFIG.MAX_WHATSAPP_PER_DAY) { whatsapp_(text); day.wa++; }
    else if (day.wa === CONFIG.MAX_WHATSAPP_PER_DAY) { whatsapp_("ℹ️ Busy day! WhatsApp alerts paused until tomorrow. Everything is in tonight's summary."); day.wa++; }
  }
  if (/email/.test(ch) && CONFIG.EMAIL_TO && day.mail < CONFIG.MAX_EMAIL_PER_DAY && MailApp.getRemainingDailyQuota() > 5) {
    MailApp.sendEmail({ to: CONFIG.EMAIL_TO, subject: subject, body: text.replace(/\*/g, "") + "\n\n— ResearchMed visitor alerts" , name: "ResearchMed alerts" });
    day.mail++;
  }
}

function whatsapp_(text) {
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(CONFIG.WA_PHONE.replace(/[^\d+]/g, "")) +
    "&text=" + encodeURIComponent(text) + "&apikey=" + encodeURIComponent(CONFIG.WA_APIKEY);
  try { UrlFetchApp.fetch(url, { muteHttpExceptions: true }); } catch (e) { console.error(e); }
}

/* ---------------- evening summary ---------------- */
function dailySummary() {
  const today = Utilities.formatDate(new Date(), CONFIG.TZ, "yyyy-MM-dd");
  const sh = sheet_();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 11).getValues() : [];
  const ymd = function (v) { return v instanceof Date ? Utilities.formatDate(v, CONFIG.TZ, "yyyy-MM-dd") : String(v).slice(0, 10); };
  const hm = function (v) { return v instanceof Date ? Utilities.formatDate(v, CONFIG.TZ, "h:mm a") : String(v).slice(11, 16); };
  const tr = rows.filter(function (r) { return ymd(r[0]) === today; });
  const views = tr.filter(function (r) { return r[1] === "view"; });
  const people = {}, pages = {}, refs = {}; let mobile = 0, firstTime = 0;
  views.forEach(function (r) {
    if (!people[r[7]]) {
      people[r[7]] = 1; if (r[4] === "Mobile") mobile++; if (r[8] === "first visit") firstTime++;
      const s = source_(r[3]); refs[s] = (refs[s] || 0) + 1;
    }
    pages[r[2]] = (pages[r[2]] || 0) + 1;
  });
  const n = Object.keys(people).length;
  const top = function (o, k) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, k).map(function (x) { return "  • " + x + " (" + o[x] + ")"; }).join("\n"); };
  const leads = tr.filter(function (r) { return r[1] === "lead"; }).map(function (r) { return "  • " + hm(r[0]) + " " + r[9] + (r[10] ? " (" + r[10] + ")" : ""); });
  const text = [
    "📊 *researchmed.in today*",
    "Visitors: " + n + " (" + firstTime + " new) · Pages opened: " + views.length,
    n ? "On mobile: " + Math.round((mobile / n) * 100) + "%" : "",
    n ? "\nTop pages:\n" + top(pages, 5) : "",
    n ? "\nCame from:\n" + top(refs, 4) : "",
    leads.length ? "\n🔥 Actions (" + leads.length + "):\n" + leads.slice(-10).join("\n") : "\nNo WhatsApp clicks or enquiries today.",
  ].filter(String).join("\n");
  const day = state_();
  day.wa = Math.min(day.wa, CONFIG.MAX_WHATSAPP_PER_DAY - 1); // the summary always gets through
  send_("summary", "ResearchMed today: " + n + " visitors, " + leads.length + " actions", text, day);
  save_(day);
  trim_(sh);
}

/* ---------------- storage ---------------- */
function state_() {
  const p = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), CONFIG.TZ, "yyyy-MM-dd");
  let s = {};
  try { s = JSON.parse(p.getProperty("day") || "{}"); } catch (e) {}
  if (s.date !== today) s = { date: today, views: 0, seen: [], leads: [], wa: 0, mail: 0 };
  return s;
}
function save_(s) {
  while (JSON.stringify(s).length > 8500 && s.seen.length > 50) s.seen.splice(0, 50);
  PropertiesService.getScriptProperties().setProperty("day", JSON.stringify(s));
}
function sheet_() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty("sheet"), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create("ResearchMed visitor log");
    p.setProperty("sheet", ss.getId());
    ss.getSheets()[0].appendRow(["Time (IST)", "Type", "Page", "Came from", "Device", "Time zone", "Language", "Visitor id", "Visitor", "Action", "Detail"]);
    ss.getSheets()[0].setFrozenRows(1);
    ss.setSpreadsheetTimeZone(CONFIG.TZ);
    ss.getSheets()[0].getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  }
  return ss.getSheets()[0];
}
function log_(now, d) {
  sheet_().appendRow([now, d.type, d.title || d.page, d.ref, d.device, d.tz, d.lang, d.vid, d.isNew ? "first visit" : "returning", d.kind, d.info]);
}
function trim_(sh) {
  const extra = sh.getLastRow() - 1 - CONFIG.KEEP_ROWS;
  if (extra > 0) sh.deleteRows(2, extra);
}

/* ---------------- helpers ---------------- */
function clean_(v, n) { return String(v == null ? "" : v).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n); }
function source_(ref) {
  if (!ref) return "Direct / saved link";
  const h = String(ref).replace(/^https?:\/\//, "").split(/[/?#]/)[0].replace(/^www\./, "").toLowerCase();
  const map = [[/google\./, "Google search"], [/bing\.|duckduckgo|yahoo\./, "Web search"], [/instagram|l\.instagram/, "Instagram"], [/facebook|fb\.|m\.facebook/, "Facebook"],
    [/linkedin|lnkd\.in/, "LinkedIn"], [/whatsapp|wa\.me|l\.wl\.co/, "WhatsApp"], [/youtube|youtu\.be/, "YouTube"], [/t\.co$|twitter|x\.com/, "X / Twitter"], [/chatgpt|openai|claude|perplexity|gemini/, "AI assistant"]];
  for (var i = 0; i < map.length; i++) if (map[i][0].test(h)) return map[i][1];
  return h;
}
function place_(tz) {
  if (!tz) return "";
  if (/Kolkata|Calcutta/.test(tz)) return "India";
  return tz.replace(/_/g, " ").split("/").pop();
}

/* ---------------- one-time setup & test ---------------- */
function setup() {
  sheet_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "dailySummary") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("dailySummary").timeBased().everyDays(1).atHour(CONFIG.SUMMARY_HOUR).inTimezone(CONFIG.TZ).create();
  testAlert();
  console.log("Done. Log sheet: " + SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("sheet")).getUrl());
}
function testAlert() {
  const day = state_();
  send_("lead", "ResearchMed alerts are working", "✅ *ResearchMed visitor alerts are connected.*\nYou'll get a message here when someone visits researchmed.in.", day);
  save_(day);
}
