/**
 * Drive Access Manager - Nuclear Mode
 * Remove ALL sharing from ALL files in Google Drive
 *
 * How it works:
 * 1. Click "Start Nuclear Mode" from menu
 * 2. Script processes files in batches (5 min per run)
 * 3. Automatically continues via trigger until all 40k+ files done
 * 4. All removed permissions logged to spreadsheet
 */

/**
 * Add menu to spreadsheet
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔒 Drive Access Manager')
    .addItem('🚀 Start Nuclear Mode', 'startNuking')
    .addItem('⏸️ Stop Processing', 'stopNuking')
    .addSeparator()
    .addItem('📊 View Progress', 'showProgress')
    .addItem('🔄 Reset (Fresh Start)', 'resetEverything')
    .addToUi();
}

/**
 * Start the nuclear process
 */
function startNuking() {
  const ui = SpreadsheetApp.getUi();

  // Confirm with user
  const response = ui.alert(
    '⚠️ Nuclear Mode',
    'This will REMOVE ALL SHARING from EVERY file in your Drive.\n\n' +
    '• All "Anyone with link" → Restricted\n' +
    '• All editors removed\n' +
    '• All viewers removed\n' +
    '• Only you (owner) will have access\n\n' +
    'This affects 40,000+ files. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('Cancelled', 'No changes were made.', ui.ButtonSet.OK);
    return;
  }

  // Initialize
  initStats();
  initSheets();
  setContinuationToken(null);
  PROPS.setProperty('PHASE', 'FILES'); // Start with files, then folders

  ui.alert(
    'Started!',
    'Nuclear mode activated.\n\n' +
    'The script will process files in the background.\n' +
    'Check the "Stats" sheet for progress.\n' +
    'You can close this tab - it will continue running.',
    ui.ButtonSet.OK
  );

  // Start processing
  createContinuationTrigger();
  continueNuking();
}

/**
 * Continue nuking (called by trigger or manually)
 */
function continueNuking() {
  const phase = PROPS.getProperty('PHASE') || 'FILES';
  const token = getContinuationToken();

  let result;

  if (phase === 'FILES') {
    result = nukeAllSharing(token);

    if (result.isComplete) {
      // Move to folders phase
      PROPS.setProperty('PHASE', 'FOLDERS');
      setContinuationToken(null);
      Logger.log('Files complete, moving to folders...');
    } else {
      setContinuationToken(result.nextToken);
    }
  } else if (phase === 'FOLDERS') {
    result = nukeAllFolderSharing(token);

    if (result.isComplete) {
      // All done!
      PROPS.setProperty('PHASE', 'COMPLETE');
      deleteContinuationTrigger();
      updateStatsSheet();

      // Send email notification
      const stats = getStats();
      MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: '✅ Drive Nuclear Mode Complete',
        body: `Your Drive access cleanup is complete!\n\n` +
              `Files processed: ${stats.filesProcessed}\n` +
              `Permissions removed: ${stats.permissionsRemoved}\n` +
              `Errors: ${stats.errors}\n\n` +
              `Check your spreadsheet for full details.`
      });

      Logger.log('All done!');
      return;
    } else {
      setContinuationToken(result.nextToken);
    }
  } else if (phase === 'COMPLETE') {
    // Already done, just clean up trigger
    deleteContinuationTrigger();
    return;
  }

  // Update stats sheet
  updateStatsSheet();

  Logger.log('Batch complete. Files: ' + (result.filesProcessed || result.foldersProcessed) +
             ', Permissions removed: ' + result.permissionsRemoved);
}

/**
 * Stop processing
 */
function stopNuking() {
  deleteContinuationTrigger();
  updateStatsSheet();

  SpreadsheetApp.getUi().alert(
    'Stopped',
    'Processing has been stopped.\n\n' +
    'Progress has been saved. You can resume by clicking "Start Nuclear Mode" again ' +
    '(it will continue where it left off).',
    ui.ButtonSet.OK
  );
}

/**
 * Show current progress
 */
function showProgress() {
  const stats = getStats();
  const phase = PROPS.getProperty('PHASE') || 'NOT STARTED';

  SpreadsheetApp.getUi().alert(
    'Progress',
    `Phase: ${phase}\n\n` +
    `Files Processed: ${stats.filesProcessed}\n` +
    `Permissions Removed: ${stats.permissionsRemoved}\n` +
    `Errors: ${stats.errors}\n\n` +
    `Started: ${stats.startedAt || 'N/A'}\n` +
    `Last Run: ${stats.lastRunAt || 'N/A'}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Reset everything for a fresh start
 */
function resetEverything() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Reset',
    'This will clear all progress and logs. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  deleteContinuationTrigger();
  clearAllState();
  initSheets();

  ui.alert('Reset Complete', 'Ready for a fresh start.', ui.ButtonSet.OK);
}

/**
 * Manual test - process just 10 files to verify it works
 */
function testNuke() {
  const files = DriveApp.getFiles();
  let count = 0;

  initSheets();

  while (files.hasNext() && count < 10) {
    const file = files.next();
    Logger.log('Processing: ' + file.getName());

    const result = nukeFilePermissions(file);
    Logger.log('  Removed: ' + result.removed + ', Errors: ' + result.errors);

    count++;
  }

  Logger.log('Test complete. Processed ' + count + ' files.');
}
