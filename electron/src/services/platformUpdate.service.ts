import { IPC_PLATFORM_UPDATE_ERROR } from '@shared/constant/ipc.constant';
import { app, BrowserWindow, dialog } from 'electron';
import extract from 'extract-zip';
import fs from 'fs-extra';
import { dirname, join } from 'path';
import Logger = require('electron-log');
import { IPlatformCheckForUpdate } from '@shared/types/platformUpdate';

// State
let mainWindow: BrowserWindow | null = null;
const updateJsonDir = join(app.getPath('userData'), 'updates.json');
const rendererDir = join(app.getPath('userData'), 'renderer');
const backupDir = join(app.getPath('userData'), 'renderer-backup');
const corruptMarker = join(app.getPath('userData'), '.renderer-corrupt');
const tempZipPath = join(app.getPath('temp'), `renderer-update-application.zip`);

export function initPlatformUpadateService(win: BrowserWindow | null) {
  mainWindow = win;
}

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

    Logger.log('Renderer copied to userData');
    return { success: true };
  } catch (err: any) {
    Logger.error('Failed to copy renderer:', err);
    return { success: false, error: err.message };
  }
}

// Restore backup if previous update failed
export async function restorePlatformUpdateBackup() {
  try {
    if (fs.existsSync(backupDir)) {
      await fs.remove(rendererDir);
      await fs.copy(backupDir, rendererDir);
      Logger.log('Successfully rolled back renderer folder');
    }
  } catch (err) {
    Logger.error('Rollback failed:', err);
  }
}

// Auto rollback on startup if previous update failed
export async function checkForCorruptionAndRollback() {
  try {
    if (fs.existsSync(corruptMarker)) {
      Logger.log('Detected failed update. Restoring backup...');
      await restorePlatformUpdateBackup();
      fs.removeSync(corruptMarker);

      dialog.showMessageBox({
        type: 'warning',
        title: 'Update Recovery',
        message: 'The previous update failed.\nThe application has been restored to the last working version.',
      });
    }
  } catch {}
}

export async function platformHandleBackup(buffer: ArrayBuffer) {
  try {
    // 1. Download using native fetch
    fs.writeFileSync(tempZipPath, Buffer.from(buffer));

    Logger.log('Backing up current version...');

    // 2. Backup
    if (fs.existsSync(rendererDir)) {
      await fs.copy(rendererDir, backupDir, { overwrite: true });
    }

    return { success: true };
  } catch (error: any) {
    Logger.error('Update failed:', error);

    await restorePlatformUpdateBackup();
    if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    // sendStatus('Update failed. Rolled back to previous version.');
    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ERROR, 'Update failed. Rolled back to previous version.');
    // recreateMainWindow();

    return { success: false, error: error.message };
  }
}

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
    Logger.log('Update successful! Restarting application...');

    return { success: true };
  } catch (error: any) {
    Logger.error('Update failed:', error);

    await restorePlatformUpdateBackup();
    if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ERROR, 'Update failed. Rolled back to previous version.');

    return { success: false, error: error.message };
  }
}

export async function checkPlatformAvailableForUpdate(): Promise<IPlatformCheckForUpdate | null> {
  try {
    const exist = await fs.pathExists(updateJsonDir);
    if (exist) return (await fs.readJSONSync(updateJsonDir)) as IPlatformCheckForUpdate;
    else return null;
  } catch (e: any) {
    Logger.error('Checking platform availble version failed:', e?.message);
    return null;
  }
}

export async function platformUpdateJson(payload: Partial<IPlatformCheckForUpdate>) {
  try {
    fs.writeJSONSync(updateJsonDir, payload);
    Logger.log('Update json file successfully');
  } catch (e: any) {
    Logger.error('Update json file error: ', e?.message);
  }
}
