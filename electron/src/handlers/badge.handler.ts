import { ipcMain } from 'electron';
import { IPC_SET_BADGE } from '@shared/constant/ipc.constant';
import { setBadge } from '@/services/badge.service';

export function initBadgeHandler() {
  ipcMain.handle(IPC_SET_BADGE, (_, amount: number) => {
    return setBadge(amount);
  });
}
