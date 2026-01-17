# Google Cloud Console Setup Guide

This guide walks you through creating OAuth credentials to run the `nuke_drive.py` script.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top left) → **New Project**
3. Name: `Drive Nuclear Mode` → **Create**
4. Select the new project once created

## Step 2: Enable the Google Drive API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click **Enable**

## Step 3: Configure OAuth (New Google Auth Platform UI)

Go to **Google Auth Platform** in the left sidebar (or search for it).

### 3a. Branding
1. Click **Branding** in left sidebar
2. Fill in:
   - **App name**: `Drive Nuclear Mode`
   - **User support email**: Your email
   - **Developer contact email**: Your email
3. Save

### 3b. Audience
1. Click **Audience** in left sidebar
2. Ensure user type is **External**
3. Under **Test users**, click **Add users**
4. Add your Gmail address
5. Save

### 3c. Data Access (Scopes)
1. Click **Data Access** in left sidebar
2. Click **Add or remove scopes**
3. Find and check: `https://www.googleapis.com/auth/drive`
4. Click **Update** → **Save**

### 3d. Create OAuth Client
1. Click **Clients** in left sidebar
2. Click **+ Create client**
3. Application type: **Desktop app**
4. Name: `Drive Nuclear CLI`
5. Click **Create**
6. **Download JSON** from the popup
7. Rename to `credentials.json` and move to this project folder

## Step 4: Run the Script

```bash
# One-time setup
pip install -r requirements.txt

# Run
python nuke_drive.py
```

On first run:
1. Browser opens automatically
2. Sign in with your Google account
3. Click **Continue** past "Google hasn't verified this app" warning
4. Grant Drive access
5. Done! Token is saved for future runs

## Files Created

| File | Purpose |
|------|---------|
| `credentials.json` | OAuth client credentials (keep secret!) |
| `token.json` | Access token (auto-created on first run) |
| `nuke_state.json` | Progress state (resume after Ctrl+C) |
| `permission_removal_log.csv` | Log of removed permissions |
| `errors.csv` | Failed operations |

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Access blocked: This app's request is invalid" | Add yourself as a test user in Audience settings |
| "Error 403: access_denied" | Add your email as a test user |
| "Quota exceeded" | Wait 24 hours for quota reset |

## Security Notes

- Never commit `credentials.json` or `token.json` to git
- These files are already in `.gitignore`
- Delete `token.json` to force re-authentication
