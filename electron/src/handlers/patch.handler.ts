import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, UPDATE_DOWNLOADED } from 'electron-updater';
import { wait } from '@/utils/utils';
import { IPatchProgressing } from '@shared/types/patch';
import {
  IPC_CHECK_FOR_UPDATE,
  IPC_CONFIRM_DOWNLOAD,
  IPC_QUIT_AND_INSTALL,
  IPC_UPDATE_AVAILABLE,
  IPC_UPDATE_DOWNLOADED,
  IPC_UPDATE_ERROR,
  IPC_UPDATE_NOT_AVAILABLE,
  IPC_UPDATE_PROGRESS,
} from '@shared/constant/ipc.constant';

export function initPatchHandler(mainWindow: BrowserWindow) {
  // config
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  // IPC listener: React calls this to check for updates
  ipcMain.on(IPC_CHECK_FOR_UPDATE, async (_, url) => {
    try {
      autoUpdater.setFeedURL({
        url: url,
        provider: 'generic',
      });
      autoUpdater.autoDownload = false;
      await autoUpdater.checkForUpdates();
      console.log('Checking');
    } catch (e: any) {
      console.error('Checking error', e?.message);
      mainWindow.webContents.send(IPC_UPDATE_ERROR, e?.message || '');
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    mainWindow.webContents.send(IPC_UPDATE_ERROR, err.message);
  });

  // Emit update available
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send(IPC_UPDATE_AVAILABLE);
  });

  // Emit no update
  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send(IPC_UPDATE_NOT_AVAILABLE);
  });

  // Confirm updates
  ipcMain.on(IPC_CONFIRM_DOWNLOAD, async () => {
    try {
      await autoUpdater.downloadUpdate();
    } catch (e: any) {
      console.error('Confirm update', e?.message);
      mainWindow.webContents.send(IPC_UPDATE_ERROR, e?.message || '');
    }
  });

  // Progress while downloading
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send(IPC_UPDATE_PROGRESS, {
      percent: Math.floor(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
    } as IPatchProgressing);
  });

  // When download finishes
  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send(IPC_UPDATE_DOWNLOADED);
  });

  // IPC to install after user confirms
  ipcMain.on(IPC_QUIT_AND_INSTALL, async () => {
    try {
      console.log('[Updater] Preparing to install update...');

      // Small delay to ensure Windows releases locks
      await wait(1000);

      console.log('[Updater] Running quitAndInstall...');
      // quitAndInstall handles quitting internally
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      console.error('[Updater] Error during quit-and-install:', err);
    }
  });
}
