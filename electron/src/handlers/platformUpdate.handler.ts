import { platformHandleBackup, platformUpdate } from '@/services/platformUpdate.service';
import {
  IPC_PLATFORM_CHECK_FOR_UPDATE,
  IPC_PLATFORM_CONFIRM_DOWNLOAD,
  IPC_PLATFORM_CONFIRM_UPDATE,
  IPC_PLATFORM_UPDATE_ERROR,
} from '@shared/constant/ipc.constant';
import { IPlatformCheckForUpdate } from '@shared/types/platformUpdate';
import { BrowserWindow, ipcMain } from 'electron';

export function initPlatformUpdateHandler(mainWindow: BrowserWindow | null) {
  // Check platform update available
  ipcMain.handle(IPC_PLATFORM_CHECK_FOR_UPDATE, async (_, url: string): Promise<IPlatformCheckForUpdate | null> => {
    try {
      console.log('sahdjas');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch update info');
      return await response.json();
    } catch (error: any) {
      console.error('Check update failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
      return null;
    }
  });

  // Confirm to update and download source platform
  ipcMain.on(IPC_PLATFORM_CONFIRM_DOWNLOAD, async (_, url: string) => {
    try {
      // 1. Download using native fetch
      const downloadResponse = await fetch(url);
      if (!downloadResponse.ok) throw new Error('Download failed');
      const buf = await downloadResponse.arrayBuffer();
      await platformHandleBackup(buf);
      console.log('ok');
    } catch (error: any) {
      console.error('Confirm download failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
    }
  });

  // Accept and update
  ipcMain.on(IPC_PLATFORM_CONFIRM_UPDATE, async (_, url: string) => {
    try {
      // 1. Download using native fetch
      await platformUpdate();
      console.log('replace ok');
    } catch (error: any) {
      console.error('Confirm update failed:', error?.message);
      mainWindow?.webContents.send(IPC_PLATFORM_UPDATE_ERROR, error?.message);
    }
  });
}
