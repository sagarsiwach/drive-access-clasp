#!/bin/bash
# Build standalone executable for Drive Nuclear Mode

set -e

cd "$(dirname "$0")"

echo "========================================"
echo "  Building Drive Nuclear Mode Executable"
echo "========================================"
echo ""

# Check credentials
if [ ! -f "credentials.json" ]; then
    echo "ERROR: credentials.json not found!"
    echo "You need this file to build the executable."
    exit 1
fi

# Activate venv
source venv/bin/activate

# Install pyinstaller if needed
pip install -q pyinstaller

echo "Building executable..."

# Build single-file executable
pyinstaller \
    --onefile \
    --name "DriveNukeMode" \
    --add-data "credentials.json:." \
    --hidden-import google.auth.transport.requests \
    --hidden-import google_auth_oauthlib.flow \
    --clean \
    --noconfirm \
    nuke_drive.py

echo ""
echo "========================================"
echo "  Build Complete!"
echo "========================================"
echo ""
echo "Executable: dist/DriveNukeMode"
echo ""
echo "To share with someone:"
echo "1. Send them: dist/DriveNukeMode"
echo "2. Add their Gmail as test user in Google Cloud Console"
echo "3. They double-click to run"
echo ""
