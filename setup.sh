#!/bin/bash
# Setup script for Drive Nuclear Mode

set -e

echo "========================================"
echo "  Drive Nuclear Mode - Setup"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not installed."
    echo "Install from: https://www.python.org/downloads/"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate and install
echo ""
echo "Installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Check for credentials
echo ""
if [ ! -f "credentials.json" ]; then
    echo "⚠ credentials.json not found!"
    echo ""
    echo "You need to set up Google Cloud credentials:"
    echo ""
    echo "1. Go to: https://console.cloud.google.com/"
    echo "2. Create a new project"
    echo "3. Enable 'Google Drive API'"
    echo "4. Go to APIs & Services → OAuth consent screen"
    echo "   - Select 'External', fill in app name and emails"
    echo "   - Add scope: https://www.googleapis.com/auth/drive"
    echo "   - Add yourself as a test user"
    echo "5. Go to APIs & Services → Credentials"
    echo "   - Create OAuth client ID → Desktop app"
    echo "   - Download JSON and save as 'credentials.json' here"
    echo ""
    echo "Then run: ./run.sh"
    exit 0
fi

echo "✓ credentials.json found"
echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "Run the script with: ./run.sh"
echo ""
