# Drive Access Manager - Nuclear Mode

Google Apps Script to remove ALL sharing permissions from your entire Google Drive (40k+ files).

## What It Does

- **Removes "Anyone with link"** → Makes files Restricted
- **Removes all Editors** (except owner)
- **Removes all Viewers** (except owner)
- **Logs everything** to a spreadsheet for audit trail
- **Handles 40k+ files** via automatic batching and triggers

## Setup

```bash
# 1. Install CLASP globally
npm install -g @google/clasp

# 2. Login to Google
clasp login

# 3. Create the Apps Script project (bound to a new Sheet)
clasp create --type sheets --title "Drive Access Manager"

# 4. Push the code
clasp push

# 5. Open the Sheet
clasp open
```

## Usage

1. Open the Google Sheet
2. Click menu: **Drive Access Manager → Start Nuclear Mode**
3. Confirm the warning dialog
4. Script runs automatically in background (check "Stats" sheet for progress)
5. You'll receive an email when complete

## Features

| Feature | Description |
|---------|-------------|
| **Resumable** | Saves progress, can stop/start anytime |
| **Batched** | Processes ~1000 files per 5-min run |
| **Auto-trigger** | Continues automatically until done |
| **Full logging** | Every removed permission logged with file details |
| **Email notification** | Get notified when complete |

## OAuth Scopes Required

- `drive` - Full Drive access to modify permissions
- `spreadsheets` - Log results to the bound Sheet
- `gmail.send` - Send completion notification email
- `script.scriptapp` - Create time-based triggers
