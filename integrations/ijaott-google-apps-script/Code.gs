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

function doGet() {
  return HtmlService.createHtmlOutput(
    "<h2>IJAOTT Submission Service</h2><p>The submission service is online.</p>"
  );
}

function doPost(e) {
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

    if (!fileData) return resultPage_("No manuscript/CV file was received.", false);

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

    const driveUrl = driveFile.getUrl();
    const folderUrl = submissionFolder.getUrl();

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
    "<p><b>Uploaded file:</b> <a href='" + escAttr_(d.driveUrl) + "'>Open manuscript/CV in Google Drive</a></p>" +
    "<p><b>Submission folder:</b> <a href='" + escAttr_(d.folderUrl) + "'>Open submission folder</a></p>" +
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
