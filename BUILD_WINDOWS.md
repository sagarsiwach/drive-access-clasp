# Windows Build Instructions

Run these commands on your Windows PC to create a Windows executable.

## One-Time Setup

### 1. Install Python (if not installed)
Download from: https://www.python.org/downloads/
- **Check "Add Python to PATH"** during installation

### 2. Open Command Prompt (or PowerShell)
Press `Win + R`, type `cmd`, press Enter

### 3. Navigate to the project folder
```cmd
cd C:\path\to\drive-access-clasp
```

### 4. Create virtual environment and install dependencies
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install pyinstaller
```

### 5. Build the executable
```cmd
pyinstaller --onefile --name "DriveNukeMode" --add-data "credentials.json;." --hidden-import google.auth.transport.requests --hidden-import google_auth_oauthlib.flow --clean --noconfirm nuke_drive.py
```

### 6. Done!
Executable is at: `dist\DriveNukeMode.exe`

---

## Quick Copy-Paste Version

```cmd
python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt pyinstaller && pyinstaller --onefile --name "DriveNukeMode" --add-data "credentials.json;." --hidden-import google.auth.transport.requests --hidden-import google_auth_oauthlib.flow --clean --noconfirm nuke_drive.py
```

---

## To Share with Someone

1. Add their Gmail as test user in Google Cloud Console
2. Send them: `dist\DriveNukeMode.exe`
3. They double-click → Login → Done
