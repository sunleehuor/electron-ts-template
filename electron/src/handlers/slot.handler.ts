import { IPC_SLOT_ID } from '@shared/constant/ipc.constant';
import { ipcMain } from 'electron';

const registered = new Set<string>();

function handle(channel: string, handler: (...args: any[]) => any) {
  if (registered.has(channel)) ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
  registered.add(channel);
}

export function initSlotHandler(slotId: number): void {
  handle(IPC_SLOT_ID, () => slotId);
}
