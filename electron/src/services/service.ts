import { BrowserWindow } from 'electron';
import { initBadgeService } from '@/services/badge.service';
import { initPlatformUpdateService } from '@/services/platformUpdate.service';

export function initService(win: BrowserWindow | null) {
  initBadgeService(win);
  initPlatformUpdateService(win);
}
