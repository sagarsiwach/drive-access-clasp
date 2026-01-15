# Drive Access Manager

Remove ALL sharing permissions from your entire Google Drive.

## Overview

This tool removes all shared access from every file in a Google Drive account:
- **"Anyone with link"** → Restricted
- **All Editors** → Removed (except owner)
- **All Viewers** → Removed (except owner)

Handles 40,000+ files with automatic batching, progress tracking, and full audit logging.

## Current Implementation: Google Apps Script (CLASP)

### Limitations

| Issue | Impact |
|-------|--------|
| 6-minute execution limit | Requires trigger-based continuation |
| Fragile state management | Progress stored in script properties |
| Limited error handling | Basic retry logic only |
| Hard to debug | Logger-only debugging |
| Rate limiting | No exponential backoff |

### Setup

```bash
# Install dependencies
npm install

# Login to Google (first time only)
npx clasp login

# Push code to Apps Script
npm run push

# Open the spreadsheet
npm run open
```

### Usage

1. Open the Google Sheet
2. Click menu: **Drive Access Manager → Start Nuclear Mode**
3. Confirm the warning dialog
4. Check "Stats" sheet for progress
5. Email notification when complete

### Scripts

| Command | Description |
|---------|-------------|
| `npm run push` | Push code to Apps Script |
| `npm run pull` | Pull code from Apps Script |
| `npm run open` | Open project in browser |
| `npm run deploy` | Deploy the project |

## Planned: Node.js CLI (Recommended)

A more robust Node.js implementation is planned with:

- **Unlimited execution time** - No 6-minute limit
- **Parallel processing** - Configurable concurrency
- **Exponential backoff** - Proper rate limit handling
- **Resumable progress** - Local file persistence
- **Multi-account support** - Handle multiple Google accounts
- **Real-time progress** - CLI output with progress bar

### Authentication

Uses OAuth2 - completely free:

1. Create Google Cloud project (free)
2. Enable Drive API (free, no billing required)
3. Create OAuth credentials (Desktop App)
4. Each user authenticates via browser once
5. Token saved locally for future runs

### Multi-Account Usage (Planned)

```bash
# Authenticate accounts (one-time, opens browser)
node nuke-drive.js auth --account friend1
node nuke-drive.js auth --account friend2

# Run cleanup
node nuke-drive.js run --account friend1
node nuke-drive.js run --account friend2
```

## OAuth Scopes Required

- `drive` - Full Drive access to modify permissions
- `spreadsheets` - Log results (Apps Script version)
- `gmail.send` - Send completion notification
- `script.scriptapp` - Create time-based triggers

## Cost

**$0** - Completely free

| Component | Cost |
|-----------|------|
| Google Cloud Project | Free |
| Drive API | Free (no billing required) |
| API Quota | 1 billion units/day |

## Project Structure

```
├── package.json           # Dependencies
├── .clasp.json            # CLASP configuration
├── src/
│   ├── Code.gs            # Main entry point, menu
│   ├── NukeEngine.gs      # Core permission removal
│   ├── SheetLogger.gs     # Spreadsheet logging
│   ├── Utils.gs           # Utility functions
│   └── appsscript.json    # Apps Script manifest
```

## License

MIT
