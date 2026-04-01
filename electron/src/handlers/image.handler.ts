import { IPC_COPY_IMAGE, IPC_OPEN_FOLDER, IPC_SAVE_AS_IMAGE } from '@shared/constant/ipc.constant';

const { ipcMain, BrowserWindow } = require('electron');
const { saveAsImage, copyImage, onOpenFolder } = require('@/services/image.service');

export function initImageHandler() {
  ipcMain.handle(IPC_SAVE_AS_IMAGE, async (event: any, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return await saveAsImage(win, url);
  });
  ipcMain.handle(IPC_COPY_IMAGE, async (_: any, url: string) => {
    return await copyImage(url);
  });
  ipcMain.handle(IPC_OPEN_FOLDER, async (_: any, path: string) => {
    return await onOpenFolder?.(path);
  });
}
