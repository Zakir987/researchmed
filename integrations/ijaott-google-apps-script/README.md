# IJAOTT Google Apps Script submission backend

This backend receives IJAOTT submissions from the ResearchMed journal website, stores the uploaded Word/CV file in Google Drive, and emails the editorial office.

## Setup

1. Open Google Apps Script while signed into the Google account that should own the IJAOTT submissions.
2. Create a **New project**.
3. Replace `Code.gs` with `Code.gs` from this folder.
4. Save the project.
5. Deploy → New deployment → **Web app**.
6. **Execute as:** Me.
7. **Who has access:** Anyone.
8. Authorize the requested Google Drive and email permissions.
9. Copy the deployed URL ending in `/exec`.
10. Put that URL into `content/journal.json` as:
   `"submission_endpoint": "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"`

The website will then use Google Drive/Gmail instead of FormSubmit.

Google Apps Script web apps use `doPost(e)` for POST requests. The Google web-app documentation describes the event parameters passed to `doPost`; Apps Script also requires authorization for services such as Drive and email. The website therefore sends the selected file as base64 text rather than relying on multipart file handling at the Apps Script web-app boundary.

## Storage

The script automatically creates:

IJAOTT Manuscripts/
  IJAOTT-YYMMDD-XXXX/
    manuscript.docx

or, for reviewer/editor applications:

IJAOTT Manuscripts/
  IJAOTT-R-YYMMDD-XXXX/
    CV.docx / CV.pdf

No Drive folder ID needs to be hard-coded.

## Limits

The public form limits uploads to 10 MB. Apps Script has service quotas, including email recipient limits and execution limits, so this workflow is intended for normal journal submission volumes rather than bulk file processing.

## Security

The web app is public because authors are not expected to sign into Google. The script validates the reference, email, file extension and file size, and includes the site's honeypot field. Do not put Google OAuth credentials or private API keys in the public GitHub repository.


## Manuscript tracking

Every successful submission is automatically added to a **Submissions** sheet inside the **IJAOTT Manuscripts** Drive folder. The default status is **Submitted** and the stage is **Editorial office screening**.

Authors track a submission at:
https://researchmed.in/journal/track.html

They enter their IJAOTT reference number and the same email address used during submission.

### Updating a manuscript status

In Apps Script, run the function `updateTrackingStatus` with the reference number, status, stage, and optional note. Example:

    updateTrackingStatus("IJAOTT-261003-AB12", "Under Review", "Double-blind peer review", "Assigned to two external reviewers.");

Suggested statuses/stages:
- Submitted — Editorial office screening
- Preliminary Check — Technical/editorial check
- Under Review — Double-blind peer review
- Revision Required — Author revision
- Accepted — Accepted for publication
- Rejected — Editorial decision
- Production — Copyediting/typesetting
- Published — Published online

The public tracking page only returns status information after both the reference number and submission email match. It does not expose the Google Drive manuscript link.

### Important after changing Code.gs

Because this is a deployed Apps Script web app, deploy a new version after updating the code: **Deploy → Manage deployments → Edit → New version → Deploy**.
