/**
 * IJAOTT manuscript submission backend for Google Apps Script.
 *
 * Deployment:
 * 1. Create a standalone Apps Script project.
 * 2. Paste this file into Code.gs.
 * 3. Deploy > New deployment > Web app.
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy the /exec URL into content/journal.json as "submission_endpoint".
 *
 * The public website converts the selected file to base64 and posts it here.
 * The script stores it in Google Drive and emails the editorial office.
 */

const CONFIG = {
  JOURNAL_NAME: "Indian Journal of Anaesthesia & Operation Theatre Technology",
  SHORT_NAME: "IJAOTT",
  EDITORIAL_EMAIL: "ijaott@researchmed.in",
  ROOT_FOLDER: "IJAOTT Manuscripts",
  MAX_FILE_BYTES: 10 * 1024 * 1024,
  THANKS_URL: "https://researchmed.in/journal/thanks.html"
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "track") return trackResponse_(p);
  if (p.action === "health") {
    return ContentService.createTextOutput(JSON.stringify({ok:true, service:"IJAOTT"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutput(
    "<h2>IJAOTT Submission Service</h2><p>The submission service is online.</p>"
  );
}

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = String(p.action || "").toLowerCase();
  if (action === "updateTracking") return updateTrackingResponse_(p);
  if (action === "listTracking") return listTrackingResponse_(p);
  try {
    if (!e || !e.parameter) return resultPage_("Missing submission data.", false);

    const p = e.parameter;
    if (String(p._honey || "").trim()) {
      return resultPage_("Submission received.", true);
    }

    const kind = p.kind === "reviewer" ? "reviewer" : "manuscript";
    const reference = clean_(p.Reference, 80);
    const name = clean_(p.name, 200);
    const email = clean_(p.email, 320);
    const phone = clean_(p.Phone, 80);
    const institution = clean_(p.Institution, 300);
    const title = clean_(p["Manuscript title"], 500);
    const articleType = clean_(p["Article type"], 120);
    const authors = clean_(p.Authors, 5000);
    const ethics = clean_(p["Ethics / registration"], 2000);
    const guidance = clean_(p["ResearchMed guidance received"], 50);
    const qualifications = clean_(p.Qualifications, 1000);
    const expertise = clean_(p.Expertise, 2000);
    const profile = clean_(p["Profile link"], 1000);
    const role = clean_(p.Role, 100);
    const filename = cleanFilename_(p.filename || "submission.docx");
    const mimeType = clean_(p.mimeType || "application/octet-stream", 150);
    const fileData = String(p.fileData || "");

    if (!reference || !name || !email || !institution) {
      return resultPage_("Required submission details are missing.", false);
    }

    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      return resultPage_("The email address is invalid.", false);
    }

    if (kind === "manuscript" && !fileData) {
      return resultPage_("No manuscript file was received.", false);
    }

    let driveUrl = "";
    let folderUrl = "";

    if (fileData) {
      const estimatedBytes = Math.floor(fileData.length * 3 / 4);
      if (estimatedBytes > CONFIG.MAX_FILE_BYTES) {
        return resultPage_("The uploaded file is larger than 10 MB.", false);
      }

      const ext = (filename.match(/\\.([a-z0-9]+)$/i) || ["", ""])[1].toLowerCase();
      const allowed = kind === "reviewer"
        ? ["doc", "docx", "pdf"]
        : ["doc", "docx"];

      if (!allowed.includes(ext)) {
        return resultPage_("Unsupported file type. Please upload the required Word file.", false);
      }

      const bytes = Utilities.base64Decode(fileData);
      if (bytes.length > CONFIG.MAX_FILE_BYTES) {
        return resultPage_("The uploaded file is larger than 10 MB.", false);
      }

      const root = getOrCreateFolder_(CONFIG.ROOT_FOLDER);
      const submissionFolder = root.createFolder(reference);
      const blob = Utilities.newBlob(bytes, mimeType, filename);
      const driveFile = submissionFolder.createFile(blob);
      driveFile.setDescription(
        CONFIG.SHORT_NAME + " " + kind + " | " + reference + " | " + name
      );

      driveUrl = driveFile.getUrl();
      folderUrl = submissionFolder.getUrl();
    }

    const tracking = saveTrackingRecord_({
      reference, kind, name, email, institution, title, articleType
    });

    const subject = kind === "reviewer"
      ? "IJAOTT reviewer/editor application " + reference + ": " + name
      : "IJAOTT manuscript submission " + reference + ": " + title;

    const html = buildEmail_(kind, {
      reference, name, email, phone, institution, title, articleType, authors,
      ethics, guidance, qualifications, expertise, profile, role,
      filename, driveUrl, folderUrl
    });

    MailApp.sendEmail({
      to: CONFIG.EDITORIAL_EMAIL,
      subject: subject,
      body: stripHtml_(html),
      htmlBody: html,
      replyTo: email,
      name: "IJAOTT Editorial Office"
    });

    MailApp.sendEmail({
      to: email,
      subject: "IJAOTT submission received — " + reference,
      body: "Thank you for your submission. Your IJAOTT reference number is " + reference +
        ". The editorial office will review the submission and contact you using this email address.",
      name: "IJAOTT Editorial Office"
    });

    return resultPage_("Submission received successfully.", true, reference);
  } catch (err) {
    console.error(err);
    return resultPage_("We could not process the submission. Please try again or contact the editorial office.", false);
  }
}

function getOrCreateTrackingSheet_() {
  const root = getOrCreateFolder_(CONFIG.ROOT_FOLDER);
  const files = root.getFilesByName("IJAOTT Tracking");
  if (files.hasNext()) return SpreadsheetApp.openById(files.next().getId());

  const ss = SpreadsheetApp.create("IJAOTT Tracking");
  const sheet = ss.getSheets()[0];
  sheet.setName("Submissions");
  sheet.appendRow([
    "Reference", "Kind", "Name", "Email", "Institution", "Manuscript Title",
    "Article Type", "Status", "Stage", "Submitted At", "Updated At", "Editorial Note"
  ]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
  DriveApp.getFileById(ss.getId()).moveTo(root);
  return ss;
}

function saveTrackingRecord_(d) {
  const ss = getOrCreateTrackingSheet_();
  const sheet = ss.getSheetByName("Submissions");
  const now = new Date();
  sheet.appendRow([
    d.reference, d.kind, d.name, d.email, d.institution, d.title,
    d.articleType, "Submitted", "Editorial office screening", now, now, ""
  ]);
  setupTrackingSheet_(sheet);
  return ss.getUrl();
}

function setupTrackingSheet_(sheet) {
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      "Submitted",
      "Preliminary Check",
      "Under Review",
      "Revision Required",
      "Accepted",
      "Rejected",
      "Production",
      "Published"
    ], true).setAllowInvalid(false).build();

  const stageRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      "Editorial office screening",
      "Technical/editorial check",
      "Double-blind peer review",
      "Author revision",
      "Editorial decision",
      "Accepted for publication",
      "Copyediting/typesetting",
      "Published online"
    ], true).setAllowInvalid(false).build();

  const maxRows = Math.max(sheet.getMaxRows(), 1000);
  sheet.getRange(2, 8, maxRows - 1, 1).setDataValidation(statusRule);
  sheet.getRange(2, 9, maxRows - 1, 1).setDataValidation(stageRule);

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 12).createFilter();
  }
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 12);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("IJAOTT Editorial")
    .addItem("Refresh tracking controls", "setupTrackingSheet")
    .addItem("Send selected status update", "sendSelectedStatusUpdate")
    .addToUi();
}

