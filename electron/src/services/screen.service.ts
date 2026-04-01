import { BrowserWindow } from 'electron';
import path from 'path';
import { IS_DEV } from '@/constant/app.constant';
import { wait } from '@/utils/utils';

export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'app.asar.unpacked', 'index.html'));
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
