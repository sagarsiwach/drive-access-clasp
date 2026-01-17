#!/usr/bin/env python3
"""
Drive Nuclear Mode - Remove all sharing from Google Drive files.

Handles 40k+ files with:
- Resumable progress (saves state to JSON)
- Rate limiting with exponential backoff
- Detailed logging to CSV
- Rich terminal interface with live stats
"""

import os
import sys
import json
import csv
import time
import signal
import shutil
from datetime import datetime, timedelta
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# OAuth scopes needed
SCOPES = ['https://www.googleapis.com/auth/drive']

# File paths
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
STATE_FILE = 'nuke_state.json'
LOG_FILE = 'permission_removal_log.csv'
ERROR_FILE = 'errors.csv'

# Rate limiting
BASE_DELAY = 0.1  # 100ms between requests
MAX_RETRIES = 5
BACKOFF_MULTIPLIER = 2

# Terminal colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

# Global state
shutdown_requested = False
terminal_width = 80
start_time = None


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    global shutdown_requested
    print(f'\n\n{Colors.YELLOW}⏸  Shutdown requested. Saving progress...{Colors.RESET}')
    shutdown_requested = True


signal.signal(signal.SIGINT, signal_handler)


def get_terminal_width():
    """Get terminal width for formatting."""
    try:
        return shutil.get_terminal_size().columns
    except:
        return 80


def clear_line():
    """Clear current line."""
    print('\r' + ' ' * get_terminal_width() + '\r', end='')


def format_number(n):
    """Format number with commas."""
    return f'{n:,}'


def format_duration(seconds):
    """Format duration in human readable form."""
    if seconds < 60:
        return f'{int(seconds)}s'
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f'{mins}m {secs}s'
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f'{hours}h {mins}m'


def print_header():
    """Print application header."""
    width = get_terminal_width()
    print()
    print(f'{Colors.RED}{Colors.BOLD}{"=" * width}{Colors.RESET}')
    print(f'{Colors.RED}{Colors.BOLD}{"DRIVE NUCLEAR MODE":^{width}}{Colors.RESET}')
    print(f'{Colors.DIM}{"Remove All Sharing Permissions":^{width}}{Colors.RESET}')
    print(f'{Colors.RED}{Colors.BOLD}{"=" * width}{Colors.RESET}')
    print()


def print_status_box(state, current_file='', rate=''):
    """Print live status box."""
    width = min(get_terminal_width(), 70)

    phase = state.get('phase', 'files').upper()
    files = state.get('files_processed', 0)
    removed = state.get('permissions_removed', 0)
    errors = state.get('errors', 0)

    # Calculate elapsed time
    elapsed = ''
    if start_time:
        elapsed = format_duration(time.time() - start_time)

    # Truncate filename
    if len(current_file) > width - 20:
        current_file = current_file[:width-23] + '...'

    print(f'\r{Colors.CYAN}┌{"─" * (width-2)}┐{Colors.RESET}')
    print(f'{Colors.CYAN}│{Colors.RESET} {Colors.BOLD}Phase:{Colors.RESET} {phase:<10} {Colors.BOLD}Elapsed:{Colors.RESET} {elapsed:<15} {Colors.BOLD}Rate:{Colors.RESET} {rate:<10} {Colors.CYAN}│{Colors.RESET}')
    print(f'{Colors.CYAN}├{"─" * (width-2)}┤{Colors.RESET}')
    print(f'{Colors.CYAN}│{Colors.RESET} {Colors.GREEN}✓ Items Processed:{Colors.RESET}    {format_number(files):>12}                      {Colors.CYAN}│{Colors.RESET}')
    print(f'{Colors.CYAN}│{Colors.RESET} {Colors.BLUE}🔓 Permissions Removed:{Colors.RESET} {format_number(removed):>12}                      {Colors.CYAN}│{Colors.RESET}')
    print(f'{Colors.CYAN}│{Colors.RESET} {Colors.RED}✗ Errors:{Colors.RESET}              {format_number(errors):>12}                      {Colors.CYAN}│{Colors.RESET}')
    print(f'{Colors.CYAN}├{"─" * (width-2)}┤{Colors.RESET}')
    print(f'{Colors.CYAN}│{Colors.RESET} {Colors.DIM}Current:{Colors.RESET} {current_file:<{width-12}} {Colors.CYAN}│{Colors.RESET}')
    print(f'{Colors.CYAN}└{"─" * (width-2)}┘{Colors.RESET}')


