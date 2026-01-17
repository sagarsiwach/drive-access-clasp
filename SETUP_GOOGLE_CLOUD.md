# Google Cloud Console Setup Guide

This guide walks you through creating OAuth credentials to run the `nuke_drive.py` script.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top left, next to "Google Cloud")
3. Click **New Project**
4. Enter a name (e.g., "Drive Nuclear Mode")
5. Click **Create**
6. Wait for the project to be created, then select it

## Step 2: Enable the Google Drive API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on **Google Drive API**
4. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace org)
3. Click **Create**
4. Fill in required fields:
   - **App name**: Drive Nuclear Mode
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On **Scopes** page, click **Add or Remove Scopes**
7. Find and check `https://www.googleapis.com/auth/drive`
8. Click **Update**, then **Save and Continue**
9. On **Test users** page, click **Add Users**
10. Add your Gmail address
11. Click **Save and Continue**
12. Click **Back to Dashboard**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. For **Application type**, select **Desktop app**
4. Name it "Drive Nuclear CLI"
5. Click **Create**
6. Click **Download JSON**
7. Save the file as `credentials.json` in this project folder

## Step 5: Run the Script

```bash
# Install dependencies
pip install -r requirements.txt

# Run the script
python nuke_drive.py
```

On first run:
1. A browser window will open
2. Sign in with your Google account
3. You'll see "Google hasn't verified this app" - click **Continue**
4. Grant Drive access permissions
5. The script will save a `token.json` for future runs

## Files Created

After setup, you'll have:
- `credentials.json` - OAuth client credentials (keep secret!)
- `token.json` - Your access token (auto-created on first run)

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added yourself as a test user in Step 3

### "Error 403: access_denied"
- The OAuth consent screen might still be in "Testing" mode
- Add your email as a test user

### "Quota exceeded"
- The script has built-in rate limiting and retry logic
- If you hit hard quotas, wait 24 hours for reset

## Security Notes

- Never commit `credentials.json` or `token.json` to git
- These files are already in `.gitignore`
- Delete `token.json` to force re-authentication
