import { initHandler } from '@/handlers/handler';
import { cleanStaleLock, releaseLock } from '@/services/lock.service';
import {
  createSplashWindow,
  createWindow,
  doAfterSplashScreen,
  getSlotId,
  onCreateWindow,
} from '@/services/screen.service';
import { initService } from '@/services/service';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { clearSlotCacheIfLarge, releaseSlot } from './services/slot.service';

let mainWindow: BrowserWindow | null = null;

// clean stale lock before anything
cleanStaleLock();

async function bootstrap() {
  // Splash screen
  const splash = createSplashWindow();

  await doAfterSplashScreen();
  const slotId = await getSlotId();
  if (!slotId) return;

  // Check and clear cache size
  await clearSlotCacheIfLarge(slotId);

  // Create main screen window
  mainWindow = createWindow(slotId);

  // Listen creating window event
  onCreateWindow(mainWindow, splash);

  // Init service
  initService(mainWindow!);

  // Init handler
  initHandler(mainWindow, slotId);

  mainWindow.on('close', () => releaseSlot(slotId));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(slotId);
    }
  });
}

// App lifecycle
app.on('ready', bootstrap);

app.on('before-quit', releaseLock);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
process.on('uncaughtException', (err) => {
  log.error('[Process] Uncaught exception:', err);
  releaseLock();
  app.quit();
});

process.on('unhandledRejection', (err) => {
  log.error('[Process] Unhandled rejection:', err);
  releaseLock();
  app.quit();
});

process.on('SIGTERM', () => {
  releaseLock();
  app.quit();
});
process.on('SIGINT', () => {
  releaseLock();
  app.quit();
});