def print_progress_update(state, current_file, removed_count=0):
    """Print a single line progress update."""
    files = state.get('files_processed', 0)
    removed = state.get('permissions_removed', 0)

    # Truncate filename
    max_name_len = 40
    if len(current_file) > max_name_len:
        display_name = current_file[:max_name_len-3] + '...'
    else:
        display_name = current_file

    status = f'[{format_number(files)}] '

    if removed_count > 0:
        status += f'{Colors.GREEN}✓{Colors.RESET} '
    else:
        status += f'{Colors.DIM}○{Colors.RESET} '

    status += f'{display_name}'

    if removed_count > 0:
        status += f' {Colors.GREEN}(-{removed_count} perms){Colors.RESET}'

    clear_line()
    print(status)


def print_summary(state):
    """Print final summary."""
    width = min(get_terminal_width(), 70)

    files = state.get('files_processed', 0)
    removed = state.get('permissions_removed', 0)
    errors = state.get('errors', 0)

    elapsed = ''
    if start_time:
        elapsed = format_duration(time.time() - start_time)

    print()
    print(f'{Colors.GREEN}{Colors.BOLD}{"=" * width}{Colors.RESET}')
    print(f'{Colors.GREEN}{Colors.BOLD}{"✓ COMPLETE":^{width}}{Colors.RESET}')
    print(f'{Colors.GREEN}{Colors.BOLD}{"=" * width}{Colors.RESET}')
    print()
    print(f'  {Colors.BOLD}Items Processed:{Colors.RESET}      {format_number(files)}')
    print(f'  {Colors.BOLD}Permissions Removed:{Colors.RESET}  {format_number(removed)}')
    print(f'  {Colors.BOLD}Errors:{Colors.RESET}               {format_number(errors)}')
    print(f'  {Colors.BOLD}Total Time:{Colors.RESET}           {elapsed}')
    print()
    print(f'  {Colors.DIM}Logs:{Colors.RESET} {LOG_FILE}')
    print(f'  {Colors.DIM}Errors:{Colors.RESET} {ERROR_FILE}')
    print()
    print(f'{Colors.GREEN}{"=" * width}{Colors.RESET}')
    print()


def print_resume_info(state):
    """Print resume information."""
    files = state.get('files_processed', 0)
    removed = state.get('permissions_removed', 0)
    phase = state.get('phase', 'files')

    if files > 0:
        print(f'{Colors.YELLOW}► Resuming previous session{Colors.RESET}')
        print(f'  Already processed: {format_number(files)} items')
        print(f'  Permissions removed: {format_number(removed)}')
        print(f'  Phase: {phase.upper()}')
        print()


def get_credentials():
    """Get or refresh OAuth credentials."""
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print(f'{Colors.DIM}Refreshing authentication token...{Colors.RESET}')
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(f'{Colors.RED}{Colors.BOLD}ERROR: {CREDENTIALS_FILE} not found!{Colors.RESET}')
                print()
                print(f'{Colors.BOLD}Setup Instructions:{Colors.RESET}')
                print(f'  1. Go to {Colors.CYAN}https://console.cloud.google.com/{Colors.RESET}')
                print(f'  2. Create a project and enable Drive API')
                print(f'  3. Create OAuth credentials (Desktop app)')
                print(f'  4. Download and save as {Colors.BOLD}credentials.json{Colors.RESET}')
                print()
                print(f'  See {Colors.CYAN}SETUP_GOOGLE_CLOUD.md{Colors.RESET} for detailed instructions.')
                sys.exit(1)

            print(f'{Colors.CYAN}Opening browser for authentication...{Colors.RESET}')
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
        print(f'{Colors.GREEN}✓ Authentication successful{Colors.RESET}')

    return creds