function setupTrackingSheet() {
  const ss = getOrCreateTrackingSheet_();
  setupTrackingSheet_(ss.getSheetByName("Submissions"));
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "Submissions" || e.range.getRow() < 2) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (col !== 8 && col !== 9 && col !== 12) return;

  sheet.getRange(row, 11).setValue(new Date());

  if (col === 8 || col === 9 || col === 12) {
    const props = PropertiesService.getScriptProperties();
    props.setProperty("IJAOTT_LAST_EDIT_ROW", String(row));
  }
}

function sendSelectedStatusUpdate() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Submissions");
  if (!sheet) throw new Error("Submissions sheet not found.");

  const row = sheet.getActiveRange().getRow();
  if (row < 2) throw new Error("Select a submission row first.");

  const values = sheet.getRange(row, 1, 1, 12).getValues()[0];
  const reference = String(values[0] || "");
  const email = String(values[3] || "");
  const title = String(values[5] || "");
  const status = String(values[7] || "");
  const stage = String(values[8] || "");
  const note = String(values[11] || "");

  if (!reference || !email) throw new Error("The selected row does not contain a reference/email.");

  MailApp.sendEmail({
    to: email,
    subject: "IJAOTT manuscript status update — " + reference,
    body:
      "Dear Author,\\n\\n" +
      "There has been an update to your IJAOTT submission.\\n\\n" +
      "Reference: " + reference + "\\n" +
      "Manuscript: " + title + "\\n" +
      "Status: " + status + "\\n" +
      "Stage: " + stage + "\\n" +
      (note ? "Editorial note: " + note + "\\n" : "") +
      "\\nYou can view the current status at:\\n" +
      "https://researchmed.in/journal/track.html\\n\\n" +
      "Warm regards,\\nIJAOTT Editorial Office",
    name: "IJAOTT Editorial Office"
  });
}

