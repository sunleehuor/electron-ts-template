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
import { clearSlotCacheIfLarge, releaseSlot } from '@/services/slot.service';

let mainWindow: BrowserWindow | null = null;

// Clean stale lock before anything
cleanStaleLock();

function quitApp() {
  releaseLock();
  app.quit();
}

async function bootstrap() {
  // Create splash screen
  const splash = createSplashWindow();

  await doAfterSplashScreen();
  const slotId = await getSlotId();
  if (!slotId) return;

  // Check and clear cache size
  await clearSlotCacheIfLarge(slotId);

  // Create main window
  mainWindow = createWindow(slotId);

  // Listen for creating window event
  onCreateWindow(mainWindow, splash);

  // Initialize services and handlers
  initService(mainWindow);
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
  quitApp();
});

process.on('unhandledRejection', (err) => {
  log.error('[Process] Unhandled rejection:', err);
  quitApp();
});

process.on('SIGTERM', quitApp);
process.on('SIGINT', quitApp);
