# Sharing Drive Nuclear Mode with Non-Technical Users

## Option 1: Single Executable (Easiest for User)

**You build it, they just run it.**

### Step 1: Add them as test user
1. Go to [Google Auth Platform → Audience](https://console.cloud.google.com/auth/audience)
2. Click **Add users** under "Test users"
3. Add their Gmail address

### Step 2: Build the executable
```bash
./build_executable.sh
```

### Step 3: Send them the file
- **macOS users**: Send `dist/DriveNukeMode`
- **Windows users**: You need to build on Windows (see below)

### Step 4: Tell them to run it
They double-click → Browser opens → They login → Done.

---

## Option 2: Zip Package (Works on any OS with Python)

If they have Python installed (or you can help them install it once):

### Step 1: Add them as test user (same as above)

### Step 2: Create a zip package
```bash
zip -r DriveNukeMode.zip \
    nuke_drive.py \
    requirements.txt \
    credentials.json \
    setup.sh \
    run.sh \
    SETUP_GOOGLE_CLOUD.md
```

### Step 3: Send them the zip with these instructions:

```
1. Unzip the folder
2. Open Terminal, cd into the folder
3. Run: ./setup.sh
4. Run: ./run.sh
5. Login when browser opens
```

---

## Option 3: Remote Screen Share (Zero Setup for Them)

If they're not technical at all:
1. Screen share with them (Zoom, Meet, etc.)
2. Run the script on YOUR machine using THEIR Google login
3. They just click "Allow" in the browser

---

## Cross-Platform Builds

The `./build_executable.sh` creates executables for YOUR current OS only:

| Your OS | Creates | Runs on |
|---------|---------|---------|
| macOS ARM (M1/M2/M3) | `dist/DriveNukeMode` | macOS ARM only |
| macOS Intel | `dist/DriveNukeMode` | macOS Intel only |
| Windows | `dist/DriveNukeMode.exe` | Windows only |
| Linux | `dist/DriveNukeMode` | Linux only |

To support multiple platforms, you need to build on each OS separately, or use a CI service like GitHub Actions.

---

## What the User Sees

1. Double-click the app
2. Terminal/command window opens showing progress
3. Browser opens asking them to login to Google
4. They see "Google hasn't verified this app" → Click "Continue"
5. They click "Allow" to grant Drive access
6. Browser says "Authentication successful"
7. Back to terminal - script runs and removes all sharing

---

## Troubleshooting

**"App is blocked" or "Access denied"**
→ You forgot to add their Gmail as a test user

**"credentials.json not found"**
→ The executable didn't bundle correctly, rebuild with `./build_executable.sh`

**Nothing happens when double-clicking (Mac)**
→ Right-click → Open → Click "Open" in the security dialog
