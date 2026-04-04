import { IPC_PLATFORM_UPDATE_ERROR } from '@shared/constant/ipc.constant';
import { app, BrowserWindow, dialog } from 'electron';
import extract from 'extract-zip';
import fs from 'fs-extra';
import { dirname, join } from 'path';
import log from 'electron-log';
import { IPlatformCheckForUpdate } from '@shared/types/platformUpdate';

// State
let mainWindow: BrowserWindow | null = null;
const updateJsonDir = join(app.getPath('userData'), 'updates.json');
const rendererDir = join(app.getPath('userData'), 'renderer');
const backupDir = join(app.getPath('userData'), 'renderer-backup');
const corruptMarker = join(app.getPath('userData'), '.renderer-corrupt');
const tempZipPath = join(app.getPath('temp'), `renderer-update-application.zip`);

/**
 * Initializes the platform update service with the main window reference.
 * @param win - The main BrowserWindow instance
 */
export function initPlatformUpdateService(win: BrowserWindow | null) {
  mainWindow = win;
}

/**
 * Copies the renderer files from resources to userData directory.
 * @returns Promise resolving to success status and optional error
 */
export async function copyRendererToUserData() {
  try {
    const src = join(process.resourcesPath, 'renderer');
    const dest = join(app.getPath('userData'), 'renderer');

    // Ensure destination parent exists
    await fs.ensureDir(dirname(dest));

    if (!(await fs.pathExists(dest))) {
      // Copy renderer
      await fs.copy(src, dest, {
        overwrite: true,
        errorOnExist: false,
      });
    }

    log.log('Renderer copied to userData');
    return { success: true };
  } catch (error: any) {
    log.error('Failed to copy renderer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Restores the backup renderer folder if a previous update failed.
 */
export async function restorePlatformUpdateBackup() {
  try {
    if (fs.existsSync(backupDir)) {
      await fs.remove(rendererDir);
      await fs.copy(backupDir, rendererDir);
      log.log('Successfully rolled back renderer folder');
    }
  } catch (error) {
    log.error('Rollback failed:', error);
  }
}

/**
 * Checks for corruption marker on startup and rolls back if previous update failed.
 */
export async function checkForCorruptionAndRollback() {
  try {
    if (fs.existsSync(corruptMarker)) {
      log.log('Detected failed update. Restoring backup...');
      await restorePlatformUpdateBackup();
      fs.removeSync(corruptMarker);

      dialog.showMessageBox({
        type: 'warning',
        title: 'Update Recovery',
        message: 'The previous update failed.\nThe application has been restored to the last working version.',
      });
    }
  } catch (error) {
    log.error('Failed to check for corruption and rollback:', error);
  }
}

/**
 * Handles the backup process before applying an update.
 * @param buffer - The update zip file as ArrayBuffer
 * @returns Promise resolving to success status and optional error
 */
export async function platformHandleBackup(buffer: ArrayBuffer) {
  try {
    // 1. Download using native fetch
    fs.writeFileSync(tempZipPath, Buffer.from(buffer));

    log.log('Backing up current version...');

    // 2. Backup
    if (fs.existsSync(rendererDir)) {
      await fs.copy(rendererDir, backupDir, { overwrite: true });
    }

    return { success: true };
  } catch (error: any) {
    log.error('Update failed:', error);

    await restorePlatformUpdateBackup();
    if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    // sendStatus('Update failed. Rolled back to previous version.');
    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ERROR, 'Update failed. Rolled back to previous version.');

    return { success: false, error: error.message };
  }
}

/**
 * Applies the platform update by extracting the zip and replacing the renderer folder.
 * @returns Promise resolving to success status and optional error
 */
export async function platformUpdate() {
  try {
    // Mark as updating
    fs.writeFileSync(corruptMarker, 'update-in-progress');

    // 4. Replace renderer folder
    await fs.remove(rendererDir);
    await extract(tempZipPath, { dir: rendererDir });

    // 5. Cleanup
    fs.removeSync(tempZipPath);
    if (fs.existsSync(backupDir)) fs.removeSync(backupDir);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    // sendStatus('Update successful! Restarting application...');
    log.log('Update successful! Restarting application...');

    return { success: true };
  } catch (error: any) {
    log.error('Update failed:', error);

    await restorePlatformUpdateBackup();
    if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ERROR, 'Update failed. Rolled back to previous version.');

    return { success: false, error: error.message };
  }
}

/**
 * Checks if a platform update is available by reading the update JSON file.
 * @returns Promise resolving to update info or null if not available
 */
export async function checkPlatformAvailableForUpdate(): Promise<IPlatformCheckForUpdate | null> {
  try {
    const exist = await fs.pathExists(updateJsonDir);
    if (exist) return (await fs.readJSONSync(updateJsonDir)) as IPlatformCheckForUpdate;
    else return null;
  } catch (error: any) {
    log.error('Checking platform available version failed:', error?.message);
    return null;
  }
}

/**
 * Updates the platform update JSON file with new information.
 * @param payload - Partial update information to write
 */
export async function platformUpdateJson(payload: Partial<IPlatformCheckForUpdate>) {
  try {
    fs.writeJSONSync(updateJsonDir, payload);
    log.log('Update json file successfully');
  } catch (error: any) {
    log.error('Update json file error: ', error?.message);
  }
}
