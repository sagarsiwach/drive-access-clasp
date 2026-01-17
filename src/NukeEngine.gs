/**
 * NukeEngine.gs - Single pass: find file, remove all sharing, log, next
 */

/**
 * Main nuclear function - processes files and removes all sharing
 * @param {string|null} continuationToken - Token to resume from
 * @returns {Object} Result with stats and next token
 */
function nukeAllSharing(continuationToken) {
  const startTime = Date.now();
  let filesProcessed = 0;
  let permissionsRemoved = 0;
  let errors = 0;
  let nextToken = null;

  try {
    // Get all files (paginated)
    let files;
    if (continuationToken) {
      files = DriveApp.continueFileIterator(continuationToken);
      addLiveLog('info', 'Resuming file processing...');
    } else {
      files = DriveApp.getFiles();
      addLiveLog('info', 'Starting file scan...');
    }

    while (files.hasNext()) {
      // Check time limit
      if (isTimeUp(startTime)) {
        nextToken = files.getContinuationToken();
        addLiveLog('warning', 'Time limit reached, will resume shortly...');
        break;
      }

      const file = files.next();
      const fileName = file.getName();
      setCurrentFile(fileName);

      const result = nukeFilePermissions(file);

      filesProcessed++;
      permissionsRemoved += result.removed;
      errors += result.errors;

      // Log significant events
      if (result.removed > 0) {
        addLiveLog('success', 'Removed ' + result.removed + ' permission(s) from: ' + fileName);
      }
      if (result.errors > 0) {
        addLiveLog('error', 'Error processing: ' + fileName);
      }

      rateLimitSleep();
    }

  } catch (e) {
    Logger.log('Error in nukeAllSharing: ' + e.toString());
    addLiveLog('error', 'Critical error: ' + e.toString());
    errors++;
  }

  // Update stats
  updateStats(filesProcessed, permissionsRemoved, errors);

  return {
    filesProcessed,
    permissionsRemoved,
    errors,
    nextToken,
    isComplete: !nextToken
  };
}

/**
 * Remove all sharing permissions from a single file
 * @param {File} file - Google Drive file
 * @returns {Object} Result with counts
 */
function nukeFilePermissions(file) {
  let removed = 0;
  let errors = 0;
  const fileId = file.getId();
  const fileName = file.getName();

  try {
    // Get sharing access
    const access = file.getSharingAccess();

    // If shared with anyone with link, make it restricted
    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      logPermissionRemoval(fileId, fileName, 'ANYONE_WITH_LINK', 'Link sharing disabled');
      removed++;
    }

    // If shared with domain
    if (access === DriveApp.Access.DOMAIN || access === DriveApp.Access.DOMAIN_WITH_LINK) {
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      logPermissionRemoval(fileId, fileName, 'DOMAIN', 'Domain sharing disabled');
      removed++;
    }

    // Remove individual editors (except owner)
    const editors = file.getEditors();
    editors.forEach(editor => {
      try {
        const email = editor.getEmail();
        file.removeEditor(editor);
        logPermissionRemoval(fileId, fileName, 'EDITOR', email);
        removed++;
      } catch (e) {
        Logger.log('Error removing editor from ' + fileName + ': ' + e.toString());
        errors++;
      }
    });

    // Remove individual viewers
    const viewers = file.getViewers();
    viewers.forEach(viewer => {
      try {
        const email = viewer.getEmail();
        file.removeViewer(viewer);
        logPermissionRemoval(fileId, fileName, 'VIEWER', email);
        removed++;
      } catch (e) {
        Logger.log('Error removing viewer from ' + fileName + ': ' + e.toString());
        errors++;
      }
    });

  } catch (e) {
    Logger.log('Error processing file ' + fileName + ': ' + e.toString());
    logError(fileId, fileName, e.toString());
    errors++;
  }

  return { removed, errors };
}

/**
 * Process folders too (they have their own permissions)
 */
function nukeAllFolderSharing(continuationToken) {
  const startTime = Date.now();
  let foldersProcessed = 0;
  let permissionsRemoved = 0;
  let errors = 0;
  let nextToken = null;

  try {
    let folders;
    if (continuationToken) {
      folders = DriveApp.continueFolderIterator(continuationToken);
      addLiveLog('info', 'Resuming folder processing...');
    } else {
      folders = DriveApp.getFolders();
      addLiveLog('info', 'Starting folder scan...');
    }

    while (folders.hasNext()) {
      if (isTimeUp(startTime)) {
        nextToken = folders.getContinuationToken();
        addLiveLog('warning', 'Time limit reached, will resume folders shortly...');
        break;
      }

      const folder = folders.next();
      const folderName = folder.getName();
      setCurrentFile(folderName + ' (folder)');

      const result = nukeFolderPermissions(folder);

      foldersProcessed++;
      permissionsRemoved += result.removed;
      errors += result.errors;

      if (result.removed > 0) {
        addLiveLog('success', 'Removed ' + result.removed + ' permission(s) from folder: ' + folderName);
      }

      rateLimitSleep();
    }

  } catch (e) {
    Logger.log('Error in nukeAllFolderSharing: ' + e.toString());
    addLiveLog('error', 'Folder error: ' + e.toString());
    errors++;
  }

  return {
    foldersProcessed,
    permissionsRemoved,
    errors,
    nextToken,
    isComplete: !nextToken
  };
}

/**
 * Remove all sharing from a folder
 */
function nukeFolderPermissions(folder) {
  let removed = 0;
  let errors = 0;
  const folderId = folder.getId();
  const folderName = folder.getName();

  try {
    const access = folder.getSharingAccess();

    if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
      folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      logPermissionRemoval(folderId, folderName + ' (folder)', 'ANYONE_WITH_LINK', 'Link sharing disabled');
      removed++;
    }

    if (access === DriveApp.Access.DOMAIN || access === DriveApp.Access.DOMAIN_WITH_LINK) {
      folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      logPermissionRemoval(folderId, folderName + ' (folder)', 'DOMAIN', 'Domain sharing disabled');
      removed++;
    }

    const editors = folder.getEditors();
    editors.forEach(editor => {
      try {
        const email = editor.getEmail();
        folder.removeEditor(editor);
        logPermissionRemoval(folderId, folderName + ' (folder)', 'EDITOR', email);
        removed++;
      } catch (e) {
        errors++;
      }
    });

    const viewers = folder.getViewers();
    viewers.forEach(viewer => {
      try {
        const email = viewer.getEmail();
        folder.removeViewer(viewer);
        logPermissionRemoval(folderId, folderName + ' (folder)', 'VIEWER', email);
        removed++;
      } catch (e) {
        errors++;
      }
    });

  } catch (e) {
    Logger.log('Error processing folder ' + folderName + ': ' + e.toString());
    logError(folderId, folderName, e.toString());
    errors++;
  }

  return { removed, errors };
}
