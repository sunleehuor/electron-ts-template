import { platformHandleBackup, platformUpdate } from '@/services/platformUpdate.service';
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
  ipcMain.handle(IPC_PLATFORM_CHECK_FOR_UPDATE, async (_, url: string): Promise<IPlatformCheckForUpdate | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch update info');
      Logger.log('Platform check update available');
      return await response.json();
    } catch (error: any) {
      Logger.error('Check update failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
      return null;
    }
  });

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
