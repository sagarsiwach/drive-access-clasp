# Drive Access Manager

Google Apps Script to manage and audit sharing permissions across your entire Google Drive.

## Features

- **Scan**: Audit all 40k+ files to see who has access
- **Report**: Generate spreadsheet with all sharing details
- **Bulk Remove**: Remove all external sharing at once
- **Selective Manage**: Choose which permissions to revoke

## Setup

1. Install CLASP: `npm install -g @google/clasp`
2. Login: `clasp login`
3. Create project: `clasp create --type sheets --title "Drive Access Manager"`
4. Push code: `clasp push`
5. Open: `clasp open`

## Usage

After deploying, open the Google Sheet and use the **Drive Access Manager** menu.

## OAuth Scopes Required

- `drive` - Full Drive access to read/modify permissions
- `drive.metadata` - Read file metadata
- `spreadsheets` - Create reports in Sheets
