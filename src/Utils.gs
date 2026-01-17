/**
 * Utils.gs - Batching, continuation, and rate limiting utilities
 */

const PROPS = PropertiesService.getScriptProperties();

/**
 * Get or create continuation token for resumable operations
 */
function getContinuationToken() {
  return PROPS.getProperty('CONTINUATION_TOKEN') || null;
}

/**
 * Save continuation token
 */
function setContinuationToken(token) {
  if (token) {
    PROPS.setProperty('CONTINUATION_TOKEN', token);
  } else {
    PROPS.deleteProperty('CONTINUATION_TOKEN');
  }
}

/**
 * Get processing stats
 */
function getStats() {
  return {
    filesProcessed: parseInt(PROPS.getProperty('FILES_PROCESSED') || '0'),
    permissionsRemoved: parseInt(PROPS.getProperty('PERMISSIONS_REMOVED') || '0'),
    errors: parseInt(PROPS.getProperty('ERRORS') || '0'),
    startedAt: PROPS.getProperty('STARTED_AT') || null,
    lastRunAt: PROPS.getProperty('LAST_RUN_AT') || null
  };
}

/**
 * Update processing stats
 */
function updateStats(filesProcessed, permissionsRemoved, errors) {
  const current = getStats();
  PROPS.setProperty('FILES_PROCESSED', String(current.filesProcessed + filesProcessed));
  PROPS.setProperty('PERMISSIONS_REMOVED', String(current.permissionsRemoved + permissionsRemoved));
  PROPS.setProperty('ERRORS', String(current.errors + errors));
  PROPS.setProperty('LAST_RUN_AT', new Date().toISOString());
}

/**
 * Initialize stats for new run
 */
function initStats() {
  PROPS.setProperty('FILES_PROCESSED', '0');
  PROPS.setProperty('PERMISSIONS_REMOVED', '0');
  PROPS.setProperty('ERRORS', '0');
  PROPS.setProperty('STARTED_AT', new Date().toISOString());
  PROPS.setProperty('LAST_RUN_AT', new Date().toISOString());
}

/**
 * Clear all state (for fresh start)
 */
function clearAllState() {
  PROPS.deleteAllProperties();
}

/**
 * Check if we're approaching the execution time limit
 * Apps Script has 6 min limit, we stop at 5 min to be safe
 */
function isTimeUp(startTime) {
  const elapsed = Date.now() - startTime;
  const FIVE_MINUTES = 5 * 60 * 1000;
  return elapsed >= FIVE_MINUTES;
}

/**
 * Sleep to avoid rate limits
 */
function rateLimitSleep() {
  Utilities.sleep(100); // 100ms between API calls
}

/**
 * Create or get the trigger for continuous processing
 */
function createContinuationTrigger() {
  // Delete existing triggers first
  deleteContinuationTrigger();

  // Create new trigger to run every 1 minute
  ScriptApp.newTrigger('continueNuking')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('Continuation trigger created');
}

/**
 * Delete the continuation trigger
 */
function deleteContinuationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'continueNuking') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

// ==================== LIVE STATUS FOR SIDEBAR ====================

const MAX_LOG_ENTRIES = 100;

/**
 * Get live status for sidebar polling
 */
function getLiveStatus() {
  const stats = getStats();
  const logs = JSON.parse(PROPS.getProperty('LIVE_LOGS') || '[]');

  return {
    status: PROPS.getProperty('NUKE_STATUS') || 'idle',
    filesProcessed: stats.filesProcessed,
    permissionsRemoved: stats.permissionsRemoved,
    errors: stats.errors,
    currentFile: PROPS.getProperty('CURRENT_FILE') || '',
    totalFiles: parseInt(PROPS.getProperty('TOTAL_FILES') || '0'),
    logs: logs
  };
}

/**
 * Add entry to live log (for sidebar display)
 */
function addLiveLog(type, message) {
  const logs = JSON.parse(PROPS.getProperty('LIVE_LOGS') || '[]');
  logs.push({
    type: type,
    message: message,
    time: new Date().toISOString()
  });

  // Keep only last N entries to avoid property size limits
  while (logs.length > MAX_LOG_ENTRIES) {
    logs.shift();
  }

  PROPS.setProperty('LIVE_LOGS', JSON.stringify(logs));
}

/**
 * Clear live log
 */
function clearLiveLog() {
  PROPS.setProperty('LIVE_LOGS', '[]');
}

/**
 * Set current processing status
 */
function setNukeStatus(status) {
  PROPS.setProperty('NUKE_STATUS', status);
}

/**
 * Set current file being processed
 */
function setCurrentFile(fileName) {
  PROPS.setProperty('CURRENT_FILE', fileName);
}

/**
 * Set total files count
 */
function setTotalFiles(count) {
  PROPS.setProperty('TOTAL_FILES', String(count));
}
