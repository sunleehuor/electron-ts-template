import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  //   if (process.env.NODE_ENV === 'development') {
  // mainWindow.loadURL('http://localhost:5173'); // Vite / React
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));
  mainWindow.webContents.openDevTools();
  //   } else {
  //   }

  //   mainWindow.on('closed', () => {
  //     mainWindow = null;
  //   });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
