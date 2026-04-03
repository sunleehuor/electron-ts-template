import { BrowserWindow } from 'electron';
import { initBadgeService } from '@/services/badge.service';
import { initPlatformUpadateService } from './platformUpdate.service';

export function initService(win: BrowserWindow | null) {
  initBadgeService(win);
  initPlatformUpadateService(win);
}
