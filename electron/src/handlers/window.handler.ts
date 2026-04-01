import { ipcMain } from 'electron';
import { getAppName, getAppVersion, getMachineIdentifier } from '@/services/window.service';
import { IPC_GET_APP_VERSION, IPC_GET_DEVICE_ID, IPC_GET_DEVICE_NAME } from '@shared/constant/ipc.constant';

export function initWindowHandler() {
  ipcMain.handle(IPC_GET_DEVICE_ID, async (_) => {
    return await getMachineIdentifier();
  });

  ipcMain.handle(IPC_GET_DEVICE_NAME, async (_) => {
    return await getAppName();
  });

  ipcMain.handle(IPC_GET_APP_VERSION, async (_) => {
    return await getAppVersion();
  });
}
