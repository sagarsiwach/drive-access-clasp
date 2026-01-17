# Drive Nuclear Mode

Remove ALL sharing permissions from your entire Google Drive.

## What It Does

- Removes "Anyone with link" sharing → Makes files private
- Removes all editors (except you)
- Removes all viewers (except you)
- Logs everything to CSV for audit trail
- Handles 40k+ files with automatic resume

## Quick Start

### 1. Clone and Setup

```bash
git clone <this-repo>
cd drive-access-clasp
./setup.sh
```

### 2. Get Google Cloud Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project → Name it anything
3. **Enable API**: APIs & Services → Library → Search "Google Drive API" → Enable
4. **Configure OAuth** (via Google Auth Platform in sidebar):
   - **Branding**: Set app name and your email
   - **Audience**: Set to External, add your Gmail as test user
   - **Data Access**: Add scope `https://www.googleapis.com/auth/drive`
   - **Clients**: Create Desktop app → Download JSON → Save as `credentials.json`

See [SETUP_GOOGLE_CLOUD.md](SETUP_GOOGLE_CLOUD.md) for detailed screenshots.

### 3. Run

```bash
./run.sh
```

First run opens browser for Google login. After that, runs automatically.

## For Other Users (Easy Deploy)

Someone else wants to use this? They need to:

1. **Clone this repo**
2. **Create their own Google Cloud credentials** (see step 2 above)
3. **Run `./setup.sh` then `./run.sh`**

That's it. No shared credentials needed - each user creates their own.

## Features

| Feature | Description |
|---------|-------------|
| **Resumable** | Press Ctrl+C anytime. Run again to continue where you left off |
| **No timeouts** | Runs for hours if needed (unlike Apps Script) |
| **Rate limiting** | Automatic retry with backoff on API limits |
| **Full logging** | `permission_removal_log.csv` - every removed permission |

## Output Files

- `permission_removal_log.csv` - All removed permissions with timestamps
- `errors.csv` - Any failures
- `nuke_state.json` - Progress state (deleted when complete)

## Manual Run (without scripts)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python nuke_drive.py
```

## Troubleshooting

**"Access blocked: This app's request is invalid"**
→ Add yourself as a test user in Audience settings

**"credentials.json not found"**
→ Download OAuth credentials from Google Cloud Console

**Stuck on a file**
→ Check `errors.csv`, delete `nuke_state.json` to restart fresh

## Cost

**$0** - Completely free

| Component | Cost |
|-----------|------|
| Google Cloud Project | Free |
| Drive API | Free (no billing required) |
| API Quota | 1 billion units/day |

## Legacy: Apps Script Version

The `src/` folder contains an Apps Script implementation, but it has limitations:
- 6-minute execution timeout
- Fragile state management
- Limited error handling

Use the Python script instead.
