# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tool to remove ALL sharing permissions from files in Google Drive. Two implementations:

1. **Python script** (recommended) - `nuke_drive.py` - Handles 40k+ files with no timeout limits
2. **Apps Script** (legacy) - `src/*.gs` - Limited by Apps Script 6-min execution timeout

## Python Script (Recommended)

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set up Google Cloud credentials (see SETUP_GOOGLE_CLOUD.md)
# Download credentials.json from Google Cloud Console

# Run
python nuke_drive.py
```

### Features

- **Resumable** - Saves progress to `nuke_state.json`, Ctrl+C anytime
- **Rate limiting** - Exponential backoff on API errors
- **Logging** - CSV logs: `permission_removal_log.csv`, `errors.csv`
- **Two phases** - Processes files first, then folders

### Key Functions (nuke_drive.py)

- `main()` - Entry point, orchestrates files→folders flow
- `process_items()` - Paginated iteration with Drive API
- `remove_file_permissions()` - Lists and deletes non-owner permissions
- `api_call_with_retry()` - Handles rate limits with exponential backoff

### State Files

- `nuke_state.json` - Current progress (page token, counts, phase)
- `permission_removal_log.csv` - All removed permissions
- `errors.csv` - Failed operations

---

## Apps Script (Legacy)

### Commands

```bash
npm run push          # Push to Apps Script
npm run pull          # Pull from Apps Script
npm run open          # Open bound Google Sheet
```

### Architecture

All source files in `src/` with `.gs` extension.

**Code.gs** - Entry point with Sheet menu
**NukeEngine.gs** - Core file/folder processing
**Utils.gs** - State via `PropertiesService`, triggers, rate limiting
**SheetLogger.gs** - Logging to spreadsheet tabs
**Sidebar.html** - Live monitoring UI

### Limitations

- 6-minute execution timeout per trigger
- PropertiesService storage limits
- Struggles with 40k+ files due to quota issues
