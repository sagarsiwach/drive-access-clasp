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
    echo "3. Enable 'Google Drive API' (APIs & Services → Library)"
    echo "4. Go to 'Google Auth Platform' in the sidebar:"
    echo "   - Branding: Set app name and your email"
    echo "   - Audience: Set External, add your Gmail as test user"
    echo "   - Data Access: Add scope https://www.googleapis.com/auth/drive"
    echo "   - Clients: Create Desktop app → Download JSON"
    echo "5. Save the downloaded file as 'credentials.json' in this folder"
    echo ""
    echo "See SETUP_GOOGLE_CLOUD.md for detailed instructions"
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
