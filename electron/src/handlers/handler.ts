import { BrowserWindow } from 'electron';
import { initBadgeHandler } from '@/handlers/badge.handler';
import { initDownloaderHandler } from '@/handlers/download.handler';
import { initImageHandler } from '@/handlers/image.handler';
import { initPatchHandler } from '@/handlers/patch.handler';
import { initWindowHandler } from '@/handlers/window.handler';
import { initSlotHandler } from './slot.handler';
import { initStorageHandler } from './storage.handler';

export function initHandler(win: BrowserWindow, pId: number) {
  // Handler
  initBadgeHandler();
  initWindowHandler();
  initImageHandler();
  initDownloaderHandler();
  initPatchHandler(win);
  initSlotHandler(pId);
  initStorageHandler(pId);
}
