import { ipcMain } from 'electron';
import { storageSet, storageGet, storageUpdate, storageDeleteKey, storageClear } from '@/services/storage.service';
import {
  IPC_STORAGE_CLEAR,
  IPC_STORAGE_DELETE_KEY,
  IPC_STORAGE_GET,
  IPC_STORAGE_SET,
  IPC_STORAGE_UPDATE,
} from '@shared/constant/ipc.constant';

const registered = new Set<string>();

function handle(channel: string, handler: (...args: any[]) => any) {
  if (registered.has(channel)) ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
  registered.add(channel);
}

export function initStorageHandler(slotId: number): void {
  handle(IPC_STORAGE_SET, (_e, data) => storageSet(slotId, data));
  handle(IPC_STORAGE_GET, () => storageGet(slotId));
  handle(IPC_STORAGE_UPDATE, (_e, partial) => storageUpdate(slotId, partial));
  handle(IPC_STORAGE_DELETE_KEY, (_e, key) => storageDeleteKey(slotId, key));
  handle(IPC_STORAGE_CLEAR, () => storageClear(slotId));
}