function getOrCreateTrackingSheet_() {
  const root = getOrCreateFolder_(CONFIG.ROOT_FOLDER);
  const files = root.getFilesByName("IJAOTT Tracking");
  if (files.hasNext()) return SpreadsheetApp.openById(files.next().getId());

  const ss = SpreadsheetApp.create("IJAOTT Tracking");
  const sheet = ss.getSheets()[0];
  sheet.setName("Submissions");
  sheet.appendRow([
    "Reference", "Kind", "Name", "Email", "Institution", "Manuscript Title",
    "Article Type", "Status", "Stage", "Submitted At", "Updated At", "Editorial Note"
  ]);
  setupTrackingSheet_(sheet);
  return ss;
}

function findTrackingRecord_(reference, email) {
  const ss = getOrCreateTrackingSheet_();
  const sheet = ss.getSheetByName("Submissions");
  const values = sheet.getDataRange().getValues();
  const ref = String(reference || "").trim().toUpperCase();
  const mail = String(email || "").trim().toLowerCase();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]).trim().toUpperCase() === ref &&
        String(row[3]).trim().toLowerCase() === mail) {
      return {
        reference: String(row[0]),
        kind: String(row[1]),
        title: String(row[5] || ""),
        status: String(row[7] || "Submitted"),
        stage: String(row[8] || ""),
        submittedAt: formatDate_(row[9]),
        updatedAt: formatDate_(row[10]),
        note: String(row[11] || "")
      };
    }
  }
  return null;
}

function formatDate_(value) {
  if (!value) return "";
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "dd MMM yyyy, hh:mm a");
}

