import { BrowserWindow } from 'electron';
import { initBadgeService } from '@/services/badge.service';

export function initService(win: BrowserWindow | null) {
  initBadgeService(win);
}
