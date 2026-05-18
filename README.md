# DutyFlow — Institutional Duty Management System

Mobile-first PWA · React + Vite · Google Apps Script API · Google Sheets DB · Vercel

---

## Deploy in 6 Steps

### 1. Google Sheets
- Create a new Google Sheet at sheets.new
- Copy the Sheet ID from the URL bar

### 2. Apps Script
- In your sheet: Extensions → Apps Script
- Paste `backend/Code.gs`
- **Project Settings → Script Properties** → Add:
  - `SHEET_ID` = your sheet ID
  - `ADMIN_TOKEN` = any secret string (e.g. `df_2026_secret`)
- Run → **setupSheets** (creates all sheet headers)
- Run → **seedSampleData** (optional, loads demo data)
- Deploy → New Deployment → Web App
  - Execute as: **Me**
  - Who has access: **Anyone**
- Copy the Web App URL

### 3. React App (local test)
```bash
cp .env.example .env
# Edit .env → set VITE_APPS_SCRIPT_URL and VITE_ADMIN_TOKEN
npm install
npm run dev
```

### 4. GitHub
- GitHub Desktop → New Repo → point to this folder → Publish

### 5. Vercel
- vercel.com → New Project → Import GitHub repo
- Framework: **Vite**
- Add Environment Variables:
  - `VITE_APPS_SCRIPT_URL` = your Apps Script URL
  - `VITE_ADMIN_TOKEN` = your token
- Deploy → get live URL

### 6. Updates
- Edit code → GitHub Desktop → Commit + Push
- Vercel rebuilds in ~60 seconds automatically

---

## PWA Install
- **Android:** Chrome menu → Add to Home Screen
- **iOS Safari:** Share → Add to Home Screen

---

## Architecture
```
React PWA (Vercel)
    │  fetch POST (JSON + token)
    ▼
Google Apps Script Web App
    │  SpreadsheetApp.openById(SHEET_ID)
    ▼
Google Sheets (7 tabs)
  Students · Areas · DutyAssignments
  AreaHistory · ManualCredits · LeaveRecords
```

## Bug Fix Notes
- `setupSheets` no longer uses `getActiveSpreadsheet().toast()` — it was a standalone script, not sheet-bound, causing TypeError. Now uses `Logger.log()` and reads SHEET_ID from Script Properties instead of hardcoding.