def load_state():
    """Load progress state from file."""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        'page_token': None,
        'files_processed': 0,
        'permissions_removed': 0,
        'errors': 0,
        'started_at': datetime.now().isoformat(),
        'phase': 'files'
    }


def save_state(state):
    """Save progress state to file."""
    state['last_saved'] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)


def init_log_files():
    """Initialize CSV log files with headers if they don't exist."""
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'file_id', 'file_name', 'permission_type', 'details'])

    if not os.path.exists(ERROR_FILE):
        with open(ERROR_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'file_id', 'file_name', 'error'])


def log_removal(file_id, file_name, perm_type, details):
    """Log a permission removal to CSV."""
    with open(LOG_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([datetime.now().isoformat(), file_id, file_name, perm_type, details])


def log_error(file_id, file_name, error):
    """Log an error to CSV."""
    with open(ERROR_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([datetime.now().isoformat(), file_id, file_name, str(error)])


def api_call_with_retry(func, *args, **kwargs):
    """Execute API call with exponential backoff retry."""
    delay = BASE_DELAY

    for attempt in range(MAX_RETRIES):
        try:
            result = func(*args, **kwargs)
            time.sleep(BASE_DELAY)
            return result
        except HttpError as e:
            if e.resp.status in [403, 429, 500, 503]:
                if attempt < MAX_RETRIES - 1:
                    print(f'{Colors.YELLOW}  ⏳ Rate limited, waiting {delay:.1f}s...{Colors.RESET}')
                    time.sleep(delay)
                    delay *= BACKOFF_MULTIPLIER
                    continue
            raise

    return None


def get_user_email(service):
    """Get the authenticated user's email."""
    about = service.about().get(fields='user').execute()
    return about['user']['emailAddress']


def remove_file_permissions(service, file_id, file_name, owner_email):
    """Remove all non-owner permissions from a file."""
    removed = 0
    errors = 0

    try:
        permissions = api_call_with_retry(
            service.permissions().list(
                fileId=file_id,
                fields='permissions(id,type,role,emailAddress)'
            ).execute
        )

        if not permissions or 'permissions' not in permissions:
            return removed, errors

        for perm in permissions['permissions']:
            perm_id = perm['id']
            perm_type = perm.get('type', '')
            perm_role = perm.get('role', '')
            perm_email = perm.get('emailAddress', '')

            if perm_role == 'owner':
                continue

            if perm_type in ['anyone', 'domain']:
                try:
                    api_call_with_retry(
                        service.permissions().delete(
                            fileId=file_id,
                            permissionId=perm_id
                        ).execute
                    )
                    log_removal(file_id, file_name, perm_type.upper(), f'{perm_type} link sharing removed')
                    removed += 1
                except HttpError as e:
                    log_error(file_id, file_name, f'Failed to remove {perm_type}: {e}')
                    errors += 1
                continue

            if perm_type in ['user', 'group']:
                if perm_email.lower() == owner_email.lower():
                    continue

                try:
                    api_call_with_retry(
                        service.permissions().delete(
                            fileId=file_id,
                            permissionId=perm_id
                        ).execute
                    )
                    role_name = 'EDITOR' if perm_role == 'writer' else 'VIEWER'
                    log_removal(file_id, file_name, role_name, perm_email)
                    removed += 1
                except HttpError as e:
                    log_error(file_id, file_name, f'Failed to remove {perm_email}: {e}')
                    errors += 1

    except HttpError as e:
        log_error(file_id, file_name, f'Failed to list permissions: {e}')
        errors += 1

    return removed, errors


def process_items(service, state, owner_email, is_folder=False):
    """Process files or folders and remove sharing."""
    global shutdown_requested

    item_type = 'folder' if is_folder else 'file'
    mime_query = "mimeType='application/vnd.google-apps.folder'" if is_folder else "mimeType!='application/vnd.google-apps.folder'"

    page_token = state.get('page_token')
    batch_count = 0
    items_this_session = 0
    session_start = time.time()

    print(f'{Colors.CYAN}► Processing {item_type}s...{Colors.RESET}')
    print()

    while True:
        if shutdown_requested:
            save_state(state)
            print()
            print(f'{Colors.YELLOW}Progress saved. Run again to resume.{Colors.RESET}')
            return False

        try:
            results = api_call_with_retry(
                service.files().list(
                    q=mime_query,
                    pageSize=100,
                    pageToken=page_token,
                    fields='nextPageToken, files(id, name, mimeType)',
                    supportsAllDrives=True,
                    includeItemsFromAllDrives=True
                ).execute
            )

            items = results.get('files', [])

            if not items and not page_token:
                print(f'{Colors.DIM}No {item_type}s found.{Colors.RESET}')
                return True

            for item in items:
                if shutdown_requested:
                    save_state(state)
                    return False

                file_id = item['id']
                file_name = item['name']

                state['files_processed'] += 1
                items_this_session += 1

                removed, errors = remove_file_permissions(service, file_id, file_name, owner_email)
                state['permissions_removed'] += removed
                state['errors'] += errors

                # Print progress
                print_progress_update(state, file_name, removed)

                # Show stats every 100 items
                if state['files_processed'] % 100 == 0:
                    elapsed = time.time() - session_start
                    rate = f'{items_this_session / elapsed:.1f}/s' if elapsed > 0 else '-'
                    print()
                    print(f'{Colors.CYAN}── Stats ──{Colors.RESET}')
                    print(f'  Processed: {Colors.BOLD}{format_number(state["files_processed"])}{Colors.RESET}')
                    print(f'  Removed:   {Colors.GREEN}{format_number(state["permissions_removed"])}{Colors.RESET}')
                    print(f'  Errors:    {Colors.RED if state["errors"] > 0 else Colors.DIM}{format_number(state["errors"])}{Colors.RESET}')
                    print(f'  Rate:      {rate}')
                    print()
                    save_state(state)

                batch_count += 1

            page_token = results.get('nextPageToken')
            state['page_token'] = page_token

            if not page_token:
                print()
                print(f'{Colors.GREEN}✓ Completed all {item_type}s{Colors.RESET}')
                return True

            if batch_count >= 500:
                save_state(state)
                batch_count = 0

        except HttpError as e:
            print(f'{Colors.RED}API Error: {e}{Colors.RESET}')
            save_state(state)
            if e.resp.status in [403, 429]:
                print(f'{Colors.YELLOW}Rate limited. Waiting 60 seconds...{Colors.RESET}')
                time.sleep(60)
            else:
                raise


def main():
    """Main entry point."""
    global start_time
    start_time = time.time()

    print_header()

    # Initialize
    init_log_files()
    state = load_state()

    # Show resume info if applicable
    print_resume_info(state)

    print(f'{Colors.DIM}Press Ctrl+C at any time to pause and save progress.{Colors.RESET}')
    print()

    # Authenticate
    print(f'{Colors.BOLD}Authenticating...{Colors.RESET}')
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)

    owner_email = get_user_email(service)
    print(f'{Colors.GREEN}✓ Logged in as: {Colors.BOLD}{owner_email}{Colors.RESET}')
    print()

    # Process files first
    if state['phase'] == 'files':
        completed = process_items(service, state, owner_email, is_folder=False)
        if completed:
            state['phase'] = 'folders'
            state['page_token'] = None
            save_state(state)
            print()
        else:
            return

    # Then process folders
    if state['phase'] == 'folders':
        completed = process_items(service, state, owner_email, is_folder=True)
        if completed:
            state['phase'] = 'complete'
            save_state(state)

    # Done!
    if state['phase'] == 'complete':
        print_summary(state)

        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)


if __name__ == '__main__':
    main()
