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
    .addItem('⏸️ Stop Processing', 'stopNuclearMode')
    .addSeparator()
    .addItem('📊 Open Live Monitor', 'showSidebar')
    .addItem('📈 View Stats', 'showProgress')
    .addItem('🔄 Reset (Fresh Start)', 'resetEverything')
    .addToUi();
}

/**
 * Show the live monitoring sidebar
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Nuclear Mode Monitor')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
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
  clearLiveLog();
  setNukeStatus('running');
  PROPS.setProperty('PHASE', 'FILES'); // Start with files, then folders

  // Show sidebar for live monitoring
  showSidebar();

  addLiveLog('info', 'Nuclear mode activated!');

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
      addLiveLog('info', 'Files complete! Moving to folders...');
    } else {
      setContinuationToken(result.nextToken);
    }
  } else if (phase === 'FOLDERS') {
    result = nukeAllFolderSharing(token);

    if (result.isComplete) {
      // All done!
      PROPS.setProperty('PHASE', 'COMPLETE');
      deleteContinuationTrigger();
      setNukeStatus('idle');
      setCurrentFile('');
      updateStatsSheet();

      const stats = getStats();
      addLiveLog('success', '🎉 Complete! Removed ' + stats.permissionsRemoved + ' permissions from ' + stats.filesProcessed + ' items');

      // Send email notification
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
    setNukeStatus('idle');
    return;
  }

  // Update stats sheet
  updateStatsSheet();

  Logger.log('Batch complete. Files: ' + (result.filesProcessed || result.foldersProcessed) +
             ', Permissions removed: ' + result.permissionsRemoved);
}

/**
 * Stop processing (called from menu)
 */
function stopNuking() {
  stopNuclearMode();
  SpreadsheetApp.getUi().alert(
    'Stopped',
    'Processing has been stopped.\n\n' +
    'Progress has been saved. You can resume by clicking "Start Nuclear Mode" again ' +
    '(it will continue where it left off).',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Stop nuclear mode (can be called from sidebar)
 */
function stopNuclearMode() {
  deleteContinuationTrigger();
  setNukeStatus('stopped');
  setCurrentFile('');
  addLiveLog('warning', 'Processing stopped by user');
  updateStatsSheet();
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
