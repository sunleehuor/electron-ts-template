import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs-extra';
import { dirname, join } from 'path';
import extract from 'extract-zip';
import { IPC_PLATFORM_UPDATE_ERROR } from '@shared/constant/ipc.constant';

// State
const rendererDir = join(app.getPath('userData'), 'renderer');
const backupDir = join(app.getPath('userData'), 'renderer-backup');
const corruptMarker = join(app.getPath('userData'), '.renderer-corrupt');
let mainWindow: BrowserWindow | null = null;
const tempZipPath = join(app.getPath('temp'), `renderer-update-${Date.now()}.zip`);

//
export function initPlatformUpadateService(win: BrowserWindow | null) {
  mainWindow = win;
}

export async function copyRendererToUserData() {
  try {
    const src = join(process.resourcesPath, 'renderer');
    const dest = join(app.getPath('userData'), 'renderer');

    // Ensure destination parent exists
    await fs.ensureDir(dirname(dest));

    // Remove old renderer (optional but recommended)
    if (await fs.pathExists(dest)) {
      await fs.remove(dest);
    }

    // Copy renderer
    await fs.copy(src, dest, {
      overwrite: true,
      errorOnExist: false,
    });

    console.log('Renderer copied to userData');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to copy renderer:', err);
    return { success: false, error: err.message };
  }
}

// Restore backup if previous update failed
export async function retorePlatformUpdateBackup() {
  try {
    if (fs.existsSync(backupDir)) {
      await fs.remove(rendererDir);
      await fs.copy(backupDir, rendererDir);
      console.log('Successfully rolled back renderer folder');
    }
  } catch (err) {
    console.error('Rollback failed:', err);
  }
}

// Auto rollback on startup if previous update failed
export async function checkForCorruptionAndRollback() {
  if (fs.existsSync(corruptMarker)) {
    console.log('Detected failed update. Restoring backup...');
    retorePlatformUpdateBackup();
    fs.removeSync(corruptMarker);

    dialog.showMessageBox({
      type: 'warning',
      title: 'Update Recovery',
      message: 'The previous update failed.\nThe application has been restored to the last working version.',
    });
  }
}

export async function platformHandleBackup(buffer: ArrayBuffer) {
  try {
    //   sendStatus('Downloading new version...');
    console.log('Downloading new version...');

    // 1. Download using native fetch
    fs.writeFileSync(tempZipPath, Buffer.from(buffer));

    // sendStatus('Backing up current version...');
    console.log('Backing up current version...');

    // 2. Backup
    if (fs.existsSync(rendererDir)) {
      await fs.copy(rendererDir, backupDir, { overwrite: true });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update failed:', error);

    await retorePlatformUpdateBackup();
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

    // sendStatus('Closing window to release file locks...');
    console.log('Closing window to release file locks...');

    // Close main window to release file handles
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // sendStatus('Extracting new files...');
    console.log('Extracting new files...');

    // 4. Replace renderer folder
    await fs.remove(rendererDir);
    await extract(tempZipPath, { dir: rendererDir });

    // 5. Cleanup
    fs.removeSync(tempZipPath);
    if (fs.existsSync(backupDir)) fs.removeSync(backupDir);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    // sendStatus('Update successful! Restarting application...');
    console.log('Update successful! Restarting application...');

    // Recreate window
    // recreateMainWindow();

    return { success: true };
  } catch (error: any) {
    console.error('Update failed:', error);

    await retorePlatformUpdateBackup();
    if (fs.existsSync(tempZipPath)) fs.removeSync(tempZipPath);
    if (fs.existsSync(corruptMarker)) fs.removeSync(corruptMarker);

    // sendStatus('Update failed. Rolled back to previous version.');
    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ERROR, 'Update failed. Rolled back to previous version.');
    // recreateMainWindow();

    return { success: false, error: error.message };
  }
}
