#!/bin/bash
# Run the Drive Nuclear Mode script

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Run ./setup.sh first"
    exit 1
fi

if [ ! -f "credentials.json" ]; then
    echo "ERROR: credentials.json not found!"
    echo "See SETUP_GOOGLE_CLOUD.md for instructions"
    exit 1
fi

source venv/bin/activate
python3 nuke_drive.py