function trackResponse_(p) {
  const callback = String(p.prefix || "").replace(/[^a-zA-Z0-9_$.]/g, "");
  const reference = clean_(p.reference, 80);
  const email = clean_(p.email, 320);
  let result;

  if (!reference || !email) {
    result = {ok:false, error:"Please enter your reference number and submission email."};
  } else {
    const record = findTrackingRecord_(reference, email);
    result = record
      ? {ok:true, found:true, record:record}
      : {ok:true, found:false, error:"No submission was found with that reference number and email address."};
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function listTrackingResponse_(p) {
  const supplied = String(p.adminKey || "");
  const configured = PropertiesService.getScriptProperties().getProperty("IJAOTT_ADMIN_KEY") || "";
  if (!configured || supplied !== configured) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:"Unauthorized"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = getOrCreateTrackingSheet_();
  const sheet = ss.getSheetByName("Submissions");
  const values = sheet.getDataRange().getValues();
  const records = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    records.push({
      reference: String(r[0] || ""),
      kind: String(r[1] || ""),
      name: String(r[2] || ""),
      email: String(r[3] || ""),
      institution: String(r[4] || ""),
      title: String(r[5] || ""),
      articleType: String(r[6] || ""),
      status: String(r[7] || "Submitted"),
      stage: String(r[8] || ""),
      submittedAt: formatDate_(r[9]),
      updatedAt: formatDate_(r[10]),
      note: String(r[11] || "")
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ok:true,records:records}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateTrackingResponse_(p) {
  const supplied = String(p.adminKey || "");
  const configured = PropertiesService.getScriptProperties().getProperty("IJAOTT_ADMIN_KEY") || "";
  if (!configured || supplied !== configured) {
    return ContentService.createTextOutput(JSON.stringify({ok:false, error:"Unauthorized"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const reference = clean_(p.reference, 80);
  const status = clean_(p.status, 100);
  const stage = clean_(p.stage, 160);
  const note = clean_(p.note, 2000);

  if (!reference) return ContentService.createTextOutput(JSON.stringify({ok:false,error:"Reference is required."}))
    .setMimeType(ContentService.MimeType.JSON);

  try {
    const message = updateTrackingStatus(reference, status, stage, note);
    const notify = String(p.notify || "").toLowerCase() === "true";
    if (notify) sendTrackingEmailByReference_(reference);
    return ContentService.createTextOutput(JSON.stringify({ok:true,message:message,notified:notify}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendTrackingEmailByReference_(reference) {
  const ss = getOrCreateTrackingSheet_();
  const sheet = ss.getSheetByName("Submissions");
  const values = sheet.getDataRange().getValues();
  const ref = String(reference || "").trim().toUpperCase();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]).trim().toUpperCase() !== ref) continue;

    const email = String(row[3] || "").trim();
    if (!email) throw new Error("No author email found for " + ref);

    const title = String(row[5] || "");
    const status = String(row[7] || "");
    const stage = String(row[8] || "");
    const note = String(row[11] || "");

    MailApp.sendEmail({
      to: email,
      subject: "IJAOTT manuscript status update — " + ref,
      body:
        "Dear Author,\\n\\n" +
        "There has been an update to your IJAOTT submission.\\n\\n" +
        "Reference: " + ref + "\\n" +
        "Manuscript: " + title + "\\n" +
        "Status: " + status + "\\n" +
        "Stage: " + stage + "\\n" +
        (note ? "Editorial note: " + note + "\\n" : "") +
        "\\nTrack your submission here:\\n" +
        "https://researchmed.in/journal/track.html\\n\\n" +
        "Warm regards,\\nIJAOTT Editorial Office",
      name: "IJAOTT Editorial Office"
    });
    return;
  }
  throw new Error("Reference not found: " + ref);
}

function updateTrackingStatus(reference, status, stage, note) {
  const ss = getOrCreateTrackingSheet_();
  const sheet = ss.getSheetByName("Submissions");
  const values = sheet.getDataRange().getValues();
  const ref = String(reference || "").trim().toUpperCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toUpperCase() === ref) {
      const row = i + 1;
      sheet.getRange(row, 8).setValues([[String(status || "Submitted")]]);
      sheet.getRange(row, 9).setValue(String(stage || ""));
      sheet.getRange(row, 11).setValue(new Date());
      sheet.getRange(row, 12).setValue(String(note || ""));
      return "Updated " + ref;
    }
  }
  throw new Error("Reference not found: " + ref);
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

function clean_(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function cleanFilename_(value) {
  const name = clean_(value, 180).replace(/[\\/:*?"<>|\\x00-\\x1F]/g, "_");
  return name || "submission.docx";
}

function buildEmail_(kind, d) {
  const heading = kind === "reviewer" ? "Reviewer / Editor Application" : "Manuscript Submission";
  const rows = [
    ["Reference", d.reference],
    ["Name", d.name],
    ["Email", d.email],
    ["Phone / WhatsApp", d.phone],
    ["Institution", d.institution],
    ["Manuscript title", d.title],
    ["Article type", d.articleType],
    ["Authors", d.authors],
    ["Ethics / registration", d.ethics],
    ["ResearchMed guidance", d.guidance],
    ["Qualifications", d.qualifications],
    ["Expertise", d.expertise],
    ["Profile link", d.profile],
    ["Role", d.role],
    ["File", d.filename],
  ].filter(x => x[1]);

  return "<div style='font-family:Arial,sans-serif;line-height:1.55'>" +
    "<h2>IJAOTT — " + esc_(heading) + "</h2>" +
    "<table cellpadding='7' cellspacing='0' border='1' style='border-collapse:collapse'>" +
    rows.map(x => "<tr><td><b>" + esc_(x[0]) + "</b></td><td>" + esc_(x[1]).replace(/\\n/g, "<br>") + "</td></tr>").join("") +
    "</table>" +
    (d.driveUrl ? "<p><b>Uploaded file:</b> <a href='" + escAttr_(d.driveUrl) + "'>Open manuscript/CV in Google Drive</a></p>" : "") +
    (d.folderUrl ? "<p><b>Submission folder:</b> <a href='" + escAttr_(d.folderUrl) + "'>Open submission folder</a></p>" : "") +
    "<p>Submitted through researchmed.in.</p>" +
    "</div>";
}

function resultPage_(message, success, reference) {
  const url = success
    ? CONFIG.THANKS_URL + "?reference=" + encodeURIComponent(reference || "")
    : "https://researchmed.in/journal/submit.html?error=" + encodeURIComponent(message);

  const safeMessage = esc_(message);
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><head><meta charset='utf-8'>" +
    (success ? "<meta http-equiv='refresh' content='0;url=" + escAttr_(url) + "'>" : "") +
    "<style>body{font-family:Arial,sans-serif;max-width:700px;margin:80px auto;padding:24px;text-align:center}a{color:#1b5896}</style>" +
    "</head><body><h2>" + (success ? "Submission received" : "Submission could not be completed") +
    "</h2><p>" + safeMessage + "</p>" +
    (success ? "<p>Redirecting…</p>" : "<p><a href='https://researchmed.in/journal/submit.html'>Return to submission form</a></p>") +
    "</body></html>"
  );
}

function esc_(value) {
  return String(value == null ? "" : value).replace(/[&<>"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[c]));
}

function escAttr_(value) {
  return esc_(value).replace(/'/g, "&#39;");
}

function stripHtml_(html) {
  return html.replace(/<br\\s*\\/?>(?=.)/gi, "\\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}
