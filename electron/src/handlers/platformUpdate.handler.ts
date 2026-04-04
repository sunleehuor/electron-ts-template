import {
  checkPlatformAvailableForUpdate,
  platformHandleBackup,
  platformUpdate,
  platformUpdateJson,
} from '@/services/platformUpdate.service';
import { compareVersion } from '@/utils/utils';
import {
  IPC_PLATFORM_CHECK_FOR_UPDATE,
  IPC_PLATFORM_CONFIRM_DOWNLOAD,
  IPC_PLATFORM_CONFIRM_UPDATE,
  IPC_PLATFORM_SOURCE_DOWNLOAD,
  IPC_PLATFORM_UPDATE_ERROR,
  IPC_PLATFORM_UPDATE_ON_PROGRESS,
} from '@shared/constant/ipc.constant';
import { IPlatformCheckForUpdate, IPlatformUpdateProgress } from '@shared/types/platformUpdate';
import { BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

/**
 * Initializes the platform update IPC handlers.
 * @param mainWindow - The main BrowserWindow instance
 */
export function initPlatformUpdateHandler(mainWindow: BrowserWindow | null) {
  /**
   * Sends platform update progress events to the renderer process.
   * @param payload - The progress update payload
   */
  function platformUpdateProgressEvent(payload: IPlatformUpdateProgress) {
    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ON_PROGRESS, payload);
  }

  // Handle checking for platform updates
  ipcMain.handle(
    IPC_PLATFORM_CHECK_FOR_UPDATE,
    async (_, url: string): Promise<Partial<IPlatformCheckForUpdate> | null> => {
      try {
        const updateJson = await checkPlatformAvailableForUpdate();
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch update info');
        const responseJson = await response.json();
        log.log('Platform check update available', updateJson, responseJson);
        if (updateJson) {
          // Compare version is current version not latest
          if (compareVersion(updateJson.version, responseJson.version) < 0) {
            await platformUpdateJson(responseJson);
            return responseJson;
          }
          return null;
        }
        await platformUpdateJson(responseJson);
        return responseJson;
      } catch (error: any) {
        log.error('Check update failed:', error?.message);
        mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
        return null;
      }
    }
  );

  // Handle confirming download and downloading update source
  ipcMain.on(IPC_PLATFORM_CONFIRM_DOWNLOAD, async (_, url: string) => {
    try {
      // 1. Download using native fetch
      platformUpdateProgressEvent({
        percent: 0,
        status: 'Pending',
      });
      const downloadResponse = await fetch(url);
      if (!downloadResponse.ok) throw new Error('Download failed');
      const buf = await downloadResponse.arrayBuffer();
      await platformHandleBackup(buf);
      platformUpdateProgressEvent({
        percent: 100,
        status: 'Downloaded',
      });
      mainWindow?.webContents?.send(IPC_PLATFORM_SOURCE_DOWNLOAD);
      log.log('Confirm download ok');
    } catch (error: any) {
      platformUpdateProgressEvent({
        percent: 0,
        status: 'Failed',
      });
      log.error('Confirm download failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
    }
  });

  // Handle accepting and applying the update
  ipcMain.handle(IPC_PLATFORM_CONFIRM_UPDATE, async (_) => {
    try {
      return await platformUpdate();
    } catch (error: any) {
      log.error('Confirm update failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
      throw error;
    }
  });
}
