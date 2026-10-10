# Visitor alerts on WhatsApp and email

You get a WhatsApp message (and, if you like, an email) when someone visits researchmed.in. You get one straight away when a visitor does something important: taps WhatsApp, clicks an offer, opens the chat with Riya, asks for a free call or sends an enquiry. Every evening at 9 PM you get a summary of the day.

It is free. It uses your own Google account (Apps Script) plus the free CallMeBot WhatsApp service, which sends messages only to your own number.

## What a message looks like

```
👀 Someone is on researchmed.in
Page: Books
Came from: Google search
Device: Mobile · India
First visit ever
Visitors today: 7
```

## One-time setup (about 10 minutes)

1. **Get your WhatsApp key**
   - On your phone, save **+34 644 95 73 56** as a contact named "CallMeBot".
   - Send it this WhatsApp message: `I allow callmebot to send me messages`
   - It replies with your **apikey** (a number). If no reply comes within 2 minutes, try again after 24 hours.
2. **Create the script**
   - Open <https://script.google.com> and click **New project**.
   - Name it "ResearchMed visitor alerts".
   - Delete what is in `Code.gs` and paste in the whole of [`Code.gs`](Code.gs) from this folder.
3. **Fill in three lines at the top**
   - `WA_PHONE`: your WhatsApp number with +91.
   - `WA_APIKEY`: the key from step 1. Paste it **only** in Apps Script, never on GitHub.
   - `EMAIL_TO`: where emails should go.
   - Then click 💾 **Save**.
4. **Run `setup` once**
   - Choose `setup` in the function menu at the top and click **Run**.
   - Allow the permissions Google asks for. They cover sending email, calling CallMeBot, and creating the log sheet.
   - You should get a "✅ connected" WhatsApp message and email.
5. **Publish it**
   - Click **Deploy → New deployment → ⚙ Web app**.
   - Set *Execute as*: **Me** and *Who has access*: **Anyone**.
   - Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. **Switch it on**
   - On the website, open **Admin → Numbers & contact**.
   - Paste the URL into **Visitor alerts: web app URL**, keep the tick on, and click **Save**.
   - Alerts start within about a minute.

## Good to know

- **You are not counted.** Any phone or computer where you open the Admin page is marked as yours. You can also visit `researchmed.in/?alerts=off` once on a device to mark it (use `?alerts=on` to undo).
- **Busy days.**
  - **Daily limits:** WhatsApp is capped at 40 messages a day and email at 40. Change `MAX_WHATSAPP_PER_DAY` / `MAX_EMAIL_PER_DAY` to adjust. Everything still appears in the 9 PM summary.
  - **Fewer messages:** set `ALERT_ON: "leads"` to get only hot actions plus the summary.
  - **Every page:** set `ALERT_ON: "every"` to get a message for every page opened. This is not recommended.
- **Choose channels.** For example, `visitor: "email"` sends new-visitor alerts by email only, and `visitor: ""` turns them off.
- **History.** A Google Sheet called **ResearchMed visitor log** in your Drive lists every visit and action.
- **Privacy.**
  - **What is sent:** only the page, where the visitor came from, phone or computer, time zone, language and a random visitor number.
  - **What is never sent:** names, emails, phone numbers or IP addresses.
  - **Opt-out:** visitors with "Do Not Track" or "Global Privacy Control" switched on are skipped.
  - **Policy:** the website's Privacy Policy explains this.
- **Turning it off.** Untick the box in Admin, or clear the URL.
- **If you edit `Code.gs` later.** Use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**, so the same URL keeps working.
