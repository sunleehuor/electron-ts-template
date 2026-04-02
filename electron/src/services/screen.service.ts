import { IS_DEV, MAX_INSTANCES } from '@/constant/app.constant';
import { wait } from '@/utils/utils';
import { app, BrowserWindow, dialog, safeStorage } from 'electron';
import log from 'electron-log';
import path from 'path';
import { acquireSlot } from './slot.service';

// mark app start time
const startTime = Date.now();
log.info(`[Startup] App process started: 0ms`);

export function onCreateWindow(mainWindow: BrowserWindow, splashWindow: BrowserWindow) {
  log.info(`[Startup] BrowserWindow created: ${Date.now() - startTime}ms`);

  mainWindow.webContents.on('did-start-loading', () => {
    log.info(`[Startup] did-start-loading: ${Date.now() - startTime}ms`);
  });

  mainWindow.webContents.on('did-start-navigation', () => {
    log.info(`[Startup] did-start-navigation: ${Date.now() - startTime}ms`);
  });

  mainWindow.webContents.on('dom-ready', () => {
    log.info(`[Startup] dom-ready: ${Date.now() - startTime}ms`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log.info(`[Startup] did-finish-load: ${Date.now() - startTime}ms`);
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    log.info(`[Startup] did-fail-load: ${code} ${desc}`);
  });

  mainWindow.once('ready-to-show', () => {
    log.info(`[Startup] ready-to-show: ${Date.now() - startTime}ms`);
    splashWindow?.close?.();
    mainWindow.show();
  });
}

export function createWindow(slotId: number): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: IS_DEV,
      partition: `persist:slot-${slotId}`,
    },
    show: false,
  });

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'renderer', 'index.html'));
  }
  return mainWindow;
}

export function createSplashWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'screens', 'splash-screen.html'));
  return mainWindow;
}

export async function doAfterSplashScreen() {
  await wait(1000);
}

export async function getSlotId(): Promise<number | undefined> {
  // warn if encryption unavailable (Linux without keyring)
  if (process.platform === 'linux' && !safeStorage.isEncryptionAvailable()) {
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      title: 'Security Warning',
      message: 'Secure storage unavailable.\n' + 'Install gnome-keyring for full security.',
      buttons: ['Continue', 'Quit'],
    });
    if (response === 1) {
      app.quit();
      return undefined;
    }
  }

  // acquire slot
  const slotId = await acquireSlot();

  if (!slotId) {
    await dialog.showMessageBox({
      type: 'warning',
      title: 'Max Instances Reached',
      message: `Maximum ${MAX_INSTANCES} instance(s) allowed.`,
      buttons: ['OK'],
    });
    app.quit();
    return undefined;
  }

  return slotId;
}
