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
import Logger from 'electron-log';

export function initPlatformUpdateHandler(mainWindow: BrowserWindow | null) {
  function platformUpdateProgressEvent(payload: IPlatformUpdateProgress) {
    mainWindow?.webContents?.send(IPC_PLATFORM_UPDATE_ON_PROGRESS, payload);
  }

  // Check platform update available
  ipcMain.handle(
    IPC_PLATFORM_CHECK_FOR_UPDATE,
    async (_, url: string): Promise<Partial<IPlatformCheckForUpdate> | null> => {
      try {
        const updateJson = await checkPlatformAvailableForUpdate();
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch update info');
        const responseJson = await response.json();
        Logger.log('Platform check update available', updateJson, responseJson);
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
        Logger.error('Check update failed:', error?.message);
        mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
        return null;
      }
    }
  );

  // Confirm to update and download source platform
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
      Logger.log('Confirm download ok');
    } catch (error: any) {
      platformUpdateProgressEvent({
        percent: 0,
        status: 'Failed',
      });
      Logger.error('Confirm download failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
    }
  });

  // Accept and update
  ipcMain.handle(IPC_PLATFORM_CONFIRM_UPDATE, async (_) => {
    try {
      return await platformUpdate();
    } catch (error: any) {
      Logger.error('Confirm update failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
      throw error;
    }
  });
}
