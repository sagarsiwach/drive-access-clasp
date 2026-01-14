/**
 * SheetLogger.gs - Log all permission removals to a Google Sheet
 */

const SHEET_NAME = 'Permission Removal Log';
const ERROR_SHEET_NAME = 'Errors';
const STATS_SHEET_NAME = 'Stats';

let _logSheet = null;
let _errorSheet = null;
let _statsSheet = null;

/**
 * Get or create the main log sheet
 */
function getLogSheet() {
  if (_logSheet) return _logSheet;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _logSheet = ss.getSheetByName(SHEET_NAME);

  if (!_logSheet) {
    _logSheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    _logSheet.getRange(1, 1, 1, 6).setValues([[
      'Timestamp',
      'File ID',
      'File Name',
      'Permission Type',
      'Details',
      'Drive Link'
    ]]);
    _logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    _logSheet.setFrozenRows(1);
  }

  return _logSheet;
}

/**
 * Get or create the error sheet
 */
function getErrorSheet() {
  if (_errorSheet) return _errorSheet;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _errorSheet = ss.getSheetByName(ERROR_SHEET_NAME);

  if (!_errorSheet) {
    _errorSheet = ss.insertSheet(ERROR_SHEET_NAME);
    _errorSheet.getRange(1, 1, 1, 4).setValues([[
      'Timestamp',
      'File ID',
      'File Name',
      'Error'
    ]]);
    _errorSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    _errorSheet.setFrozenRows(1);
  }

  return _errorSheet;
}

/**
 * Get or create the stats sheet
 */
function getStatsSheet() {
  if (_statsSheet) return _statsSheet;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _statsSheet = ss.getSheetByName(STATS_SHEET_NAME);

  if (!_statsSheet) {
    _statsSheet = ss.insertSheet(STATS_SHEET_NAME);
    _statsSheet.getRange(1, 1, 6, 2).setValues([
      ['Metric', 'Value'],
      ['Files Processed', 0],
      ['Permissions Removed', 0],
      ['Errors', 0],
      ['Started At', ''],
      ['Last Run At', '']
    ]);
    _statsSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }

  return _statsSheet;
}

/**
 * Log a permission removal
 */
function logPermissionRemoval(fileId, fileName, permissionType, details) {
  const sheet = getLogSheet();
  const driveLink = 'https://drive.google.com/file/d/' + fileId;

  sheet.appendRow([
    new Date(),
    fileId,
    fileName,
    permissionType,
    details,
    driveLink
  ]);
}

/**
 * Log an error
 */
function logError(fileId, fileName, error) {
  const sheet = getErrorSheet();

  sheet.appendRow([
    new Date(),
    fileId,
    fileName,
    error
  ]);
}

/**
 * Update stats in the sheet
 */
function updateStatsSheet() {
  const sheet = getStatsSheet();
  const stats = getStats();

  sheet.getRange(2, 2).setValue(stats.filesProcessed);
  sheet.getRange(3, 2).setValue(stats.permissionsRemoved);
  sheet.getRange(4, 2).setValue(stats.errors);
  sheet.getRange(5, 2).setValue(stats.startedAt || '');
  sheet.getRange(6, 2).setValue(stats.lastRunAt || '');
}

/**
 * Initialize all sheets for a fresh run
 */
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clear existing data (keep headers)
  const logSheet = getLogSheet();
  if (logSheet.getLastRow() > 1) {
    logSheet.deleteRows(2, logSheet.getLastRow() - 1);
  }

  const errorSheet = getErrorSheet();
  if (errorSheet.getLastRow() > 1) {
    errorSheet.deleteRows(2, errorSheet.getLastRow() - 1);
  }

  // Reset stats sheet
  const statsSheet = getStatsSheet();
  statsSheet.getRange(2, 2, 5, 1).setValues([[0], [0], [0], [''], ['']]);
}

/**
 * Log batch of removals at once (more efficient)
 */
function logPermissionRemovalBatch(removals) {
  if (removals.length === 0) return;

  const sheet = getLogSheet();
  const rows = removals.map(r => [
    new Date(),
    r.fileId,
    r.fileName,
    r.permissionType,
    r.details,
    'https://drive.google.com/file/d/' + r.fileId
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 6).setValues(rows);
}
