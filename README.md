# ResearchMed Connect — website

A fast, free-to-host website for ResearchMed Connect with an easy admin panel for adding:

- **Videos** (YouTube / Vimeo / Google Drive links, or uploaded MP4 files)
- **Notes & resources** (PDF / Word / PowerPoint uploads, or notes typed in)
- **Research highlights** (published papers with authors, journal, DOI, key findings, PDF, image)
- **Gallery** (photos with albums and captions)
- **Updates & announcements**
- **Site settings** (home page text, announcement bar, email, WhatsApp, social links)

Everything you add shows up automatically on the home page ("Latest on ResearchMed", featured highlights, videos, notes, gallery) and on its own page.

No coding, no database, no monthly cost: the site runs on **GitHub Pages** and content is edited through **Pages CMS** (free).

---

## 1. Put the website on GitHub (one time, ~5 minutes)

1. Sign in at <https://github.com> (create a free account if you do not have one).
2. Click **+ → New repository**. Name it `researchmed-connect`, choose **Public**, click **Create repository**.
3. On the new repository page click **uploading an existing file**.
4. Unzip `researchmed-connect.zip` on your computer, open the folder, select **everything inside it** (including the `.pages.yml` and `.nojekyll` files — on Windows turn on *View → Hidden items* first; on Mac press `Cmd + Shift + .`) and drag it onto the upload page. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
6. After 1–2 minutes your site is live at `https://YOUR-USERNAME.github.io/researchmed-connect/`.

## 2. Turn on the admin panel (one time)

1. Open <https://app.pagescms.org> and click **Sign in with GitHub**.
2. Allow Pages CMS to access the `researchmed-connect` repository.
3. Open the repository. You will see **Videos, Notes & Resources, Research Highlights, Gallery, Updates & Announcements, Site settings** in the left menu.

## 3. Adding content

| To add… | Go to | Tips |
|---|---|---|
| A video | **Videos → Add an entry** | Paste a YouTube link (best for long videos) or upload an MP4 under 25 MB. Tick *Feature on home page* to pin it. |
| Notes / a PDF | **Notes & Resources → Add an entry** | Upload the file. You can also type notes: `## Heading`, `- bullet`, `**bold**`. |
| A published paper | **Research Highlights → Add an entry** | Add the DOI (e.g. `10.4103/xxxx`); a DOI link is created automatically. Add each key finding as its own line. |
| Photos | **Gallery → Add an entry** | Use *Album* (e.g. "Workshops") to get filter buttons. |
| News | **Updates & Announcements** | For a banner on every page, use **Site settings → Announcement bar text**. |

Click **Save**. The website updates about a minute later (refresh the page).

The site comes with one **sample** video, note and highlight so you can see the layout — delete them once you add your own.

## 4. Optional: your own domain

Buy a domain (e.g. `researchmedconnect.in`), then in **Settings → Pages → Custom domain** enter it and follow GitHub's DNS instructions.

---

### How it works (for developers)

- Plain HTML/CSS/JS, no build step. `.nojekyll` tells GitHub Pages to serve files as-is.
- Content lives in `content/*.json`; uploads go to `media/`. `assets/js/site.js` loads the JSON and renders the pages.
- Detail pages use `item.html?c=<videos|notes|highlights>&id=<slug-of-title>`.
- Admin forms are defined in `.pages.yml`.
- Preview locally: `python3 -m http.server` in this folder, then open <http://localhost:8000>.
- GitHub rejects files over 100 MB and warns above 50 MB, so host big videos on YouTube and paste the link.
